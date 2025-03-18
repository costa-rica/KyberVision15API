# Modules

These are some of the modules that might need more explaining

## scripts.js

### createEstimatedTimestampStartOfVideo

- expects:
  - actions: Array of action objects
  - deltaTime: float
- returns:
  - estimatedStartOfVideo: Date object
- why:
  - To compute the estimated start of video timestamp and adjust each action accordingly

## queueService.js

- why: called by the POST /videos/montage-service/call to send job to queue and job will call KyberVisionVideoProcessor https://github.com/costa-rica/KyberVisionVideoProcessor01
