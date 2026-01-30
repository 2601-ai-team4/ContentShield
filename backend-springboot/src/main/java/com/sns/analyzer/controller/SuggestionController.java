package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/suggestions")
@RequiredArgsConstructor
public class SuggestionController {
    
    private final SuggestionService suggestionService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<Suggestion>> getMySuggestions(
        Authentication authentication,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "5") int size
    ) {
        Long userId = getUserId(authentication);
        System.out.println("DEBUG: getMySuggestions called for userId: " + userId + ", page: " + page + ", size: " + size);
        
        PageRequest pageable = PageRequest.of(page, size, Sort.by("suggestionId").descending());
        Page<Suggestion> result = suggestionService.getUserSuggestions(userId, pageable);
        System.out.println("DEBUG: Found " + result.getTotalElements() + " suggestions for user " + userId);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * 모든 건의사항 조회 (관리자만, 페이징)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Suggestion>> getAllSuggestions(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "5") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("suggestionId").descending());
        return ResponseEntity.ok(suggestionService.getAllSuggestions(pageable));
    }
    
    /**
     * 건의사항 상세
     */
    @GetMapping("/{suggestionId}")
    public ResponseEntity<Suggestion> getSuggestion(@PathVariable Long suggestionId) {
        // TODO: This is inefficient. Should add findById to Service.
        // Temporary fix to support compilation after pagination change
        return ResponseEntity.ok(
            suggestionService.getAllSuggestions(PageRequest.of(0, 1000)).stream()
                .filter(s -> s.getSuggestionId().equals(suggestionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Suggestion not found"))
        );
    }
    
    /**
     * 건의사항 생성
     */
    @PostMapping
    public ResponseEntity<?> createSuggestion(
        Authentication authentication,
        @RequestBody SuggestionRequest request
    ) {
        try {
            System.out.println("DEBUG: createSuggestion called");
            if (authentication != null) {
                System.out.println("DEBUG: Authentication name: " + authentication.getName());
                System.out.println("DEBUG: Authorities: " + authentication.getAuthorities());
            } else {
                System.out.println("DEBUG: Authentication is NULL");
            }

            Long userId = getUserId(authentication);
            System.out.println("DEBUG: Found userId: " + userId);
            
            Suggestion suggestion = suggestionService.createSuggestion(
                userId,
                request.getTitle(),
                request.getContent()
            );
            
            return ResponseEntity.ok(suggestion);
        } catch (Exception e) {
            System.err.println("ERROR: createSuggestion failed");
            e.printStackTrace();
            throw e;
        }
    }

    // ... (other methods)

    private Long getUserId(Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        String email = authentication.getName();
        System.out.println("DEBUG: Looking up user by email: " + email);
        
        User user = userService.findByEmail(email)
            .orElseThrow(() -> {
                System.out.println("DEBUG: User not found for email: " + email);
                return new IllegalArgumentException("User not found");
            });
        return user.getUserId();
    }
    
    /**
     * 건의사항 상태 변경 (관리자만)
     */
    @PutMapping("/{suggestionId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
        @PathVariable Long suggestionId,
        @RequestBody Map<String, String> body
    ) {
        Suggestion.SuggestionStatus status = Suggestion.SuggestionStatus.valueOf(body.get("status"));
        
        Suggestion updated = suggestionService.updateStatus(suggestionId, status.name());
        
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 건의사항 답변 (관리자만)
     */
    @PostMapping("/{suggestionId}/response")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> respondToSuggestion(
        @PathVariable Long suggestionId,
        @RequestBody Map<String, String> body,
        Authentication authentication
    ) {
        Long adminId = getAdminId(authentication);
        
        Suggestion responded = suggestionService.respondToSuggestion(
            suggestionId,
            adminId,
            body.get("response"),
            body.get("status") // status 추가 전달
        );
        
        return ResponseEntity.ok(responded);
    }
    

    
    private Long getAdminId(Authentication authentication) {
        if (authentication == null || "anonymousUser".equals(authentication.getName())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Admin not authenticated");
        }
        String email = authentication.getName();
        User admin = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return admin.getUserId();
    }
    
    static class SuggestionRequest {
        private String title;
        private String content;
        
        public String getTitle() { return title; }
        public String getContent() { return content; }
        
        public void setTitle(String title) { this.title = title; }
        public void setContent(String content) { this.content = content; }
    }
}