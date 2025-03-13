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
