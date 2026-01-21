# Group 8 Game Project

This repo hosts a cross-platform game with a shared high-score backend and a common Rust client library. The initial goal is to define the mechanics and stand up a minimal end-to-end path: game -> Rust client -> Java REST API -> stored scores.

## Targets

- Web game (HTML/JS)
- Java backend high score server with REST API (post/list scores)
- Rust client library to post/retrieve scores
- Android app implementing the game and consuming the Rust library
- iOS app implementing the game and consuming the Rust library

## Proposed Project Structure

```
/
  web/                # HTML/JS game client
  backend-java/       # Java REST API server for high scores
  rust-client/        # Shared Rust client library for API calls
  android/            # Android app (game + Rust client integration)
  ios/                # iOS app (game + Rust client integration)
  shared/             # Shared assets/specs (game rules, art, etc.)
  docs/               # API spec, architecture notes, onboarding
```

## High Score API (initial draft)

Base URL: `http://localhost:8080/api`

- `POST /scores`
  - Request JSON: `{ "user": "alice", "score": 12345 }`
  - Response: `201 Created` with stored record
- `GET /scores?limit=10`
  - Response JSON: `[ { "user": "alice", "score": 12345, "timestamp": "2025-01-01T12:00:00Z" }, ... ]`

Notes:
- Sort by score descending, then timestamp ascending.
- Validate: user (non-empty, max length 32), score (integer >= 0).

## How the pieces fit

- Web/Android/iOS game clients call the Rust library.
- Rust library talks to Java REST API.
- Java server persists scores (in-memory first, then file/DB later).

## Next steps

1. Define game mechanics and shared assets in `shared/`.
2. Finalize API contract in `docs/API.md`.
3. Implement Java server skeleton in `backend-java/`.
4. Implement Rust client in `rust-client/` with tests.
5. Build the game in `web/`, then port to `android/` and `ios/`.
