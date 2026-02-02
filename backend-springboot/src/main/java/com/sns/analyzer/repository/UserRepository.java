// [File: UserRepository.java]
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // ==================== (기존 기능에서 쓰는 메서드들 복구) ====================
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    long countByStatus(User.UserStatus status);
    long countByIsFlagged(boolean isFlagged);

    List<User> findByStatus(User.UserStatus status);
    List<User> findByRole(User.UserRole role);

    List<User> findByIsFlagged(boolean isFlagged);
    List<User> findByIsSuspended(boolean isSuspended);
    // ==================== (여기까지) ====================


    // ==================== #장소영~여기까지: ✅ 최근 N일(일별) 가입자 수 추이 쿼리 ====================
    // AdminService.getDailySignupTrend()에서 start(LocalDateTime) 넘겨줌
    // 반환 row: [day(java.sql.Date), signup_count(Long)]
    @Query(
            value = """
            SELECT DATE(u.created_at) AS day,
                   COUNT(*) AS signup_count
            FROM users u
            WHERE u.created_at >= :start
            GROUP BY DATE(u.created_at)
            ORDER BY day
            """,
            nativeQuery = true
    )
    List<Object[]> countSignupsByDaySince(@Param("start") LocalDateTime start);
    // ==================== #여기까지 ====================


    // ==================== #장소영~여기까지: (유지) 주별 가입자 수 추이 ====================
    // 반환 row: [week_start_date, count]
    @Query(
            value = """
            SELECT DATE(DATE_SUB(u.created_at, INTERVAL WEEKDAY(u.created_at) DAY)) AS week,
                   COUNT(*) AS count
            FROM users u
            WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL :weeks WEEK)
            GROUP BY week
            ORDER BY week
            """,
            nativeQuery = true
    )
    List<Object[]> countSignupsByWeek(@Param("weeks") int weeks);
    // ==================== #여기까지 ====================
}
