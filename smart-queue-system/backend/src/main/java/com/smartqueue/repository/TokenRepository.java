package com.smartqueue.repository;

import com.smartqueue.model.Token;
import com.smartqueue.model.Token.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token, Long> {
    List<Token> findByServiceIdAndTokenDateAndStatusOrderByQueuePosition(
            Long serviceId, LocalDate date, TokenStatus status);

    List<Token> findByOrganizationIdAndTokenDate(Long orgId, LocalDate date);

    Optional<Token> findByServiceIdAndTokenDateAndStatus(
            Long serviceId, LocalDate date, TokenStatus status);

    int countByServiceIdAndTokenDate(Long serviceId, LocalDate date);

    int countByOrganizationIdAndTokenDate(Long orgId, LocalDate date);

    int countByOrganizationIdAndTokenDateAndStatus(Long orgId, LocalDate date, TokenStatus status);

    int countByOrganizationIdAndTokenDateAndStatusIn(Long orgId, LocalDate date, java.util.List<TokenStatus> statuses);

    boolean existsByServiceIdAndAppointmentTimeBetween(Long serviceId, LocalDateTime start, LocalDateTime end);

    List<Token> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Token> findAllByOrderByCreatedAtDesc();

    @Query("SELECT t FROM Token t WHERE t.status = 'WAITING' AND t.reminderSent = false")
    List<Token> findPendingReminders();

    @Query("SELECT COUNT(t) FROM Token t WHERE t.organization.id = ?1 AND t.tokenDate = ?2 AND t.status = 'COMPLETED'")
    long countAttendedByOrgAndDate(Long orgId, LocalDate date);

    @Query("SELECT COUNT(t) FROM Token t WHERE t.organization.id = ?1 AND t.tokenDate = ?2 AND t.status = 'CANCELLED'")
    long countCancelledByOrgAndDate(Long orgId, LocalDate date);

    @Query("SELECT COUNT(t) FROM Token t WHERE t.organization.id = ?1 AND t.tokenDate = ?2 AND t.status = 'WAITING'")
    long countPendingByOrgAndDate(Long orgId, LocalDate date);
    
    List<Token> findByTokenDateAndStatus(LocalDate date, TokenStatus status);
    
    List<Token> findByServiceIdAndTokenDateOrderByQueuePosition(Long serviceId, LocalDate date);
    
    List<Token> findByTokenDateOrderByOrganizationIdAscCreatedAtAsc(LocalDate date);
    
    List<Token> findByTokenDateBetweenOrderByOrganizationIdAscCreatedAtAsc(LocalDate startDate, LocalDate endDate);
}
