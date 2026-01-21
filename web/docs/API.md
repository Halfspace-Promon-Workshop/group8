# High Score API (OpenAPI 3.0)

```yaml
openapi: 3.0.3
info:
  title: High Score API
  version: 0.1.0
  description: REST API for posting and retrieving game high scores.
servers:
  - url: http://localhost:8080/api
paths:
  /scores:
    post:
      summary: Create a new high score
      operationId: createScore
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ScoreCreate"
            examples:
              example:
                value:
                  user: alice
                  score: 12345
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Score"
        "400":
          description: Invalid input
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
    get:
      summary: List high scores
      operationId: listScores
      parameters:
        - name: limit
          in: query
          description: Maximum number of results to return
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
      responses:
        "200":
          description: A list of high scores
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Score"
        "400":
          description: Invalid query parameter
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
components:
  schemas:
    ScoreCreate:
      type: object
      required:
        - user
        - score
      properties:
        user:
          type: string
          minLength: 1
          maxLength: 32
        score:
          type: integer
          minimum: 0
    Score:
      type: object
      required:
        - user
        - score
        - timestamp
      properties:
        user:
          type: string
          minLength: 1
          maxLength: 32
        score:
          type: integer
          minimum: 0
        timestamp:
          type: string
          format: date-time
    Error:
      type: object
      required:
        - message
      properties:
        message:
          type: string
```
