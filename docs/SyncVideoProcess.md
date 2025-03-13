# Sync Video Process

# 1. Live actions are recorded with utc timestamps

# 2. Video is uploaded

# 3.1 (optional) Video update for videoFileCreatedDateTimeEstimate

⚠️ Doesn't work so well consider skipping

- POST /videos/update/:videoId
- accepts body: { videoFileCreatedDateTimeEstimate: datetime (could be string - seems forgiving) }

# 3.2 (should do if 3.1 is executed) Update a SyncContract deltaTime

⚠️ Doesn't work so well consider skipping

- Specifically this route will use the corresponding videoFileCreatedDateTimeEstimate to compute the deltaTime from the first action in the corresponding script

- route POST /sync-contracts/update-delta-with-default/:syncContractId
- uses the corresponding videoFileCreatedDateTimeEstimate to compute the deltaTime from the first action
- updates the SyncContract deltaTime

# 5. (optional) Update a SyncContract deltaTime manually

- route POST /sync-contracts/update-delta/:syncContractId
- body: { deltaTime: float }

# 6. When matches are accessed GET /matches/:matchId/actions

- uses the SyncContract deltaTime to adjust the timestamps of the actions
- returns the adjusted actions
