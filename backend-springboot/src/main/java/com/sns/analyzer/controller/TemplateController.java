package com.sns.analyzer.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    // MVP: 메모리 저장소(서버 재시작 시 초기화)
    private final Map<Long, Map<String, Object>> store = new ConcurrentHashMap<>();

    // GET /api/templates
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        return ResponseEntity.ok(new ArrayList<>(store.values()));
    }

    // POST /api/templates
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        long id = System.currentTimeMillis();
        body.put("id", id);
        store.put(id, body);
        return ResponseEntity.ok(body);
    }

    // DELETE /api/templates/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        store.remove(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
