package com.sns.analyzer.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AdminLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id") // #장소영~여기까지: snake_case 컬럼 고정
    // #여기까지
    private Long logId;

    @Column(name = "admin_id", nullable = false) // #장소영~여기까지
    // #여기까지
    private Long adminId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false) // #장소영~여기까지
    // #여기까지
    private ActionType actionType;

    @Column(name = "target_type", length = 100) // #장소영~여기까지
    // #여기까지
    private String targetType;

    @Column(name = "target_id") // #장소영~여기까지
    // #여기까지
    private Long targetId;

    @Column(name = "description", columnDefinition = "TEXT") // #장소영~여기까지
    // #여기까지
    private String description;

    @Column(name = "ip_address", length = 100) // #장소영~여기까지
    // #여기까지
    private String ipAddress;

    @Column(name = "created_at", nullable = false) // #장소영~여기까지: ORDER BY a.createdAt 정확히 매핑
    // #여기까지
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ActionType {
        SUSPEND_USER, UNSUSPEND_USER, FLAG_USER, UNFLAG_USER,
        CREATE_NOTICE, UPDATE_NOTICE, DELETE_NOTICE,
        RESPOND_SUGGESTION, UPDATE_USER, DELETE_USER
    }
}
