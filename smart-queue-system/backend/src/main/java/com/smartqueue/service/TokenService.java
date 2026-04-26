package com.smartqueue.service;

import com.smartqueue.dto.AuthDTOs.*;
import com.smartqueue.model.*;
import com.smartqueue.model.Token.TokenStatus;
import com.smartqueue.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.*;

@Service
public class TokenService {

    @Autowired private TokenRepository tokenRepository;
    @Autowired private OrganizationRepository orgRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private EmailService emailService;

    public Map<String, Object> checkAvailability(Long orgId) {
        Organization org = orgRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        Map<String, Object> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        if (org.isOpen24Hours()) {
            result.put("available", true);
            result.put("message", "Open 24 hours");
            return result;
        }

        if (day == DayOfWeek.SUNDAY && !org.isOpenSunday()) {
            result.put("available", false);
            result.put("message", "Closed on Sundays");
            return result;
        }

        if (time.isBefore(org.getOpenTime()) || time.isAfter(org.getCloseTime())) {
            result.put("available", false);
            result.put("message", "Service not available now. Open from " +
                    org.getOpenTime() + " to " + org.getCloseTime());
            return result;
        }

        result.put("available", true);
        result.put("message", "Available");
        return result;
    }
    
    public Map<String, Object> getAvailableTimeSlots(Long serviceId, String dateStr) {
        com.smartqueue.model.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        Organization org = service.getOrganization();
        
        LocalDate requestedDate;
        try {
            requestedDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new RuntimeException("Invalid date format. Use YYYY-MM-DD");
        }
        
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        LocalTime currentTime = now.toLocalTime();
        
        // Set time gap to 15 minutes for all organizations
        int gapMinutes = 15;
        
        // Get service times with fallback to defaults if null
        LocalTime serviceStartTime = service.getServiceStartTime() != null ? 
                service.getServiceStartTime() : LocalTime.of(9, 0);
        LocalTime serviceEndTime = service.getServiceEndTime() != null ? 
                service.getServiceEndTime() : LocalTime.of(17, 0);
        
        // Real-time booking logic:
        // - Before 9 AM: Can book for today or tomorrow
        // - After 9 AM: Can only book for tomorrow
        
        boolean isAfter9AM = currentTime.isAfter(LocalTime.of(9, 0)) || currentTime.equals(LocalTime.of(9, 0));
        boolean canBookToday = !isAfter9AM; // Can book today only before 9 AM
        
        // Validate requested date
        if (requestedDate.isBefore(today)) {
            throw new RuntimeException("Cannot book for past dates");
        }
        
        if (requestedDate.equals(today)) {
            // Trying to book for today
            if (!canBookToday) {
                Map<String, Object> result = new HashMap<>();
                result.put("slots", new ArrayList<>());
                result.put("message", "Booking for today is closed after 9 AM. Please book for tomorrow.");
                result.put("canBookToday", false);
                return result;
            }
        } else if (requestedDate.equals(today.plusDays(1))) {
            // Booking for tomorrow - always allowed
        } else {
            // Trying to book beyond tomorrow
            throw new RuntimeException("Can only book for today (before 9 AM) or tomorrow");
        }
        
        // Generate time slots from service start to end time
        List<Map<String, Object>> slots = new ArrayList<>();
        LocalTime currentSlot = serviceStartTime;
        
        // Get all booked appointments for this service on this date
        List<Token> bookedTokens = tokenRepository.findByServiceIdAndTokenDateOrderByQueuePosition(
                serviceId, requestedDate);
        
        while (currentSlot.isBefore(serviceEndTime)) {
            LocalDateTime slotDateTime = LocalDateTime.of(requestedDate, currentSlot);
            
            // Check if this slot is available
            boolean isAvailable = true;
            
            // If booking for today, check if slot is in the past
            if (requestedDate.equals(today) && slotDateTime.isBefore(now)) {
                isAvailable = false;
            }
            
            // Check against all booked tokens (within gap minutes)
            for (Token token : bookedTokens) {
                if (token.getAppointmentTime() != null) {
                    LocalDateTime bookedTime = token.getAppointmentTime();
                    long minutesDiff = Math.abs(java.time.Duration.between(slotDateTime, bookedTime).toMinutes());
                    
                    if (minutesDiff < gapMinutes) {
                        isAvailable = false;
                        break;
                    }
                }
            }
            
            Map<String, Object> slot = new HashMap<>();
            slot.put("time", currentSlot.toString());
            slot.put("dateTime", slotDateTime.toString());
            slot.put("available", isAvailable);
            slot.put("displayTime", currentSlot.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a")));
            slots.add(slot);
            
            // Move to next slot
            currentSlot = currentSlot.plusMinutes(gapMinutes);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("slots", slots);
        result.put("gapMinutes", gapMinutes);
        result.put("serviceStartTime", serviceStartTime.toString());
        result.put("serviceEndTime", serviceEndTime.toString());
        result.put("canBookToday", canBookToday);
        result.put("currentTime", currentTime.toString());
        
        if (requestedDate.equals(today) && canBookToday) {
            result.put("message", "Booking open for today (before 9 AM)");
        } else if (requestedDate.equals(today.plusDays(1))) {
            result.put("message", "Booking for tomorrow");
        }
        
        return result;
    }

    public TokenResponse generateToken(TokenRequest req, String userEmail) {
        com.smartqueue.model.Service service = serviceRepository.findById(req.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));
        Organization org = orgRepository.findById(req.getOrganizationId())
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Parse user-selected appointment time
        LocalDateTime appointmentTime;
        try {
            appointmentTime = LocalDateTime.parse(req.getAppointmentTime());
        } catch (Exception e) {
            throw new RuntimeException("Invalid appointment time format");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalTime currentTime = now.toLocalTime();
        LocalDate appointmentDate = appointmentTime.toLocalDate();
        LocalTime appointmentTimeOnly = appointmentTime.toLocalTime();
        LocalDate today = LocalDate.now();
        
        // Real-time booking validation with null checks
        LocalTime serviceStartTime = service.getServiceStartTime() != null 
                ? service.getServiceStartTime() 
                : LocalTime.of(9, 0); // Default 9:00 AM
        LocalTime serviceEndTime = service.getServiceEndTime() != null 
                ? service.getServiceEndTime() 
                : LocalTime.of(17, 0); // Default 5:00 PM
        
        // Booking logic: After 9 AM, can only book tomorrow
        // Before 9 AM: Can book today
        boolean isAfter9AM = currentTime.isAfter(LocalTime.of(9, 0)) || currentTime.equals(LocalTime.of(9, 0));
        boolean canBookToday = !isAfter9AM;
        
        // Check if trying to book for today when after 9 AM
        if (appointmentDate.equals(today) && !canBookToday) {
            throw new RuntimeException("Booking for today is closed after 9 AM. Please book for tomorrow.");
        }
        
        // Only allow today (before service starts) or tomorrow
        if (appointmentDate.isBefore(today)) {
            throw new RuntimeException("Cannot book for past dates");
        }
        
        if (appointmentDate.isAfter(today.plusDays(1))) {
            throw new RuntimeException("Can only book for today (before 9 AM) or tomorrow");
        }
        
        // Check if appointment time is within service hours
        if (appointmentTimeOnly.isBefore(serviceStartTime)) {
            throw new RuntimeException("Appointment time must be after service start time: " + 
                    serviceStartTime);
        }
        
        if (appointmentTimeOnly.isAfter(serviceEndTime)) {
            throw new RuntimeException("Appointment time must be before service end time: " + 
                    serviceEndTime);
        }
        
        // Set time gap to 15 minutes for all organizations
        int requiredGapMinutes = 15;
        
        // Check if time slot conflicts with existing appointments (enforce gap)
        LocalDateTime slotStart = appointmentTime.minusMinutes(requiredGapMinutes);
        LocalDateTime slotEnd = appointmentTime.plusMinutes(requiredGapMinutes);
        
        boolean slotTaken = tokenRepository.existsByServiceIdAndAppointmentTimeBetween(
                req.getServiceId(), slotStart, slotEnd);
        
        if (slotTaken) {
            throw new RuntimeException("This time slot is too close to another appointment. " +
                    "Please choose a time at least " + requiredGapMinutes + 
                    " minutes away from other bookings.");
        }

        // Validate appointment time is within organization hours for banks and government offices
        if (org.getType() == Organization.OrgType.BANK || 
            org.getType() == Organization.OrgType.GOVERNMENT_OFFICE) {
            
            if (!org.isOpen24Hours()) {
                DayOfWeek appointmentDay = appointmentTime.getDayOfWeek();
                
                // Check if appointment is on Sunday and org is closed on Sunday
                if (appointmentDay == DayOfWeek.SUNDAY && !org.isOpenSunday()) {
                    throw new RuntimeException("Organization is closed on Sundays. Please choose another day.");
                }
                
                // Check if appointment time is within organization hours
                if (appointmentTimeOnly.isBefore(org.getOpenTime()) || appointmentTimeOnly.isAfter(org.getCloseTime())) {
                    throw new RuntimeException("Appointment time must be between " + 
                            org.getOpenTime() + " and " + org.getCloseTime());
                }
            }
        }

        int todayCount = tokenRepository.countByServiceIdAndTokenDate(req.getServiceId(), appointmentDate);
        int queuePosition = todayCount + 1;
        int estimatedWaitMinutes = (int) java.time.Duration.between(LocalDateTime.now(), appointmentTime).toMinutes();

        Token token = new Token();
        token.setTokenNumber(generateTokenNumber(org.getName(), queuePosition));
        token.setQueuePosition(queuePosition);
        token.setEstimatedWaitMinutes(Math.max(0, estimatedWaitMinutes));
        token.setAppointmentTime(appointmentTime);
        token.setUser(user);
        token.setService(service);
        token.setOrganization(org);
        token.setTokenDate(appointmentDate);
        token.setPhoneNumber(req.getPhoneNumber());
        token.setStatus(TokenStatus.WAITING);
        tokenRepository.save(token);

        // Notify via email
        try {
            emailService.sendTokenConfirmation(user.getEmail(), token.getTokenNumber(),
                    service.getName(), queuePosition, token.getEstimatedWaitMinutes(),
                    token.getAppointmentTime());
        } catch (Exception ignored) {}

        // Broadcast WebSocket update
        broadcastQueueUpdate(req.getServiceId());

        TokenResponse response = new TokenResponse();
        response.setId(token.getId());
        response.setTokenNumber(token.getTokenNumber());
        response.setQueuePosition(token.getQueuePosition());
        response.setEstimatedWaitMinutes(token.getEstimatedWaitMinutes());
        response.setAppointmentTime(token.getAppointmentTime());
        response.setStatus(token.getStatus().name());
        response.setServiceName(service.getName());
        response.setOrganizationName(org.getName());
        return response;
    }

    public void callNextToken(Long serviceId) {
        // Get next waiting token
        List<Token> waiting = tokenRepository
                .findByServiceIdAndTokenDateAndStatusOrderByQueuePosition(
                        serviceId, LocalDate.now(), TokenStatus.WAITING);

        if (!waiting.isEmpty()) {
            Token next = waiting.get(0);
            next.setStatus(TokenStatus.SERVING);
            next.setCalledAt(LocalDateTime.now());
            tokenRepository.save(next);
            
            // Send email notification only
            try {
                emailService.sendTokenCalled(next.getUser().getEmail(), 
                        next.getTokenNumber(), next.getService().getName());
            } catch (Exception ignored) {}
            
            // Broadcast to service queue
            broadcastQueueUpdate(serviceId);
        }
    }

    public void markAttendance(AttendanceRequest req) {
        Token token = tokenRepository.findById(req.getTokenId())
                .orElseThrow(() -> new RuntimeException("Token not found"));

        Long serviceId = token.getService().getId();
        
        if (req.isAttended()) {
            token.setStatus(TokenStatus.COMPLETED);
            token.setCompletedAt(LocalDateTime.now());
            
            // Send attended email notification
            try {
                emailService.sendTokenAttended(token.getUser().getEmail(), 
                        token.getTokenNumber(), token.getService().getName());
            } catch (Exception ignored) {}
        } else {
            token.setStatus(TokenStatus.CANCELLED);
            
            // Send absent email notification
            try {
                emailService.sendTokenAbsent(token.getUser().getEmail(), 
                        token.getTokenNumber(), token.getService().getName());
            } catch (Exception ignored) {}
            
            // Automatically call next token when current token is cancelled
            // Find the next waiting token with the closest appointment time
            List<Token> waitingTokens = tokenRepository
                    .findByServiceIdAndTokenDateAndStatusOrderByQueuePosition(
                            serviceId, LocalDate.now(), TokenStatus.WAITING);
            
            if (!waitingTokens.isEmpty()) {
                Token nextToken = waitingTokens.get(0);
                nextToken.setStatus(TokenStatus.SERVING);
                nextToken.setCalledAt(LocalDateTime.now());
                tokenRepository.save(nextToken);
                
                // Send notification to next token holder
                try {
                    emailService.sendTokenCalled(nextToken.getUser().getEmail(), 
                            nextToken.getTokenNumber(), nextToken.getService().getName());
                } catch (Exception ignored) {}
            }
        }
        
        tokenRepository.save(token);
        broadcastQueueUpdate(serviceId);
    }

    // Send email reminders 30 minutes before appointment time
    @Scheduled(fixedRate = 60000) // Check every minute
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderTime = now.plusMinutes(30);
        
        // Find tokens with appointments in the next 30-31 minutes that haven't been reminded
        LocalDateTime startWindow = reminderTime;
        LocalDateTime endWindow = reminderTime.plusMinutes(1);
        
        List<Token> upcomingTokens = tokenRepository.findByStatusAndAppointmentTimeBetween(
                TokenStatus.WAITING, startWindow, endWindow);
        
        for (Token token : upcomingTokens) {
            // Check if reminder already sent
            if (!token.isReminderSent()) {
                try {
                    String appointmentTimeStr = token.getAppointmentTime()
                            .format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a, MMM dd"));
                    
                    emailService.sendReminder(
                            token.getUser().getEmail(),
                            token.getTokenNumber(),
                            30 // 30 minutes before appointment
                    );
                    
                    // Mark as reminded
                    token.setReminderSent(true);
                    tokenRepository.save(token);
                    
                    System.out.println("Email reminder sent for token: " + token.getTokenNumber() + 
                                     " - Appointment at: " + appointmentTimeStr);
                } catch (Exception e) {
                    System.err.println("Failed to send email reminder: " + e.getMessage());
                }
            }
        }
    }
    
    // Auto-call tokens before appointment time (based on avg service time)
    @Scheduled(fixedRate = 60000) // Check every minute
    public void autoCallTokens() {
        LocalDateTime now = LocalDateTime.now();
        
        // Find all waiting tokens
        List<Token> waitingTokens = tokenRepository.findByTokenDateAndStatus(
                LocalDate.now(), TokenStatus.WAITING);
        
        for (Token token : waitingTokens) {
            if (token.getAppointmentTime() != null && token.getService() != null) {
                // Calculate when to call (avg service time before appointment)
                LocalDateTime callTime = token.getAppointmentTime()
                        .minusMinutes(token.getService().getAvgServiceTimeMinutes());
                
                // If current time is past the call time, call the token
                if (now.isAfter(callTime) || now.isEqual(callTime)) {
                    token.setStatus(TokenStatus.SERVING);
                    token.setCalledAt(now);
                    tokenRepository.save(token);
                    
                    // Send email notification only
                    try {
                        emailService.sendTokenCalled(token.getUser().getEmail(), 
                                token.getTokenNumber(), token.getService().getName());
                    } catch (Exception ignored) {}
                    
                    // Broadcast update
                    broadcastQueueUpdate(token.getService().getId());
                }
            }
        }
    }

    public Map<String, Long> getDailyStats(Long orgId) {
        LocalDate today = LocalDate.now();
        Map<String, Long> stats = new HashMap<>();
        List<Token> allTokens = tokenRepository.findByOrganizationIdAndTokenDate(orgId, today);
        stats.put("total", (long) allTokens.size());
        stats.put("attended", tokenRepository.countAttendedByOrgAndDate(orgId, today));
        stats.put("cancelled", tokenRepository.countCancelledByOrgAndDate(orgId, today));
        stats.put("pending", tokenRepository.countPendingByOrgAndDate(orgId, today));
        return stats;
    }

    private String generateTokenNumber(String orgName, int count) {
        String prefix = orgName.substring(0, Math.min(3, orgName.length())).toUpperCase();
        return prefix + String.format("%03d", count);
    }

    private void broadcastQueueUpdate(Long serviceId) {
        List<Token> waiting = tokenRepository
                .findByServiceIdAndTokenDateAndStatusOrderByQueuePosition(
                        serviceId, LocalDate.now(), TokenStatus.WAITING);
        messagingTemplate.convertAndSend("/topic/queue/" + serviceId, waiting);
    }
}
