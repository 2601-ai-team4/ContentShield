// ==================== NoticeService.java (로그 기록 추가) ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.AdminLog;
import com.sns.analyzer.entity.Notice;
import com.sns.analyzer.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final AdminService adminService;  // ✅ AdminService 주입

    /**
     * 공지사항 생성
     */
    @Transactional
    public Notice createNotice(Long adminId, String title, String content, String noticeType) {
        log.info("🔵 createNotice called - adminId: {}, title: {}", adminId, title);
        
        Notice notice = Notice.builder()
                .adminId(adminId)
                .title(title)
                .content(content)
                .noticeType(Notice.NoticeType.valueOf(noticeType))
                .build();

        Notice saved = noticeRepository.save(notice);
        log.info("✅ Notice created successfully - noticeId: {}", saved.getNoticeId());
        
        // ✅ 관리자 로그 기록
        adminService.logAdminAction(
            adminId, 
            AdminLog.ActionType.CREATE_NOTICE, 
            "Notice", 
            saved.getNoticeId(),
            String.format("Created notice: %s (Type: %s)", title, noticeType)
        );
        
        return saved;
    }

    /**
     * 전체 공지사항 목록
     */
    @Transactional(readOnly = true)
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc();
    }

    /**
     * 공지사항 상세 조회 (조회수 증가)
     */
    @Transactional
    public Notice getNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));

        // 조회수 증가
        notice.setViewCount(notice.getViewCount() + 1);
        
        return noticeRepository.save(notice);
    }

    /**
     * 공지사항 수정
     */
    @Transactional
    public Notice updateNotice(Long noticeId, Long adminId, String title, String content, String noticeType) {
        log.info("🔵 updateNotice called - noticeId: {}, adminId: {}", noticeId, adminId);
        
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));

        StringBuilder changes = new StringBuilder("Updated notice: ");
        
        if (title != null && !title.equals(notice.getTitle())) {
            notice.setTitle(title);
            changes.append("title, ");
        }
        if (content != null && !content.equals(notice.getContent())) {
            notice.setContent(content);
            changes.append("content, ");
        }
        if (noticeType != null && !noticeType.equals(notice.getNoticeType().name())) {
            notice.setNoticeType(Notice.NoticeType.valueOf(noticeType));
            changes.append("type, ");
        }

        Notice updated = noticeRepository.save(notice);
        log.info("✅ Notice updated successfully - noticeId: {}", noticeId);
        
        // ✅ 관리자 로그 기록
        adminService.logAdminAction(
            adminId,
            AdminLog.ActionType.UPDATE_NOTICE,
            "Notice",
            noticeId,
            changes.toString()
        );
        
        return updated;
    }

    /**
     * 공지사항 삭제
     */
    @Transactional
    public void deleteNotice(Long noticeId, Long adminId) {
        log.info("🔵 deleteNotice called - noticeId: {}, adminId: {}", noticeId, adminId);
        
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));
        
        String noticeTitle = notice.getTitle();
        
        noticeRepository.deleteById(noticeId);
        log.info("✅ Notice deleted successfully - noticeId: {}", noticeId);
        
        // ✅ 관리자 로그 기록
        adminService.logAdminAction(
            adminId,
            AdminLog.ActionType.DELETE_NOTICE,
            "Notice",
            noticeId,
            "Deleted notice: " + noticeTitle
        );
    }

    /**
     * 공지사항 고정/해제
     */
    @Transactional
    public Notice togglePin(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));

        notice.setIsPinned(!notice.getIsPinned());
        return noticeRepository.save(notice);
    }

    /**
     * 페이징된 공지사항 목록
     */
    @Transactional(readOnly = true)
    public Page<Notice> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable);
    }
}