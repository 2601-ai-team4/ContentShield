// [File: AdminController.java]
package com.sns.analyzer.controller;

import com.sns.analyzer.entity.AdminLog;
import com.sns.analyzer.entity.User;
import com.sns.analyzer.entity.UserActivityLog;
import com.sns.analyzer.service.AdminService;
import com.sns.analyzer.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    static class AdminUserDto {
        public Long userId;
        public String email;
        public String username;
        public User.UserRole role;
        public User.UserStatus status;
        public Boolean isSuspended;
        public LocalDateTime suspendedUntil;
        public String suspensionReason;
        public Boolean isFlagged;
        public String flagReason;
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public LocalDateTime lastLoginAt;

        public static AdminUserDto from(User u) {
            AdminUserDto dto = new AdminUserDto();
            dto.userId = u.getUserId();
            dto.email = u.getEmail();
            dto.username = u.getUsername();
            dto.role = u.getRole();
            dto.status = u.getStatus();
            dto.isSuspended = u.getIsSuspended();
            dto.suspendedUntil = u.getSuspendedUntil();
            dto.suspensionReason = u.getSuspensionReason();
            dto.isFlagged = u.getIsFlagged();
            dto.flagReason = u.getFlagReason();
            dto.createdAt = u.getCreatedAt();
            dto.updatedAt = u.getUpdatedAt();
            dto.lastLoginAt = u.getLastLoginAt();
            return dto;
        }
    }

    // ==================== #장소영~여기까지: AdminLogDto 추가(엔티티 직접 반환 위험 방지) ====================
    static class AdminLogDto {
        public Long logId;
        public Long adminId;
        public AdminLog.ActionType actionType;
        public String targetType;
        public Long targetId;
        public String description;
        public String ipAddress;
        public LocalDateTime createdAt;

        public static AdminLogDto from(AdminLog l) {
            AdminLogDto dto = new AdminLogDto();
            dto.logId = l.getLogId();
            dto.adminId = l.getAdminId();
            dto.actionType = l.getActionType();
            dto.targetType = l.getTargetType();
            dto.targetId = l.getTargetId();
            dto.description = l.getDescription();
            dto.ipAddress = l.getIpAddress();
            dto.createdAt = l.getCreatedAt();
            return dto;
        }
    }
    // ==================== #여기까지 ====================

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        List<AdminUserDto> result = userService.getAllUsers().stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserDetail(@PathVariable Long userId) {
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(AdminUserDto.from(user));
    }

    @PutMapping("/users/{userId}/suspend")
    public ResponseEntity<?> suspendUser(
            @PathVariable Long userId,
            @RequestBody SuspendRequest request,
            Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        adminService.suspendUser(userId, adminId, request.getReason(), request.getDays());
        return ResponseEntity.ok(Map.of("message", "User suspended"));
    }

    @PutMapping("/users/{userId}/unsuspend")
    public ResponseEntity<?> unsuspendUser(@PathVariable Long userId, Authentication authentication) {
        Long adminId = getAdminId(authentication);
        adminService.unsuspendUser(userId, adminId);
        return ResponseEntity.ok(Map.of("message", "User unsuspended"));
    }

    @PutMapping("/users/{userId}/flag")
    public ResponseEntity<?> flagUser(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        adminService.flagUser(userId, adminId, body.get("reason"));
        return ResponseEntity.ok(Map.of("message", "User flagged"));
    }

    @PutMapping("/users/{userId}/unflag")
    public ResponseEntity<?> unflagUser(@PathVariable Long userId, Authentication authentication) {
        Long adminId = getAdminId(authentication);
        adminService.unflagUser(userId, adminId);
        return ResponseEntity.ok(Map.of("message", "User unflagged"));
    }

    // ==================== #장소영~여기까지: logs/admin도 DTO로 반환(프론트에서 안전하게 렌더) ====================
    @GetMapping("/logs/admin")
    public ResponseEntity<List<AdminLogDto>> getAdminLogs(@RequestParam(required = false) Long adminId) {
        List<AdminLogDto> result = adminService.getAdminLogs(adminId).stream()
                .map(AdminLogDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    // ==================== #여기까지 ====================

    @GetMapping("/logs/activity")
    public ResponseEntity<List<UserActivityLog>> getUserActivityLogs(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(adminService.getUserActivityLogs(userId));
    }

    @GetMapping("/users/flagged")
    public ResponseEntity<List<AdminUserDto>> getFlaggedUsers() {
        List<AdminUserDto> result = adminService.getFlaggedUsers().stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/suspended")
    public ResponseEntity<List<AdminUserDto>> getSuspendedUsers() {
        List<AdminUserDto> result = adminService.getSuspendedUsers().stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private Long getAdminId(Authentication authentication) {
        String email = authentication.getName();
        User admin = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return admin.getUserId();
    }

    static class SuspendRequest {
        private String reason;
        private Integer days;
        public String getReason() { return reason; }
        public Integer getDays() { return days; }
        public void setReason(String reason) { this.reason = reason; }
        public void setDays(Integer days) { this.days = days; }
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // ==================== #장소영~여기까지: recent-logs도 DTO로 반환(프론트에서 안전하게 렌더) ====================
    @GetMapping("/dashboard/recent-logs")
    public ResponseEntity<List<AdminLogDto>> getRecentLogs(@RequestParam(defaultValue = "10") int limit) {
        List<AdminLogDto> result = adminService.getRecentAdminLogs(limit).stream()
                .map(AdminLogDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
    // ==================== #여기까지 ====================

    // ==================== #장소영~여기까지: ✅ 최근 N일(일별) 가입자 수 추이 API ====================
    // GET /api/admin/dashboard/signups-daily?days=7
    // 반환 예: [{ day: "2026-01-28", signup_count: 2 }, ...]
    @GetMapping("/dashboard/signups-daily")
    public ResponseEntity<List<Map<String, Object>>> getDailySignups(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(adminService.getDailySignupTrend(days));
    }
    // ==================== #여기까지 ====================

    // (선택) 주별도 이미 서비스에 있어서 엔드포인트도 같이 달아둠
    // ==================== #장소영~여기까지: 주별 가입자수 추이 API ====================
    @GetMapping("/dashboard/signups-weekly")
    public ResponseEntity<List<Map<String, Object>>> getWeeklySignups(@RequestParam(defaultValue = "6") int weeks) {
        return ResponseEntity.ok(adminService.getWeeklySignupTrend(weeks));
    }
    // ==================== #여기까지 ====================
}
