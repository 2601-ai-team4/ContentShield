// ==================== SuggestionService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.Suggestion;
import com.sns.analyzer.repository.SuggestionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SuggestionService {
    
    private final SuggestionRepository suggestionRepository;
    
    public Suggestion createSuggestion(Long userId, String title, String content) {
        Suggestion suggestion = Suggestion.builder()
            .userId(userId)
            .title(title)
            .content(content)
            .build();
        
        return suggestionRepository.save(suggestion);
    }
    
    @Transactional(readOnly = true)
    public Page<Suggestion> getUserSuggestions(Long userId, Pageable pageable) {
        return suggestionRepository.findByUserId(userId, pageable);
    }
    
    @Transactional(readOnly = true)
    public Page<Suggestion> getAllSuggestions(Pageable pageable) {
        return suggestionRepository.findAll(pageable);
    }
    
    @Transactional(readOnly = true)
    public Page<Suggestion> getSuggestionsByStatus(Suggestion.SuggestionStatus status, Pageable pageable) {
        return suggestionRepository.findByStatus(status, pageable);
    }
    
    public Suggestion updateStatus(Long suggestionId, String status) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
            .orElseThrow(() -> new IllegalArgumentException("Suggestion not found"));
        
        suggestion.setStatus(Suggestion.SuggestionStatus.valueOf(status));
        return suggestionRepository.save(suggestion);
    }
    
    public Suggestion respondToSuggestion(Long suggestionId, Long adminId, String response, String status) {
        Suggestion suggestion = suggestionRepository.findById(suggestionId)
            .orElseThrow(() -> new IllegalArgumentException("Suggestion not found"));
        
        suggestion.setAdminResponse(response);
        suggestion.setAdminId(adminId);
        suggestion.setRespondedAt(LocalDateTime.now());
        
        if (status != null && !status.isEmpty()) {
            suggestion.setStatus(Suggestion.SuggestionStatus.valueOf(status));
        } else {
            suggestion.setStatus(Suggestion.SuggestionStatus.COMPLETED);
        }
        
        return suggestionRepository.save(suggestion);
    }
}