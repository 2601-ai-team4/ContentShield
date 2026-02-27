package com.sns.analyzer.service;

import com.sns.analyzer.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentCleanupService {

    private final CommentRepository commentRepository;

    @Value("${app.retention.days.common}")
    private int retentionDaysCommon;

    @Value("${app.retention.days.malicious}")
    private int retentionDaysMalicious;

    /**
     * 매일 새벽 3시에 실행
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldComments() {
        log.info("Starting scheduled comment cleanup task...");

        LocalDateTime now = LocalDateTime.now();

        // 1. 일반 댓글 삭제 (Retention Period: N days)
        LocalDateTime commonCutoff = now.minusDays(retentionDaysCommon);
        int deletedCommon = commentRepository.deleteCommonCommentsBefore(commonCutoff);
        log.info("Deleted {} common comments older than {}", deletedCommon, commonCutoff);

        // 2. 악성 댓글 삭제 (Retention Period: M days)
        LocalDateTime maliciousCutoff = now.minusDays(retentionDaysMalicious);
        int deletedMalicious = commentRepository.deleteMaliciousCommentsBefore(maliciousCutoff);
        log.info("Deleted {} malicious comments older than {}", deletedMalicious, maliciousCutoff);

        log.info("Comment cleanup task completed.");
    }
}
