package com.smartqueue.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider = AuthProvider.LOCAL;

    private String providerId;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    private String phoneNumber;
    private String address;

    private String otpCode;
    private LocalDateTime otpExpiry;
    private boolean emailVerified = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AuthProvider { LOCAL, GOOGLE }
    public enum Role { USER, STAFF, ADMIN }
}
