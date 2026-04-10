package com.smartqueue.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
public class Service {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;
    private int avgServiceTimeMinutes = 10;
    
    // Service operating hours
    private LocalTime serviceStartTime = LocalTime.of(9, 0); // Default 9:00 AM
    private LocalTime serviceEndTime = LocalTime.of(17, 0);   // Default 5:00 PM

    @ManyToOne
    @JoinColumn(name = "organization_id")
    @JsonBackReference
    private Organization organization;

    private boolean active = true;
}
