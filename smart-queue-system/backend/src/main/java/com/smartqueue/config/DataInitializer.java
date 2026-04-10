package com.smartqueue.config;

import com.smartqueue.model.Organization;
import com.smartqueue.model.Service;
import com.smartqueue.model.User;
import com.smartqueue.repository.OrganizationRepository;
import com.smartqueue.repository.ServiceRepository;
import com.smartqueue.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private OrganizationRepository orgRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Only initialize admin if doesn't exist
        if (!userRepository.existsByEmail("gowthamknp143@gmail.com")) {
            // Create Admin User with unique credentials
            User admin = new User();
            admin.setName("Gowtham");
            admin.setEmail("gowthamknp143@gmail.com");
            admin.setPassword(passwordEncoder.encode("Gowtham@2024"));
            admin.setRole(User.Role.ADMIN);
            admin.setEmailVerified(true);
            userRepository.save(admin);
            System.out.println("=== Admin created: gowthamknp143@gmail.com / Gowtham@2024 ===");
        }

        // Create Staff User if doesn't exist
        if (!userRepository.existsByEmail("staff@smartqueue.com")) {
            User staff = new User();
            staff.setName("Staff Member");
            staff.setEmail("staff@smartqueue.com");
            staff.setPassword(passwordEncoder.encode("Staff@123"));
            staff.setRole(User.Role.STAFF);
            staff.setEmailVerified(true);
            userRepository.save(staff);
            System.out.println("=== Staff created: staff@smartqueue.com / Staff@123 ===");
        }

        // Always ensure the 3 main organizations exist (PERMANENT)
        ensureOrganizationExists("City Hospital", Organization.OrgType.HOSPITAL, true, true);
        ensureOrganizationExists("National Bank", Organization.OrgType.BANK, false, false);
        ensureOrganizationExists("Government Office", Organization.OrgType.GOVERNMENT_OFFICE, false, false);

        System.out.println("=== Smart Queue System Initialized ===");
    }

    private void ensureOrganizationExists(String name, Organization.OrgType type, boolean open24Hours, boolean openSunday) {
        if (!orgRepository.existsByName(name)) {
            Organization org = new Organization();
            org.setName(name);
            org.setType(type);
            org.setOpen24Hours(open24Hours);
            org.setOpenSunday(openSunday);
            
            if (!open24Hours) {
                org.setOpenTime(LocalTime.of(9, 0));
                org.setCloseTime(LocalTime.of(17, 0));
            }
            
            orgRepository.save(org);
            System.out.println("=== Created organization: " + name + " ===");
            
            // Add ALL services to ALL organizations (admin can disable specific ones)
            addAllServices(org);
        }
    }

    private void addAllServices(Organization org) {
        // Hospital Services
        addServiceIfNotExists(org, "Doctor Consultation", "General physician consultation", 15);
        addServiceIfNotExists(org, "Lab Test", "Blood, urine and other diagnostic tests", 20);
        addServiceIfNotExists(org, "Pharmacy", "Medicine dispensing and prescription processing", 5);
        
        // Bank Services
        addServiceIfNotExists(org, "Cash Deposit / Withdrawal", "Deposit or withdraw money from account", 10);
        addServiceIfNotExists(org, "Loan Enquiry", "Home, personal and vehicle loan consultation", 20);
        addServiceIfNotExists(org, "Account Opening", "Open new savings or current account", 25);
        
        // Government Office Services
        addServiceIfNotExists(org, "Document Submission", "Submit official documents and applications", 15);
        addServiceIfNotExists(org, "Certificate Verification", "Verify birth, marriage, and other certificates", 10);
        addServiceIfNotExists(org, "Application Processing", "Track and process pending applications", 20);
    }

    private void addServiceIfNotExists(Organization org, String name, String description, int avgTime) {
        // Check if service already exists for this organization
        boolean exists = serviceRepository.findAll().stream()
                .anyMatch(s -> s.getOrganization().getId().equals(org.getId()) && s.getName().equals(name));
        
        if (!exists) {
            Service service = new Service();
            service.setName(name);
            service.setDescription(description);
            service.setAvgServiceTimeMinutes(avgTime);
            service.setServiceStartTime(LocalTime.of(9, 0)); // 9:00 AM
            service.setServiceEndTime(LocalTime.of(17, 0));   // 5:00 PM
            service.setActive(true); // Active by default, admin can disable
            service.setOrganization(org);
            serviceRepository.save(service);
            System.out.println("  - Added service: " + name);
        }
    }
}
