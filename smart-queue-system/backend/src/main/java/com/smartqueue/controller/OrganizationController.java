package com.smartqueue.controller;

import com.smartqueue.model.Organization;
import com.smartqueue.model.Service;
import com.smartqueue.model.Token;
import com.smartqueue.repository.OrganizationRepository;
import com.smartqueue.repository.ServiceRepository;
import com.smartqueue.repository.TokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OrganizationController {

    @Autowired private OrganizationRepository orgRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private TokenRepository tokenRepository;

    @GetMapping("/organizations")
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(orgRepository.findByActiveTrue());
    }

    @GetMapping("/organizations/{id}")
    public ResponseEntity<Organization> getOrganization(@PathVariable Long id) {
        return orgRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/organizations/{id}/services")
    public ResponseEntity<List<Service>> getServices(@PathVariable Long id) {
        return ResponseEntity.ok(serviceRepository.findByOrganizationIdAndActiveTrue(id));
    }

    @PostMapping("/admin/organizations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addOrganization(@RequestBody Organization org) {
        org.setActive(true);
        return ResponseEntity.ok(orgRepository.save(org));
    }

    @PutMapping("/admin/organizations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrganization(@PathVariable Long id, @RequestBody Organization updated) {
        return orgRepository.findById(id).map(org -> {
            org.setName(updated.getName());
            org.setType(updated.getType());
            org.setOpenTime(updated.getOpenTime());
            org.setCloseTime(updated.getCloseTime());
            org.setOpenSunday(updated.isOpenSunday());
            org.setOpen24Hours(updated.isOpen24Hours());
            org.setDailyTokenLimit(updated.getDailyTokenLimit());
            org.setActive(updated.isActive());
            return ResponseEntity.ok(orgRepository.save(org));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/organizations/{id}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getOrganizationStats(@PathVariable Long id) {
        LocalDate today = LocalDate.now();
        int totalTokens = tokenRepository.countByOrganizationIdAndTokenDate(id, today);
        int usedTokens = tokenRepository.countByOrganizationIdAndTokenDateAndStatusIn(
                id, today, List.of(Token.TokenStatus.COMPLETED, Token.TokenStatus.SERVING));
        
        Organization org = orgRepository.findById(id).orElseThrow();
        int remainingTokens = org.getDailyTokenLimit() - totalTokens;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTokens", totalTokens);
        stats.put("usedTokens", usedTokens);
        stats.put("remainingTokens", Math.max(0, remainingTokens));
        stats.put("dailyLimit", org.getDailyTokenLimit());
        stats.put("waitingTokens", tokenRepository.countByOrganizationIdAndTokenDateAndStatus(
                id, today, Token.TokenStatus.WAITING));
        stats.put("cancelledTokens", tokenRepository.countByOrganizationIdAndTokenDateAndStatus(
                id, today, Token.TokenStatus.CANCELLED));
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/admin/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAnalytics() {
        List<Organization> orgs = orgRepository.findAll();
        return ResponseEntity.ok(Map.of("organizations", orgs.size(), "message", "Analytics data"));
    }

    @PostMapping("/admin/organizations/{orgId}/services")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addService(@PathVariable Long orgId, @RequestBody Service service) {
        return orgRepository.findById(orgId).map(org -> {
            service.setOrganization(org);
            service.setActive(true);
            return ResponseEntity.ok(serviceRepository.save(service));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/admin/services/{serviceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateService(@PathVariable Long serviceId, @RequestBody Service updated) {
        return serviceRepository.findById(serviceId).map(service -> {
            service.setName(updated.getName());
            service.setDescription(updated.getDescription());
            service.setAvgServiceTimeMinutes(updated.getAvgServiceTimeMinutes());
            return ResponseEntity.ok(serviceRepository.save(service));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/admin/services/{serviceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteService(@PathVariable Long serviceId) {
        return serviceRepository.findById(serviceId).map(service -> {
            service.setActive(false); // Soft delete - organization remains intact
            serviceRepository.save(service);
            return ResponseEntity.ok(Map.of("message", "Service deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
