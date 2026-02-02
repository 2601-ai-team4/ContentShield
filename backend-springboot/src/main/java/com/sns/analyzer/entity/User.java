// ==================== User.java ====================
package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id") // #장소영~여기까지: snake_case 컬럼명 확정
    // #여기까지
    private Long userId;

    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false) // #장소영~여기까지: 컬럼명 명시
    // #여기까지
    private String passwordHash;

    @Column(name = "username", length = 50, nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "is_suspended", nullable = false) // #장소영~여기까지
    // #여기까지
    @Builder.Default
    private Boolean isSuspended = false;

    @Column(name = "suspended_until") // #장소영~여기까지
    // #여기까지
    private LocalDateTime suspendedUntil;

    @Column(name = "is_flagged", nullable = false) // #장소영~여기까지
    // #여기까지
    @Builder.Default
    private Boolean isFlagged = false;

    @Column(name = "flag_reason", columnDefinition = "TEXT") // #장소영~여기까지
    // #여기까지
    private String flagReason;

    // ✅ 네이티브쿼리에서 DATE(u.created_at) 쓰므로 매핑 고정
    @Column(name = "created_at", nullable = false) // #장소영~여기까지
    // #여기까지
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at") // #장소영~여기까지
    // #여기까지
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at") // #장소영~여기까지
    // #여기까지
    private LocalDateTime lastLoginAt;

    @Column(name = "suspension_reason") // #장소영~여기까지
    // #여기까지
    private String suspensionReason;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum UserRole { ADMIN, USER }
    public enum UserStatus { ACTIVE, INACTIVE, SUSPENDED, DELETED }
}
