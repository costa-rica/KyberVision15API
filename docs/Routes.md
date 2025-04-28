# Routes

## matches

### GET /matches/1/actions

- expects:
  - matchId: string
- returns:
  - actions: Array of action objects
  - estimatedStartOfVideo: Date object
- why:
  - The result of this is used for the ReviewVideo component in the mobile app. This route gets all actions for a match and adjust their timestamps.

## videos

### POST /montage-service/call

-why: this will be used to call the montage service that is running on the same server.

- how: it uses `const { spawn } = require("child_process");`

### POST /montage-service/video-completed-notify-user

- This has worked in test:

```sh
curl -X POST "http://localhost:8001/videos/montage-service/video-completed-notify-user" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQyMzY2MTIzLCJleHAiOjE3NDIzODQxMjN9.sXFFvkG2rbpO7WBhQaFO57ttUYgCQxHYo3YUDTjFcuQ" \
     -d '{
           "filename": "/home/shared/project_resources/KyberVision14API/match_videos/montage_complete/montage_1742316520107.mp4",
           "user": { "id": 1 }
         }'
```
