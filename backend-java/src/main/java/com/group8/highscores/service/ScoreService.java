package com.group8.highscores.service;

import com.group8.highscores.model.Score;
import com.group8.highscores.repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreService {
    private final ScoreRepository scoreRepository;

    @Autowired
    public ScoreService(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    @Transactional
    public Score updateScore(String user, Long score) {
        Optional<Score> existingScore = scoreRepository.findByUser(user);
        
        if (existingScore.isPresent()) {
            Score scoreEntity = existingScore.get();
            // Only update if new score is higher
            if (score > scoreEntity.getScore()) {
                scoreEntity.setScore(score);
                scoreEntity.setTimestamp(java.time.Instant.now());
                return scoreRepository.save(scoreEntity);
            }
            return scoreEntity;
        } else {
            // Create new score entry
            Score newScore = new Score(user, score);
            return scoreRepository.save(newScore);
        }
    }

    public List<Score> getAllScores(Integer limit) {
        List<Score> allScores = scoreRepository.findAllOrderByScoreDescTimestampAsc();
        
        if (limit != null && limit > 0) {
            return allScores.stream()
                    .limit(limit)
                    .toList();
        }
        
        return allScores;
    }
}
