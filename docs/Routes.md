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
