// ==================== AdminLogRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AdminLog;
import org.springframework.data.domain.Pageable; // #장소영~여기까지: Pageable import 추가
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // #장소영~여기까지: @Query 사용
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {

    List<AdminLog> findByAdminId(Long adminId);

    // #장소영~여기까지: String -> Enum으로 수정 (엔티티와 타입 맞추기)
    List<AdminLog> findByActionType(AdminLog.ActionType actionType);
    // #여기까지

    // (이 부분은 엔티티의 타입이 String이면 OK. 만약 TargetType도 Enum이면 여기도 바꿔야 함)
    List<AdminLog> findByTargetTypeAndTargetId(String targetType, Long targetId);

    List<AdminLog> findByCreatedAtAfter(LocalDateTime after);

    List<AdminLog> findByAdminIdAndCreatedAtBetween(
            Long adminId,
            LocalDateTime start,
            LocalDateTime end
    );

    // ==================== #장소영~여기까지: ✅ 최근 관리자 로그 N개 조회 (Dashboard용) ====================
    // AdminService.getRecentAdminLogs(int limit) 에서 사용
    // PageRequest.of(0, limit) → Pageable 로 받음
    @Query("SELECT a FROM AdminLog a ORDER BY a.createdAt DESC")
    List<AdminLog> findRecentLogs(Pageable pageable);
    // ==================== #여기까지 ====================

    // ==================== #장소영~여기까지: ✅ 관리자 액션 타입 TOP N 집계 ====================
    // AdminService.getActionTypeTop(int limit) 에서 사용
    @Query(value = """
        SELECT action_type AS actionType, COUNT(*) AS cnt
        FROM admin_logs
        GROUP BY action_type
        ORDER BY cnt DESC
        """, nativeQuery = true)
    List<Object[]> countActionTypeTop(Pageable pageable);
    // ==================== #여기까지 ====================
}
