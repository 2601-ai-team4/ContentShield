package com.sns.analyzer.service;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final BlockedWordService blockedWordService; // ← 추가
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
        transactionTemplate.execute(status -> {
            try {
                System.out.println("[DEBUG] Clearing COMMENTS table for user: " + userId + " (Keeping History)");
                commentRepository.deleteByUserId(userId);
                commentRepository.flush();
                return null;
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to cleanup data: " + e.getMessage());
                return null;
            }
        });

        // 1. Python AI 서버에 크롤링 요청
        List<Map<String, Object>> crawledComments = crawlYoutubeComments(url);

        // 2. DB 저장 및 분석
        return transactionTemplate.execute(txStatus -> {
            int successCount = 0;
            int failCount = 0;
            int skippedCount = 0;

            // 🔥 차단 단어 목록 미리 조회 (루프 최적화)
            List<BlockedWord> blockedWords = blockedWordService.getActiveBlockedWords(userId);

            for (Map<String, Object> c : crawledComments) {
                try {
                    String externalId = (String) c.get("external_id");
                    // 중복 체크
                    if (externalId != null && !externalId.isEmpty()
                            && commentRepository.existsByUserIdAndExternalCommentId(userId, externalId)) {
                        skipped++;
                        continue;
                    }

                    String text = (String) c.get("text");
                    String author = (String) c.get("author");
                    String publishDateStr = (String) c.get("publish_date");

                    if (text == null || text.trim().isEmpty())
                        continue;

                    LocalDateTime commentedAt = parseRelativeDate(publishDateStr);

                    if (commentedAt.isBefore(limitStart) || commentedAt.isAfter(limitEnd)) {
                        continue;
                    }

                    // 🔥 차단 단어 체크 (저장 시점)
                    boolean isBlocked = false;
                    String matchedWord = null;

                    if (text != null) {
                        String lowerText = text.toLowerCase();
                        for (BlockedWord bw : blockedWords) {
                            if (lowerText.contains(bw.getWord().toLowerCase())) {
                                isBlocked = true;
                                matchedWord = bw.getWord();
                                break;
                            }
                        }
                    }
                    Comment comment = Comment.builder()
                            .userId(userId)
                            .platform("YOUTUBE")
                            .contentUrl(url)
                            .authorName(author)
                            .authorIdentifier(author)
                            .externalCommentId(
                                    externalId != null && !externalId.isEmpty() ? externalId
                                            : UUID.randomUUID().toString())
                            .content(text)
                            .commentedAt(commentedAt)
                            .isAnalyzed(false)
                            .isMalicious(isBlocked) // 🔥 차단 단어 포함 시 true
                            .isBlacklisted(isBlocked) // 히스토리 호환성
                            .createdAt(LocalDateTime.now().withNano(0))
                            .build();

<<<<<<< Updated upstream
                    if (isBlocked) {
                        comment.setContainsBlockedWord(true);
                        comment.setMatchedBlockedWord(matchedWord);
                    }

                    commentRepository.save(comment);
                    successCount++;
=======
                    Comment saved = commentRepository.save(comment);
                    ids.add(saved.getCommentId());
>>>>>>> Stashed changes

                } catch (Exception e) {
                    System.err.println("[ERROR] Failed to save comment: " + e.getMessage());
                }
            }
<<<<<<< Updated upstream

            return Map.of(
                    "totalCrawled", crawledComments.size(),
                    "savedCount", successCount,
                    "skippedCount", skippedCount,
                    "failCount", failCount);
=======
            return Map.of("ids", ids, "skipped", skipped); // Explicitly specify types if needed, but Map.of infers
>>>>>>> Stashed changes
        });

        List<Long> savedIds = (List<Long>) saveResult.get("ids");
        int skippedCount = (int) saveResult.get("skipped");

        // 3. 분석 수행 (트랜잭션 2...N: 개별 분석)
        // comments are already committed here, so REQUIRES_NEW in analyzeComment will
        // work perfectly.
        int successCount = 0;
        int failCount = 0;
        List<AnalysisResult> results = new ArrayList<>();

        for (Long id : savedIds) {
            try {
                AnalysisResult result = analysisService.analyzeComment(id, userId);
                results.add(result);
                successCount++;
            } catch (Exception e) {
                failCount++;
                System.err.println("[ERROR] Analysis Failed for commentId " + id + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        return Map.of(
                "totalCrawled", crawledComments.size(),
                "analyzedCount", successCount,
                "skippedCount", skippedCount,
                "failCount", failCount,
                "results", results);
    }

    /**
     * 다수 댓글 대량 분석
     */
    public Map<String, Object> analyzeBulk(Long userId, List<Long> commentIds) {
        int analyzedCount = 0;
        int errorCount = 0;
        List<AnalysisResult> results = new ArrayList<>();

        for (Long id : commentIds) {
            try {
                AnalysisResult res = analysisService.analyzeComment(id, userId);
                results.add(res);
                analyzedCount++;
            } catch (Exception e) {
                errorCount++;
                System.err.println("[ERROR] Failed to analyze comment " + id + ": " + e.getMessage());
            }
        }

        return Map.of(
                "analyzedCount", analyzedCount,
                "errorCount", errorCount,
                "results", results);
    }

    /**
     * YouTube의 상대적 시간 문자열(예: "1일 전", "2주 전")을 LocalDateTime으로 변환
     */
    private LocalDateTime parseRelativeDate(String relativeTime) {
        LocalDateTime now = LocalDateTime.now().withNano(0);
        if (relativeTime == null || relativeTime.isEmpty())
            return now;

        try {
            // 절대 날짜 형식 처리 (예: "2024. 1. 20.", "2024-01-20")
            String cleanDate = relativeTime.replaceAll("[^0-9.\\-]", "");
            if (cleanDate.matches("\\d{4}[.\\-]\\d{1,2}[.\\-]\\d{1,2}.?")) {
                String[] parts = cleanDate.split("[.\\-]");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                int day = Integer.parseInt(parts[2].replaceAll("[^0-9]", ""));
                return java.time.LocalDate.of(year, month, day).atStartOfDay();
            }

            // 상대적 시간 처리
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
            System.err.println("Failed to parse date: " + relativeTime + " - " + e.getMessage());
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
     * 댓글 목록 조회 (차단 단어 체크 포함)
     */
    /**
     * 댓글 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<Comment> getComments(Long userId, String url, String startDateStr, String endDateStr,
            Boolean isMalicious, Pageable pageable) {
        System.out.println("[DEBUG] getComments with period: " + startDateStr + " ~ " + endDateStr + ", isMalicious: "
                + isMalicious + ", page: " + pageable.getPageNumber());

        // 날짜 파싱 (기본값 설정)
        java.time.LocalDateTime start = (startDateStr != null && !startDateStr.isEmpty())
                ? java.time.LocalDate.parse(startDateStr).atStartOfDay()
                : java.time.LocalDateTime.now().minusYears(1);
        java.time.LocalDateTime end = (endDateStr != null && !endDateStr.isEmpty())
                ? java.time.LocalDate.parse(endDateStr).atTime(23, 59, 59)
                : java.time.LocalDateTime.now();

        Page<Comment> commentsPage;

        if (url != null && !url.isEmpty()) {
            System.out.println("[DEBUG] Querying by URL: [" + url + "], range: " + start + " ~ " + end);
            if (isMalicious != null) {
                commentsPage = commentRepository.findByUserIdAndContentUrlAndIsMaliciousAndCommentedAtBetween(userId,
                        url,
                        isMalicious, start, end, pageable);
            } else {
                commentsPage = commentRepository.findByUserIdAndContentUrlAndCommentedAtBetween(userId, url, start, end,
                        pageable);
            }
        } else {
            System.out.println("[DEBUG] Querying all for user: " + userId + ", range: " + start + " ~ " + end);
            if (isMalicious != null) {
                commentsPage = commentRepository.findByUserIdAndIsMaliciousAndCommentedAtBetween(userId, isMalicious,
                        start,
                        end, pageable);
            } else {
                commentsPage = commentRepository.findByUserIdAndCommentedAtBetween(userId, start, end, pageable);
            }
        }

        System.out.println("[DEBUG] Found comments count: " + commentsPage.getTotalElements());

        // 🔥 차단 단어 체크 (blockedWords)
        List<BlockedWord> blockedWords = blockedWordService.getActiveBlockedWords(userId);
        for (Comment comment : commentsPage.getContent()) {
            checkBlockedWords(comment, blockedWords);
        }

        return commentsPage;
    }

    /**
     * 댓글에 차단 단어 포함 여부 체크 및 상태 업데이트 (조회 시 시각적 표시용)
     */
    private void checkBlockedWords(Comment comment, List<BlockedWord> blockedWords) {
        if (comment.getContent() == null || blockedWords.isEmpty()) {
            return;
        }

        String content = comment.getContent().toLowerCase();

        for (BlockedWord word : blockedWords) {
            if (content.contains(word.getWord().toLowerCase())) {
                comment.setContainsBlockedWord(true);
                comment.setMatchedBlockedWord(word.getWord());
                // 조회 시점에도 실시간으로 차단 단어 포함 여부를 보고 악성으로 간주하도록 함
                comment.setIsMalicious(true);
                return;
            }
        }
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
