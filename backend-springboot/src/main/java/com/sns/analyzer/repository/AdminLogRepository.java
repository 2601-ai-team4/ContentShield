// ==================== AdminLogRepository.java (개선 버전) ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AdminLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {

    // 기본 조회
    List<AdminLog> findByAdminId(Long adminId);

    List<AdminLog> findByActionType(AdminLog.ActionType actionType);

    List<AdminLog> findByTargetTypeAndTargetId(String targetType, Long targetId);

    List<AdminLog> findByCreatedAtAfter(LocalDateTime after);

    List<AdminLog> findByAdminIdAndCreatedAtBetween(Long adminId, LocalDateTime start, LocalDateTime end);

    // ✅ 추가: 최근 로그 조회 (정렬 포함)
    List<AdminLog> findAllByOrderByCreatedAtDesc();
    
    // ✅ 추가: 페이징을 지원하는 최근 로그 조회
    Page<AdminLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // ✅ 추가: Top N 개 최근 로그 조회
    @Query("SELECT a FROM AdminLog a ORDER BY a.createdAt DESC")
    List<AdminLog> findRecentLogs(Pageable pageable);
    
    // ✅ 추가: 특정 관리자의 최근 로그
    List<AdminLog> findByAdminIdOrderByCreatedAtDesc(Long adminId);
    
    // ✅ 디버깅용: 오늘 생성된 로그 수 확인
    @Query("SELECT COUNT(a) FROM AdminLog a WHERE DATE(a.createdAt) = CURRENT_DATE")
    long countTodayLogs();
}