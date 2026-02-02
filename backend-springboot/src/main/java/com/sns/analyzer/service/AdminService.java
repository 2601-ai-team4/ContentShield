// [File: AdminService.java]
package com.sns.analyzer.service;

import com.sns.analyzer.entity.AdminLog;
import com.sns.analyzer.entity.User;
import com.sns.analyzer.entity.UserActivityLog;
import com.sns.analyzer.repository.AdminLogRepository;
import com.sns.analyzer.repository.UserActivityLogRepository;
import com.sns.analyzer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest; // #장소영~여기까지: Pageable 사용
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AdminLogRepository adminLogRepository;
    private final UserActivityLogRepository userActivityLogRepository;

    @Transactional
    public void suspendUser(Long userId, Long adminId, String reason, Integer days) {
        log.info("🔵 suspendUser called - userId: {}, adminId: {}, days: {}", userId, adminId, days);

        if (userId == null || adminId == null || days == null) {
            throw new IllegalArgumentException("Required parameters cannot be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsSuspended(true);
        user.setSuspendedUntil(LocalDateTime.now().plusDays(days));
        user.setSuspensionReason(reason);
        user.setStatus(User.UserStatus.SUSPENDED);
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        log.info("✅ User suspended successfully - userId: {}", saved.getUserId());

        logAdminAction(adminId, AdminLog.ActionType.SUSPEND_USER, "User", userId,
                String.format("Suspended user for %d days. Reason: %s", days, reason));
    }

    @Transactional
    public void unsuspendUser(Long userId, Long adminId) {
        log.info("🔵 unsuspendUser called - userId: {}, adminId: {}", userId, adminId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsSuspended(false);
        user.setSuspendedUntil(null);
        user.setSuspensionReason(null);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        log.info("✅ User unsuspended successfully - userId: {}", userId);

        logAdminAction(adminId, AdminLog.ActionType.UNSUSPEND_USER, "User", userId, "Unsuspended user");
    }

    @Transactional
    public void flagUser(Long userId, Long adminId, String reason) {
        log.info("🔵 flagUser called - userId: {}, adminId: {}", userId, adminId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsFlagged(true);
        user.setFlagReason(reason);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        log.info("✅ User flagged successfully - userId: {}", userId);

        logAdminAction(adminId, AdminLog.ActionType.FLAG_USER, "User", userId, "Flagged user: " + reason);
    }

    @Transactional
    public void unflagUser(Long userId, Long adminId) {
        log.info("🔵 unflagUser called - userId: {}, adminId: {}", userId, adminId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsFlagged(false);
        user.setFlagReason(null);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
        log.info("✅ User unflagged successfully - userId: {}", userId);

        logAdminAction(adminId, AdminLog.ActionType.UNFLAG_USER, "User", userId, "Unflagged user");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAdminAction(Long adminId, AdminLog.ActionType actionType, String targetType,
                               Long targetId, String description) {
        try {
            log.info("📝 Saving admin log - admin: {}, action: {}, target: {}/{}",
                    adminId, actionType, targetType, targetId);

            AdminLog logEntity = AdminLog.builder()
                    .adminId(adminId)
                    .actionType(actionType)
                    .targetType(targetType)
                    .targetId(targetId)
                    .description(description)
                    .createdAt(LocalDateTime.now())
                    .build();

            AdminLog saved = adminLogRepository.save(logEntity);
            adminLogRepository.flush();

            log.info("✅ Admin log saved successfully - logId: {}, createdAt: {}",
                    saved.getLogId(), saved.getCreatedAt());

        } catch (Exception e) {
            log.error("❌ Failed to save admin log", e);
        }
    }

    @Transactional(readOnly = true)
    public List<AdminLog> getAdminLogs(Long adminId) {
        if (adminId != null) return adminLogRepository.findByAdminId(adminId);
        return adminLogRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<UserActivityLog> getUserActivityLogs(Long userId) {
        if (userId != null) return userActivityLogRepository.findByUserId(userId);
        return userActivityLogRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<User> getFlaggedUsers() {
        return userRepository.findByIsFlagged(true);
    }

    @Transactional(readOnly = true)
    public List<User> getSuspendedUsers() {
        return userRepository.findByIsSuspended(true);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(User.UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(User.UserStatus.SUSPENDED);
        long flaggedUsers = userRepository.countByIsFlagged(true);

        return Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "flaggedUsers", flaggedUsers,
                "suspendedUsers", suspendedUsers
        );
    }

    // ==================== #장소영~여기까지: DB에서 limit만큼만 최근로그 조회(성능/정확도 개선) ====================
    @Transactional(readOnly = true)
    public List<AdminLog> getRecentAdminLogs(int limit) {
        return adminLogRepository.findRecentLogs(PageRequest.of(0, limit));
    }
    // ==================== #여기까지 ====================

    // ==================== #장소영~여기까지: ✅ 최근 N일(오늘 포함) 일별 가입자 수 추이 ====================
    // 반환 형태: [{day: "2026-01-28", signup_count: 2}, ...]
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDailySignupTrend(int days) {
        if (days < 1) days = 7;

        // 오늘 포함 N일 -> 시작일(00:00:00)
        LocalDate startDate = LocalDate.now().minusDays(days - 1);
        LocalDateTime start = startDate.atStartOfDay();

        return userRepository.countSignupsByDaySince(start).stream()
                .map(row -> Map.<String, Object>of(
                        // row[0]이 java.sql.Date 형태면 toString() -> "YYYY-MM-DD" 로 깔끔하게 내려감
                        "day", row[0].toString(),
                        "signup_count", ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }
    // ==================== #여기까지 ====================

    // ==================== #장소영~여기까지: 주별 가입자수 추이(최근 N주) ====================
    // 반환 형태: [{week: "2026-01-27", count: 3}, ...]
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getWeeklySignupTrend(int weeks) {
        if (weeks < 1) weeks = 6;
        return userRepository.countSignupsByWeek(weeks).stream()
                .map(row -> Map.<String, Object>of(
                        "week", row[0].toString(),
                        "count", ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }
    // ==================== #여기까지 ====================

    // ==================== #장소영~여기까지: 액션 타입 TOP N (기본 TOP5) ====================
    // 반환 형태: [{actionType: "SUSPEND_USER", count: 10}, ...]
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActionTypeTop(int limit) {
        if (limit < 1) limit = 5;
        return adminLogRepository.countActionTypeTop(PageRequest.of(0, limit)).stream()
                .map(row -> Map.<String, Object>of(
                        "actionType", row[0].toString(),
                        "count", ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }
    // ==================== #여기까지 ====================
}
