package com.smartqueue.controller;

import com.smartqueue.dto.AuthDTOs.*;
import com.smartqueue.model.Token;
import com.smartqueue.model.Token.TokenStatus;
import com.smartqueue.repository.TokenRepository;
import com.smartqueue.repository.UserRepository;
import com.smartqueue.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tokens")
public class TokenController {

    @Autowired private TokenService tokenService;
    @Autowired private TokenRepository tokenRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/availability/{orgId}")
    public ResponseEntity<?> checkAvailability(@PathVariable Long orgId) {
        return ResponseEntity.ok(tokenService.checkAvailability(orgId));
    }
    
    @GetMapping("/available-slots/{serviceId}")
    public ResponseEntity<?> getAvailableTimeSlots(
            @PathVariable Long serviceId,
            @RequestParam String date) {
        try {
            return ResponseEntity.ok(tokenService.getAvailableTimeSlots(serviceId, date));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateToken(@RequestBody TokenRequest req, Authentication auth) {
        try {
            return ResponseEntity.ok(tokenService.generateToken(req, auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-tokens")
    public ResponseEntity<List<Token>> myTokens(Authentication auth) {
        Long userId = getUserId(auth.getName());
        var tokens = tokenRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // Filter out cancelled tokens older than 24 hours
        LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
        var filteredTokens = tokens.stream()
                .filter(token -> {
                    if (token.getStatus() == TokenStatus.CANCELLED) {
                        return token.getCreatedAt().isAfter(yesterday);
                    }
                    return true;
                })
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(filteredTokens);
    }

    @PutMapping("/edit/{tokenId}")
    public ResponseEntity<?> editToken(@PathVariable Long tokenId, 
                                      @RequestBody Map<String, String> updates,
                                      Authentication auth) {
        try {
            Token token = tokenRepository.findById(tokenId)
                    .orElseThrow(() -> new RuntimeException("Token not found"));
            
            // Verify token belongs to user
            if (!token.getUser().getEmail().equals(auth.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }
            
            // Only allow editing if token is still WAITING
            if (token.getStatus() != TokenStatus.WAITING) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Can only edit waiting tokens"));
            }
            
            // Update phone number if provided
            if (updates.containsKey("phoneNumber")) {
                token.setPhoneNumber(updates.get("phoneNumber"));
            }
            
            tokenRepository.save(token);
            return ResponseEntity.ok(Map.of("message", "Token updated successfully", "token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/cancel/{tokenId}")
    public ResponseEntity<?> cancelToken(@PathVariable Long tokenId, Authentication auth) {
        try {
            Token token = tokenRepository.findById(tokenId)
                    .orElseThrow(() -> new RuntimeException("Token not found"));
            
            // Verify token belongs to user
            if (!token.getUser().getEmail().equals(auth.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }
            
            // Only allow canceling if token is WAITING
            if (token.getStatus() != TokenStatus.WAITING) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Can only cancel waiting tokens"));
            }
            
            token.setStatus(TokenStatus.CANCELLED);
            tokenRepository.save(token);
            return ResponseEntity.ok(Map.of("message", "Token cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{tokenId}")
    public ResponseEntity<?> deleteMyToken(@PathVariable Long tokenId, Authentication auth) {
        try {
            Token token = tokenRepository.findById(tokenId)
                    .orElseThrow(() -> new RuntimeException("Token not found"));
            
            // Verify token belongs to user
            if (!token.getUser().getEmail().equals(auth.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }
            
            // Only allow deleting if token is CANCELLED
            if (token.getStatus() != TokenStatus.CANCELLED) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Can only delete cancelled tokens"));
            }
            
            tokenRepository.deleteById(tokenId);
            return ResponseEntity.ok(Map.of("message", "Token deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats/{orgId}")
    public ResponseEntity<?> getDailyStats(@PathVariable Long orgId) {
        return ResponseEntity.ok(tokenService.getDailyStats(orgId));
    }

    // Staff endpoints
    @PostMapping("/staff/next/{serviceId}")
    public ResponseEntity<?> callNext(@PathVariable Long serviceId) {
        tokenService.callNextToken(serviceId);
        return ResponseEntity.ok(Map.of("message", "Next token called"));
    }

    @PostMapping("/staff/attendance")
    public ResponseEntity<?> markAttendance(@RequestBody AttendanceRequest req) {
        tokenService.markAttendance(req);
        return ResponseEntity.ok(Map.of("message", "Attendance marked"));
    }

    @GetMapping("/staff/queue/{serviceId}")
    public ResponseEntity<?> getQueueForService(@PathVariable Long serviceId,
                                                @RequestParam(required = false) String date) {
        LocalDate targetDate;
        if (date != null && !date.isEmpty()) {
            try {
                targetDate = LocalDate.parse(date);
            } catch (Exception e) {
                targetDate = java.time.LocalDate.now();
            }
        } else {
            targetDate = java.time.LocalDate.now();
        }
        
        // Get all tokens for the target date (WAITING, SERVING, COMPLETED, CANCELLED)
        var tokens = tokenRepository.findByServiceIdAndTokenDateOrderByQueuePosition(
                serviceId, targetDate);
        return ResponseEntity.ok(tokens);
    }

    // Admin endpoints
    @GetMapping("/admin/tokens/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Token>> getAllTokens() {
        return ResponseEntity.ok(tokenRepository.findAllByOrderByCreatedAtDesc());
    }

    @DeleteMapping("/admin/tokens/{tokenId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteToken(@PathVariable Long tokenId) {
        try {
            if (tokenRepository.existsById(tokenId)) {
                tokenRepository.deleteById(tokenId);
                return ResponseEntity.ok(Map.of("message", "Token deleted successfully"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
