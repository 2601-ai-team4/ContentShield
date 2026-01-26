package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final AnalysisService analysisService;
    private final RestTemplate restTemplate;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    /**
     * 유튜브 댓글 크롤링 및 분석
     */
    public Map<String, Object> crawlAndAnalyze(String url, Long userId, String startDateStr, String endDateStr) {
        System.out.println("[DEBUG] crawlAndAnalyze called for URL: " + url + ", userId: " + userId + ", Period: "
                + startDateStr + " ~ " + endDateStr);

        // 상한/하한 날짜 파싱 (ISO-8601: yyyy-MM-dd)
        LocalDateTime limitStart = (startDateStr != null && !startDateStr.isEmpty())
                ? java.time.LocalDate.parse(startDateStr).atStartOfDay()
                : LocalDateTime.now().minusDays(7);
        LocalDateTime limitEnd = (endDateStr != null && !endDateStr.isEmpty())
                ? java.time.LocalDate.parse(endDateStr).atTime(23, 59, 59)
                : LocalDateTime.now();

        // 0. 기존 데이터 정리 (별도 트랜잭션으로 처리하여 락 점유 최소화)
        // 0. 기존 데이터 정리 (Comments 테이블만 초기화)
        // AnalysisResult는 스냅샷 데이터가 있으므로 유지하고, Comments는 현재 세션용으로 리셋
        transactionTemplate.execute(status -> {
            try {
                System.out.println("[DEBUG] Clearing COMMENTS table for user: " + userId
                        + " (Keeping History)");

                // AnalysisResult는 삭제하지 않음!
                // analysisResultRepository.deleteByUserId(userId);

                // 사용자의 댓글만 삭제
                commentRepository.deleteByUserId(userId);
                commentRepository.flush();
                return null;
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to cleanup data: " + e.getMessage());
                // FK 제약조건 등으로 실패할 경우 로그만 남기고 진행 (히스토리 보존 최우선)
                // throw new RuntimeException("Data cleanup failed", e);
                return null;
            }
        });

        // 1. Python AI 서버에 크롤링 요청 (시간이 오래 걸리므로 트랜잭션 밖에서 수행)
        List<Map<String, Object>> crawledComments = crawlYoutubeComments(url);

        // 2. DB 저장 및 분석 (새로운 트랜잭션으로 처리)
        return transactionTemplate.execute(status -> {
            int successCount = 0;
            int failCount = 0;
            int skippedCount = 0;
            List<AnalysisResult> results = new ArrayList<>();

            for (Map<String, Object> c : crawledComments) {
                try {
                    String text = (String) c.get("text");
                    String author = (String) c.get("author");
                    String externalId = (String) c.get("external_id");
                    String publishDateStr = (String) c.get("publish_date");

                    if (text == null || text.trim().isEmpty())
                        continue;

                    LocalDateTime commentedAt = parseRelativeDate(publishDateStr);

                    // 중복 체크
                    if (externalId != null && !externalId.isEmpty()
                            && commentRepository.existsByUserIdAndExternalCommentId(userId, externalId)) {
                        skippedCount++;
                        continue;
                    }

                    // 댓글 저장 (기간 필터링 없이 전체 저장)
                    Comment comment = Comment.builder()
                            .userId(userId)
                            .platform("YOUTUBE")
                            .contentUrl(url)
                            .authorName(author)
                            .authorIdentifier(author)
                            .externalCommentId(
                                    externalId != null && !externalId.isEmpty() ? externalId
                                            : UUID.randomUUID().toString())
                            .commentText(text)
                            .commentedAt(commentedAt)
                            .isAnalyzed(false)
                            .isMalicious(false)
                            .createdAt(LocalDateTime.now().withNano(0))
                            .build();

                    Comment savedComment = commentRepository.save(comment);

                    // 분석 수행
                    AnalysisResult result = analysisService.analyzeComment(savedComment.getCommentId(), userId);
                    results.add(result);
                    successCount++;

                } catch (Exception e) {
                    failCount++;
                    e.printStackTrace();
                }
            }

            return Map.of(
                    "totalCrawled", crawledComments.size(),
                    "analyzedCount", successCount,
                    "skippedCount", skippedCount,
                    "failCount", failCount,
                    "results", results);
        });
    }

    /**
     * YouTube의 상대적 시간 문자열(예: "1일 전", "2주 전")을 LocalDateTime으로 변환
     */
    private LocalDateTime parseRelativeDate(String relativeTime) {
        LocalDateTime now = LocalDateTime.now().withNano(0);
        if (relativeTime == null || relativeTime.isEmpty())
            return now;

        try {
            // 숫자 추출
            String numericPart = relativeTime.replaceAll("[^0-9]", "");
            int amount = numericPart.isEmpty() ? 1 : Integer.parseInt(numericPart);

            String timeStr = relativeTime.toLowerCase();
            if (timeStr.contains("초") || timeStr.contains("second")) {
                return now.minusSeconds(amount);
            } else if (timeStr.contains("분") || timeStr.contains("minute")) {
                return now.minusMinutes(amount);
            } else if (timeStr.contains("시간") || timeStr.contains("hour")) {
                return now.minusHours(amount);
            } else if (timeStr.contains("일") || timeStr.contains("day")) {
                return now.minusDays(amount);
            } else if (timeStr.contains("주") || timeStr.contains("week")) {
                return now.minusWeeks(amount);
            } else if (timeStr.contains("달") || timeStr.contains("개월") || timeStr.contains("month")) {
                return now.minusMonths(amount);
            } else if (timeStr.contains("년") || timeStr.contains("year")) {
                return now.minusYears(amount);
            }
        } catch (Exception e) {
            System.err.println("Failed to parse relative date: " + relativeTime);
        }
        return now;
    }

    /**
     * Python 크롤러 호출
     */
    private List<Map<String, Object>> crawlYoutubeComments(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> request = Map.of("url", url);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    aiServiceUrl + "/crawl/youtube",
                    HttpMethod.POST,
                    entity,
                    Map.class);

            Map<String, Object> body = response.getBody();
            if (body != null && "success".equals(body.get("status"))) {
                return (List<Map<String, Object>>) body.get("comments");
            }

            return List.of();

        } catch (Exception e) {
            throw new RuntimeException("Crawling failed: " + e.getMessage());
        }
    }

    /**
     * 댓글 목록 조회
     */
    /**
     * 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Comment> getComments(Long userId, String url, String startDateStr, String endDateStr,
            Boolean isMalicious) {
        System.out.println("[DEBUG] getComments with period: " + startDateStr + " ~ " + endDateStr + ", isMalicious: "
                + isMalicious);

        // 날짜 파싱 (기본값 설정: 기간 미지정 시 전체 또는 최근 1주일)
        java.time.LocalDateTime start = (startDateStr != null && !startDateStr.isEmpty())
                ? java.time.LocalDate.parse(startDateStr).atStartOfDay()
                : java.time.LocalDateTime.now().minusYears(1); // 기본값 크게 설정
        java.time.LocalDateTime end = (endDateStr != null && !endDateStr.isEmpty())
                ? java.time.LocalDate.parse(endDateStr).atTime(23, 59, 59)
                : java.time.LocalDateTime.now();

        if (url != null && !url.isEmpty()) {
            if (isMalicious != null) {
                return commentRepository.findByUserIdAndContentUrlAndIsMaliciousAndCommentedAtBetween(userId, url,
                        isMalicious, start, end);
            }
            return commentRepository.findByUserIdAndContentUrlAndCommentedAtBetween(userId, url, start, end);
        }

        if (isMalicious != null) {
            return commentRepository.findByUserIdAndIsMaliciousAndCommentedAtBetween(userId, isMalicious, start, end);
        }
        return commentRepository.findByUserIdAndCommentedAtBetween(userId, start, end);
    }

    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }

    /**
     * 댓글 다중 삭제 (Batch)
     */
    @Transactional
    public void deleteComments(List<Long> commentIds) {
        commentRepository.deleteAllById(commentIds);
    }

    /**
     * 댓글 전체 삭제 (By URL or All)
     */
    @Transactional
    public void deleteAllComments(Long userId, String url) {
        if (url != null && !url.isEmpty()) {
            commentRepository.deleteByUserIdAndContentUrl(userId, url);
        } else {
            commentRepository.deleteByUserId(userId);
        }
    }
}
