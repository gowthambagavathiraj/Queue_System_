package com.smartqueue.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens")
@Data
@NoArgsConstructor
public class Token {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tokenNumber;

    private int queuePosition;
    private int estimatedWaitMinutes;

    @Enumerated(EnumType.STRING)
    private TokenStatus status = TokenStatus.WAITING;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"password", "tokens"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "service_id")
    @JsonIgnoreProperties({"organization"})
    private Service service;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    @JsonIgnoreProperties({"services"})
    private Organization organization;

    private LocalDate tokenDate;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime appointmentTime; // Fixed time for user to arrive
    private LocalDateTime calledAt;
    private LocalDateTime completedAt;
    private boolean reminderSent = false;
    private String phoneNumber;

    public enum TokenStatus { WAITING, SERVING, COMPLETED, CANCELLED }
}
