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
    private final AnalysisService analysisService;
    private final BlockedWordService blockedWordService;  // ← 추가
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    /**
     * 유튜브 댓글 크롤링 및 분석
     */
    public Map<String, Object> crawlAndAnalyze(String url, Long userId) {
        System.out.println("[DEBUG] crawlAndAnalyze called for URL: " + url + ", userId: " + userId);
        List<Map<String, Object>> crawledComments = crawlYoutubeComments(url);

        int successCount = 0;
        int failCount = 0;

        List<AnalysisResult> results = new ArrayList<>();

        for (Map<String, Object> c : crawledComments) {
            try {
                String text = (String) c.get("text");
                String author = (String) c.get("author");
                String externalId = (String) c.get("external_id");

                if (text == null || text.trim().isEmpty())
                    continue;

                // 중복 체크
                if (externalId != null && !externalId.isEmpty()
                        && commentRepository.existsByExternalCommentId(externalId)) {
                    System.out.println("[DEBUG] Skipping existing comment: " + externalId);
                    continue;
                }

                // 댓글 저장
                Comment comment = Comment.builder()
                        .userId(userId)
                        .platform("YOUTUBE")
                        .contentUrl(url)
                        .authorName(author)
                        .authorIdentifier(author)
                        .externalCommentId(
                                externalId != null && !externalId.isEmpty() ? externalId : UUID.randomUUID().toString())
                        .content(text)  // ← commentText → content
                        .commentedAt(LocalDateTime.now().withNano(0))
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
                "failCount", failCount,
                "results", results);
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
    @Transactional(readOnly = true)
    public List<Comment> getComments(Long userId, String url) {
        List<Comment> comments;
        
        if (url != null && !url.isEmpty()) {
            comments = commentRepository.findByUserIdAndContentUrl(userId, url);
        } else {
            comments = commentRepository.findByUserId(userId);
        }
        
        // 🔥 차단 단어 체크
        List<BlockedWord> blockedWords = blockedWordService.getActiveBlockedWords(userId);
        
        for (Comment comment : comments) {
            checkBlockedWords(comment, blockedWords);
        }
        
        return comments;
    }

    /**
     * 댓글에 차단 단어 포함 여부 체크
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
}