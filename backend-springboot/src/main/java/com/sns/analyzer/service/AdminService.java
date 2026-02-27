// ==================== AdminService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final UserRepository userRepository;
    private final AdminLogRepository adminLogRepository;
    private final UserActivityLogRepository userActivityLogRepository;
    
    /**
     * 사용자 정지
     */
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
    
    /**
     * 사용자 정지 해제
     */
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
    
    /**
     * 사용자 플래그 설정
     */
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
    
    /**
     * 사용자 플래그 해제
     */
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
    
    /**
     * 관리자 액션 로그 기록
     */
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
    
    /**
     * 관리자 로그 조회
     */
    @Transactional(readOnly = true)
    public List<AdminLog> getAdminLogs(Long adminId) {
        log.info("📝 Fetching admin logs - adminId: {}", adminId);
        
        List<AdminLog> logs;
        if (adminId != null) {
            logs = adminLogRepository.findByAdminId(adminId);
        } else {
            logs = adminLogRepository.findAll();
        }
        
        log.info("📋 Found {} admin logs", logs.size());
        return logs;
    }
    
    /**
     * 사용자 활동 로그 조회
     */
    @Transactional(readOnly = true)
    public List<UserActivityLog> getUserActivityLogs(Long userId) {
        if (userId != null) {
            return userActivityLogRepository.findByUserId(userId);
        }
        return userActivityLogRepository.findAll();
    }
    
    /**
     * 플래그된 사용자 목록
     */
    @Transactional(readOnly = true)
    public List<User> getFlaggedUsers() {
        return userRepository.findByIsFlagged(true);
    }
    
    /**
     * 정지된 사용자 목록
     */
    @Transactional(readOnly = true)
    public List<User> getSuspendedUsers() {
        return userRepository.findByIsSuspended(true);
    }

    /**
     * 대시보드 통계
     */
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

    /**
     * 최근 관리자 로그 조회
     */
    @Transactional(readOnly = true)
    public List<AdminLog> getRecentAdminLogs(int limit) {
        log.info("📝 Fetching recent {} admin logs", limit);
        
        List<AdminLog> logs = adminLogRepository.findAll().stream()
                .sorted((a,b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .collect(Collectors.toList());
        
        log.info("📋 Found {} recent logs", logs.size());
        return logs;
    }

    /**
     * 🆕 월별 사용자 가입 통계 (최근 6개월)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMonthlyUserGrowth() {
        log.info("📊 Fetching monthly user growth stats");
        
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        // 최근 6개월 데이터
        for (int i = 5; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.from(now.minusMonths(i));
            LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
            LocalDateTime endOfMonth = yearMonth.atEndOfMonth().atTime(23, 59, 59);
            
            long count = userRepository.countByCreatedAtBetween(startOfMonth, endOfMonth);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", yearMonth.getMonth().toString().substring(0, 3));  // Jan, Feb, ...
            monthData.put("year", yearMonth.getYear());
            monthData.put("users", count);
            
            result.add(monthData);
        }
        
        log.info("📊 Monthly growth data: {}", result);
        return result;
    }
}