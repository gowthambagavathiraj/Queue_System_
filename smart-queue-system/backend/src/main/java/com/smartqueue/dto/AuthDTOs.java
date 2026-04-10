package com.smartqueue.dto;

import lombok.Data;

public class AuthDTOs {

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String phone;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String name;
        private String email;
        private String role;
        public AuthResponse(String token, String name, String email, String role) {
            this.token = token; this.name = name; this.email = email; this.role = role;
        }
    }

    @Data
    public static class ForgotPasswordRequest {
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        private String otp;
        private String newPassword;
    }

    @Data
    public static class GoogleAuthRequest {
        private String idToken;
    }

    @Data
    public static class TokenRequest {
        private Long serviceId;
        private Long organizationId;
        private String phoneNumber;
        private String appointmentTime; // User-selected appointment time
    }

    @Data
    public static class TokenResponse {
        private Long id;
        private String tokenNumber;
        private int queuePosition;
        private int estimatedWaitMinutes;
        private java.time.LocalDateTime appointmentTime;
        private String status;
        private String serviceName;
        private String organizationName;
    }

    @Data
    public static class AttendanceRequest {
        private Long tokenId;
        private boolean attended;
    }
}
