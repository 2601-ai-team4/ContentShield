// ==================== Suggestion.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suggestions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Suggestion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long suggestionId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(length = 50)
    private String category;
    
    // ✅ 수정: @Builder.Default 추가로 빌더 패턴에서도 기본값 적용
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SuggestionStatus status = SuggestionStatus.SUBMITTED;
    
    @Column(columnDefinition = "TEXT")
    private String adminResponse;
    
    @Column(name = "admin_id")
    private Long adminId;
    
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // ✅ 엔티티가 처음 저장될 때 자동으로 현재 시간 설정
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        // ✅ 추가: status가 null이면 기본값 설정 (빌더 사용 시 보험)
        if (this.status == null) {
            this.status = SuggestionStatus.SUBMITTED;
        }
    }
    
    // ✅ 엔티티가 업데이트될 때 자동으로 현재 시간 설정
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public enum SuggestionStatus {
        SUBMITTED, IN_PROGRESS, COMPLETED, REJECTED
    }
}