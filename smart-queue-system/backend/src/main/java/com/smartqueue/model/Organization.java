package com.smartqueue.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private OrgType type;

    private LocalTime openTime;
    private LocalTime closeTime;
    private boolean openSunday;
    private boolean open24Hours;
    private boolean active = true;
    private int dailyTokenLimit = 100; // Default 100 tokens per day

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Service> services;

    public enum OrgType { HOSPITAL, BANK, GOVERNMENT_OFFICE }
}
