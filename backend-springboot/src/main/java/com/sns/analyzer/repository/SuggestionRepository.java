// ==================== SuggestionRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.Suggestion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {
    // Basic list methods (legacy support if needed, or replace?)
    // Let's keep list methods if used elsewhere, but adding Pageable versions is safer to overload.
    List<Suggestion> findByUserId(Long userId);
    
    // Pagination methods
    Page<Suggestion> findByUserId(Long userId, Pageable pageable);
    
    // Status filters with pagination
    Page<Suggestion> findByStatus(Suggestion.SuggestionStatus status, Pageable pageable);
    
    // Basic finds are redundant if we use findAll(Pageable)
    Page<Suggestion> findAll(Pageable pageable);
    
    Integer countByStatus(Suggestion.SuggestionStatus status);
}