package com.group8.highscores.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ScoreRequest {
    @NotBlank(message = "User cannot be blank")
    @Size(max = 32, message = "User must be at most 32 characters")
    private String user;

    @Min(value = 0, message = "Score must be >= 0")
    private Long score;

    public ScoreRequest() {
    }

    public ScoreRequest(String user, Long score) {
        this.user = user;
        this.score = score;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public Long getScore() {
        return score;
    }

    public void setScore(Long score) {
        this.score = score;
    }
}
