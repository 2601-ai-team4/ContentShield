package com.sns.analyzer.controller;

import com.sns.analyzer.service.CommentCleanupService;
import com.sns.analyzer.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final CommentCleanupService commentCleanupService;
    private final SuggestionService suggestionService;

    @PostMapping("/cleanup")
    public ResponseEntity<?> triggerCleanup() {
        commentCleanupService.cleanupOldComments();
        return ResponseEntity.ok(Map.of("message", "Cleanup triggered manually"));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getTestSuggestions() {
        // Auth bypass for testing
        return ResponseEntity.ok(suggestionService.getAllSuggestions(
                PageRequest.of(0, 10, Sort.by("suggestionId").descending())));
    }
}