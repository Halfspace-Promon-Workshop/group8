package com.group8.highscores.repository;

import com.group8.highscores.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    Optional<Score> findByUser(String user);

    @Query("SELECT s FROM Score s ORDER BY s.score DESC, s.timestamp ASC")
    List<Score> findAllOrderByScoreDescTimestampAsc();
}
