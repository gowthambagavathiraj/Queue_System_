package com.smartqueue.repository;

import com.smartqueue.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByOrganizationIdAndActiveTrue(Long organizationId);
}
