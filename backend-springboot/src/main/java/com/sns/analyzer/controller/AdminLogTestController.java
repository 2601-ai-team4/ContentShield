// ==================== AdminLogTestController.java ====================
package com.sns.analyzer.controller;

import com.sns.analyzer.entity.AdminLog;
import com.sns.analyzer.repository.AdminLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class AdminLogTestController {

    private final AdminLogRepository adminLogRepository;

    /**
     * 테스트: 직접 로그 저장
     */
    @PostMapping("/create-log")
    public ResponseEntity<?> createTestLog() {
        try {
            AdminLog testLog = AdminLog.builder()
                .adminId(9L)
                .actionType(AdminLog.ActionType.SUSPEND_USER)
                .targetType("User")
                .targetId(999L)
                .description("TEST LOG - " + LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
            
            AdminLog saved = adminLogRepository.save(testLog);
            adminLogRepository.flush();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test log created",
                "logId", saved.getLogId(),
                "createdAt", saved.getCreatedAt()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "stackTrace", e.getStackTrace()[0].toString()
            ));
        }
    }

    /**
     * 테스트: 모든 로그 조회
     */
    @GetMapping("/all-logs")
    public ResponseEntity<?> getAllLogs() {
        try {
            List<AdminLog> logs = adminLogRepository.findAll();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", logs.size(),
                "logs", logs
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * 테스트: 최근 1시간 이내 로그 조회
     */
    @GetMapping("/recent-logs")
    public ResponseEntity<?> getRecentLogs() {
        try {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            List<AdminLog> logs = adminLogRepository.findByCreatedAtAfter(oneHourAgo);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", logs.size(),
                "logs", logs,
                "searchedFrom", oneHourAgo
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * 테스트: DB 연결 확인
     */
    @GetMapping("/db-check")
    public ResponseEntity<?> checkDatabase() {
        try {
            long count = adminLogRepository.count();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Database connection OK",
                "totalLogs", count,
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
