package com.group8.highscores.controller;

import com.group8.highscores.dto.ScoreRequest;
import com.group8.highscores.model.Score;
import com.group8.highscores.service.ScoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {
    private final ScoreService scoreService;

    @Autowired
    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping
    public ResponseEntity<Score> createScore(@Valid @RequestBody ScoreRequest scoreRequest) {
        Score savedScore = scoreService.updateScore(scoreRequest.getUser(), scoreRequest.getScore());
        return ResponseEntity.status(HttpStatus.CREATED).body(savedScore);
    }

    @GetMapping
    public ResponseEntity<List<Score>> getScores(@RequestParam(required = false) Integer limit) {
        List<Score> scores = scoreService.getAllScores(limit);
        return ResponseEntity.ok(scores);
    }
}
