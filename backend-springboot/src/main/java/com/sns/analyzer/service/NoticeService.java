// ==================== NoticeService.java ====================
package com.sns.analyzer.service;

import com.sns.analyzer.entity.Notice;
import com.sns.analyzer.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public Notice createNotice(Long adminId, String title, String content, String noticeType) {
        Notice notice = Notice.builder()
                .adminId(adminId)
                .title(title)
                .content(content)
                .noticeType(Notice.NoticeType.valueOf(noticeType))
                .build();

        return noticeRepository.save(notice);
    }

    @Transactional(readOnly = true)
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc();
    }

    @Transactional
    public Notice getNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));

        // ✅ 엔티티의 조회수 직접 증가
        notice.setViewCount(notice.getViewCount() + 1);

        // ✅ 저장 (UPDATE 쿼리 실행)
        return noticeRepository.save(notice);
    }

    // noticeType 파라미터 추가 - 원종성
    public Notice updateNotice(Long noticeId, String title, String content, String noticeType) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));

        if (title != null)
            notice.setTitle(title);
        if (content != null)
            notice.setContent(content);
        if (noticeType != null)
            notice.setNoticeType(Notice.NoticeType.valueOf(noticeType));

        return noticeRepository.save(notice);
    }

    public void deleteNotice(Long noticeId) {
        noticeRepository.deleteById(noticeId);
    }

    public Notice togglePin(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found"));

        notice.setIsPinned(!notice.getIsPinned());
        return noticeRepository.save(notice);
    }

    public Page<Notice> getAllNotices(Pageable pageable) {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable);
    }
}