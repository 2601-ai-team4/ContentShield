// ==================== AuthController.java ====================
package com.sns.analyzer.controller;

import org.springframework.security.core.AuthenticationException;
import com.sns.analyzer.entity.User;
import com.sns.analyzer.service.UserService;
import com.sns.analyzer.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    
    /**
     * 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            User user = userService.createUser(
                request.getEmail(),
                request.getPassword(),
                request.getUsername()
            );
            
            return ResponseEntity.ok(Map.of(
                "message", "User created successfully",
                "userId", user.getUserId()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * 로그인 (isSuspended + isFlagged 추가)
     */
    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
        // 🆕 1. 먼저 이메일로 사용자 존재 여부 확인
        User user = userService.findByEmail(request.getEmail()).orElse(null);
        
        if (user == null) {
            // 🆕 등록되지 않은 이메일
            return ResponseEntity.status(401).body(Map.of(
                "error", "등록되지 않은 이메일입니다. 이메일을 확인해주세요."
            ));
        }
        
        // 🆕 2. 이메일이 존재하면 비밀번호 인증 시도
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            
            String token = tokenProvider.generateToken(authentication);
            userService.updateLastLogin(user.getUserId());
            
            // HashMap 사용 (null 값 허용)
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("userId", user.getUserId());
            response.put("email", user.getEmail());
            response.put("username", user.getUsername() != null ? user.getUsername() : "");
            response.put("role", user.getRole().toString());
            
            // 일시정지 정보
            response.put("isSuspended", user.getIsSuspended() != null ? user.getIsSuspended() : false);
            response.put("suspensionReason", user.getSuspensionReason() != null ? user.getSuspensionReason() : "");
            response.put("suspendedAt", user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : "");
            
            // 주의(플래그) 정보
            response.put("isFlagged", user.getIsFlagged() != null ? user.getIsFlagged() : false);
            response.put("flagReason", user.getFlagReason() != null ? user.getFlagReason() : "");
            response.put("flaggedAt", user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : "");
            
            return ResponseEntity.ok(response);
            
        } catch (AuthenticationException e) {
            // 🆕 비밀번호가 틀린 경우
            return ResponseEntity.status(401).body(Map.of(
                "error", "비밀번호가 올바르지 않습니다. 다시 확인해주세요."
            ));
        }
        
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "error", "로그인 처리 중 오류가 발생했습니다."
        ));
    }
}
    
    /**
     * 현재 사용자 정보
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        
        String email = authentication.getName();
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return ResponseEntity.ok(Map.of(
            "userId", user.getUserId(),
            "email", user.getEmail(),
            "username", user.getUsername() != null ? user.getUsername() : "",
            "role", user.getRole().toString(),
            "status", user.getStatus().toString()
        ));
    }
    
    // DTO 클래스
    static class SignupRequest {
        private String email;
        private String password;
        private String username;
        
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public String getUsername() { return username; }
        
        public void setEmail(String email) { this.email = email; }
        public void setPassword(String password) { this.password = password; }
        public void setUsername(String username) { this.username = username; }
    }
    
    static class LoginRequest {
        private String email;
        private String password;
        
        public String getEmail() { return email; }
        public String getPassword() { return password; }
        
        public void setEmail(String email) { this.email = email; }
        public void setPassword(String password) { this.password = password; }
    }
}