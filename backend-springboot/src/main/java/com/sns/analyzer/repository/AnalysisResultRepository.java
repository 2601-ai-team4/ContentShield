// ==================== AnalysisResultRepository.java ====================
package com.sns.analyzer.repository;

import com.sns.analyzer.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    Optional<AnalysisResult> findByCommentId(Long commentId);

    List<AnalysisResult> findByUserId(Long userId);

    void deleteByUserId(Long userId); // 전체 삭제용

    List<AnalysisResult> findByUserIdAndAnalyzedAtAfter(Long userId, LocalDateTime after);

    List<AnalysisResult> findByCategory(String category);

    @Query("SELECT AVG(a.toxicityScore) FROM AnalysisResult a WHERE a.userId = :userId")
    Double getAverageToxicityScoreByUserId(Long userId);

    Integer countByUserId(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM AnalysisResult a WHERE a.userId = :userId AND a.commentId IN (SELECT c.commentId FROM Comment c WHERE c.userId = :userId AND c.contentUrl = :url AND c.commentedAt BETWEEN :start AND :end)")
    void deleteByUrlAndPeriod(Long userId, String url, LocalDateTime start, LocalDateTime end);
}