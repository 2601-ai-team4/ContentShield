package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;
    private final UserService userService;

    /**
     * 공지사항 전체 목록 (페이징 없음 - 유저용)
     */
    @GetMapping("/all")
    public ResponseEntity<List<Notice>> getAllNoticesWithoutPaging() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    /**
     * 공지사항 목록 (페이징 지원 - 관리자용)
     */
    @GetMapping
    public ResponseEntity<Page<Notice>> getAllNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("isPinned").descending()
                        .and(Sort.by("createdAt").descending()));

        return ResponseEntity.ok(noticeService.getAllNotices(pageable));
    }

    /**
     * 공지사항 상세
     */
    @GetMapping("/{noticeId}")
    public ResponseEntity<Notice> getNotice(@PathVariable Long noticeId) {
        return ResponseEntity.ok(noticeService.getNotice(noticeId));
    }

    /**
     * 공지사항 생성
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createNotice(
            @RequestBody NoticeRequest request,
            Authentication authentication) {
        
        // ✅ 실제 관리자 ID 가져오기
        Long adminId = getAdminId(authentication);

        Notice notice = noticeService.createNotice(
                adminId,
                request.getTitle(),
                request.getContent(),
                request.getNoticeType().name());

        return ResponseEntity.ok(notice);
    }

    /**
     * 공지사항 수정
     */
    @PutMapping("/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateNotice(
            @PathVariable Long noticeId,
            @RequestBody NoticeRequest request,
            Authentication authentication) {
        
        // ✅ 실제 관리자 ID 가져오기
        Long adminId = getAdminId(authentication);
        
        Notice updated = noticeService.updateNotice(
                noticeId,
                adminId,
                request.getTitle(),
                request.getContent(),
                request.getNoticeType().name());

        return ResponseEntity.ok(updated);
    }

    /**
     * 공지사항 삭제
     */
    @DeleteMapping("/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotice(
            @PathVariable Long noticeId,
            Authentication authentication) {
        
        // ✅ 실제 관리자 ID 가져오기
        Long adminId = getAdminId(authentication);
        
        noticeService.deleteNotice(noticeId, adminId);
        return ResponseEntity.ok(Map.of("message", "Notice deleted"));
    }

    /**
     * 공지사항 고정/해제
     */
    @PutMapping("/{noticeId}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> togglePin(@PathVariable Long noticeId) {
        Notice notice = noticeService.togglePin(noticeId);
        return ResponseEntity.ok(notice);
    }

    /**
     * ✅ Authentication에서 관리자 ID 추출
     */
    private Long getAdminId(Authentication authentication) {
        String email = authentication.getName();
        User admin = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        return admin.getUserId();
    }

    static class NoticeRequest {
        private String title;
        private String content;
        private Notice.NoticeType noticeType;

        public String getTitle() {
            return title;
        }

        public String getContent() {
            return content;
        }

        public Notice.NoticeType getNoticeType() {
            return noticeType;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public void setNoticeType(Notice.NoticeType noticeType) {
            this.noticeType = noticeType;
        }
    }
}