package com.sns.analyzer.controller;

import com.sns.analyzer.entity.*;
import com.sns.analyzer.service.*;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // 임시 주석
import org.springframework.security.core.Authentication; // 임시 주석
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
// @CrossOrigin(origins = "*") // ✅ CORS 설정은 SecurityConfig에서 처리
public class NoticeController {

    private final NoticeService noticeService;
    // private final UserService userService; // 임시 주석

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
     * 공지사항 생성 (테스트용)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createNotice(@RequestBody NoticeRequest request) {
        Long adminId = 1L; // 임시 하드코딩

        Notice notice = noticeService.createNotice(
                adminId,
                request.getTitle(),
                request.getContent(),
                request.getNoticeType().name());

        return ResponseEntity.ok(notice);
    }

    /**
     * 공지사항 수정 (테스트용)
     */
    @PutMapping("/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateNotice(
            @PathVariable Long noticeId,
            @RequestBody NoticeRequest request) {
        Notice updated = noticeService.updateNotice(
                noticeId,
                request.getTitle(),
                request.getContent(),
                request.getNoticeType().name());

        return ResponseEntity.ok(updated);
    }

    /**
     * 공지사항 삭제 (테스트용)
     */
    @DeleteMapping("/{noticeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotice(@PathVariable Long noticeId) {
        noticeService.deleteNotice(noticeId);
        return ResponseEntity.ok(Map.of("message", "Notice deleted"));
    }

    /**
     * 공지사항 고정/해제 (테스트용)
     */
    @PutMapping("/{noticeId}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> togglePin(@PathVariable Long noticeId) {
        Notice notice = noticeService.togglePin(noticeId);
        return ResponseEntity.ok(notice);
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