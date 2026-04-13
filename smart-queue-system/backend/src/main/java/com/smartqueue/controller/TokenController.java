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
    
    @GetMapping("/staff/daily-report")
    public ResponseEntity<?> getDailyReport(@RequestParam(required = false) String date) {
        LocalDate targetDate;
        if (date != null && !date.isEmpty()) {
            try {
                targetDate = LocalDate.parse(date);
            } catch (Exception e) {
                targetDate = LocalDate.now();
            }
        } else {
            targetDate = LocalDate.now();
        }
        
        // Get all tokens for the date grouped by organization
        var allTokens = tokenRepository.findByTokenDateOrderByOrganizationIdAscCreatedAtAsc(targetDate);
        
        var response = buildReportResponse(allTokens, targetDate, targetDate);
        response.put("reportType", "DAILY");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/staff/weekly-report")
    public ResponseEntity<?> getWeeklyReport(@RequestParam(required = false) String startDate) {
        LocalDate endDate;
        LocalDate start;
        
        if (startDate != null && !startDate.isEmpty()) {
            try {
                start = LocalDate.parse(startDate);
            } catch (Exception e) {
                start = LocalDate.now().minusDays(6);
            }
        } else {
            start = LocalDate.now().minusDays(6); // Last 7 days
        }
        
        endDate = start.plusDays(6);
        
        // Get all tokens for the week
        var allTokens = tokenRepository.findByTokenDateBetweenOrderByOrganizationIdAscCreatedAtAsc(start, endDate);
        
        var response = buildReportResponse(allTokens, start, endDate);
        response.put("reportType", "WEEKLY");
        response.put("startDate", start);
        response.put("endDate", endDate);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/staff/monthly-report")
    public ResponseEntity<?> getMonthlyReport(@RequestParam(required = false) String month) {
        LocalDate startDate;
        LocalDate endDate;
        
        if (month != null && !month.isEmpty()) {
            try {
                // Expecting format: YYYY-MM
                startDate = LocalDate.parse(month + "-01");
            } catch (Exception e) {
                startDate = LocalDate.now().withDayOfMonth(1);
            }
        } else {
            startDate = LocalDate.now().withDayOfMonth(1); // First day of current month
        }
        
        endDate = startDate.plusMonths(1).minusDays(1); // Last day of month
        
        // Get all tokens for the month
        var allTokens = tokenRepository.findByTokenDateBetweenOrderByOrganizationIdAscCreatedAtAsc(startDate, endDate);
        
        var response = buildReportResponse(allTokens, startDate, endDate);
        response.put("reportType", "MONTHLY");
        response.put("month", startDate.getMonth().toString());
        response.put("year", startDate.getYear());
        
        return ResponseEntity.ok(response);
    }
    
    private java.util.Map<String, Object> buildReportResponse(List<Token> allTokens, LocalDate startDate, LocalDate endDate) {
        // Group by organization
        var reportByOrg = new java.util.HashMap<String, java.util.Map<String, Object>>();
        
        for (Token token : allTokens) {
            String orgName = token.getOrganization().getName();
            
            if (!reportByOrg.containsKey(orgName)) {
                var orgData = new java.util.HashMap<String, Object>();
                orgData.put("organizationId", token.getOrganization().getId());
                orgData.put("organizationName", orgName);
                orgData.put("organizationType", token.getOrganization().getType());
                orgData.put("location", token.getOrganization().getLocation());
                orgData.put("totalTokens", 0);
                orgData.put("attended", 0);
                orgData.put("absent", 0);
                orgData.put("waiting", 0);
                orgData.put("serving", 0);
                orgData.put("tokens", new java.util.ArrayList<java.util.Map<String, Object>>());
                reportByOrg.put(orgName, orgData);
            }
            
            var orgData = reportByOrg.get(orgName);
            orgData.put("totalTokens", (int) orgData.get("totalTokens") + 1);
            
            // Count by status
            if (token.getStatus() == TokenStatus.COMPLETED) {
                orgData.put("attended", (int) orgData.get("attended") + 1);
            } else if (token.getStatus() == TokenStatus.CANCELLED) {
                orgData.put("absent", (int) orgData.get("absent") + 1);
            } else if (token.getStatus() == TokenStatus.WAITING) {
                orgData.put("waiting", (int) orgData.get("waiting") + 1);
            } else if (token.getStatus() == TokenStatus.SERVING) {
                orgData.put("serving", (int) orgData.get("serving") + 1);
            }
            
            // Add token details
            var tokenDetails = new java.util.HashMap<String, Object>();
            tokenDetails.put("tokenNumber", token.getTokenNumber());
            tokenDetails.put("customerName", token.getUser().getName());
            tokenDetails.put("customerEmail", token.getUser().getEmail());
            tokenDetails.put("phoneNumber", token.getPhoneNumber());
            tokenDetails.put("serviceName", token.getService().getName());
            tokenDetails.put("status", token.getStatus().name());
            tokenDetails.put("appointmentTime", token.getAppointmentTime());
            tokenDetails.put("tokenDate", token.getTokenDate());
            tokenDetails.put("createdAt", token.getCreatedAt());
            tokenDetails.put("completedAt", token.getCompletedAt());
            tokenDetails.put("calledAt", token.getCalledAt());
            
            @SuppressWarnings("unchecked")
            var tokensList = (java.util.List<java.util.Map<String, Object>>) orgData.get("tokens");
            tokensList.add(tokenDetails);
        }
        
        var response = new java.util.HashMap<String, Object>();
        response.put("startDate", startDate);
        response.put("endDate", endDate);
        response.put("totalOrganizations", reportByOrg.size());
        response.put("organizations", new java.util.ArrayList<>(reportByOrg.values()));
        
        return response;
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
