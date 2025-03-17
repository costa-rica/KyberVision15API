![Logo](./docs/images/kyberVisionLogo01.png)

# API v0.11.0

## Description

The API for Kyber Vision. This applicaiton allows users to:

- register, login
- upload videos
- create matches
- submit actions
- all connected to sqlite database (using sequelize)
- register confirmation emails using nodemailer
- database backups in AdminDb.js files

### Developer Notes

- This version merged the changes from KV API10 (through the db_backup_01 branch which is ahead of main as of 2025-03-13)
- As of 2025-03-13, the servers kv10 and kv11 are running the db_backup_01 branch
  - We intend that these will be merged to main after some testing and no errors
  - If errors exist, we can compare this repo KV API11 with the KV API10 main branch

## .env

```
APP_NAME=KyberVisionAPI11
JWT_SECRET=<your_code_here>
PORT=<your_port_here>
PATH_DATABASE=/home/dashanddata_user/databases/KyberVisionAPI11/
PATH_VIDEOS=/home/dashanddata_user/project_resources/KyberVisionAPI11/match_videos
PATH_VIDEOS_MONTAGE_CLIPS=/home/dashanddata_user/project_resources/KyberVisionAPI11/match_videos/montage_clips
PATH_VIDEOS_MONTAGE_COMPLETE=/home/dashanddata_user/project_resources/KyberVisionAPI11/match_videos/montage_complete
NAME_DB=kv11.db
ADMIN_EMAIL_ADDRESS=kyber.vision.info@gmail.com
ADMIN_EMAIL_PASSWORD="app pass word from google app password"
PATH_DB_BACKUPS=/home/shared/project_resources/KyberVisionAPI11/db_backups
PATH_PROJECT_RESOURCES=/home/shared/project_resources/KyberVisionAPI11
ADMIN_EMAIL_KV_MANAGER_WEBSITE=["nrodrig1@gmail.com"]
URL_KV_MANAGER_WEBSITE=https://kv11-manager.dashanddata.com
```

## nodemailer emails

- create folder in project_resources/KyberVisionAPI11
  - "project_resources/KyberVisionAPI11/nodemailer_html_templates"

## Sync Video Process details found here (as of 2025-03-13):

- [Sync Video Process](./docs/SyncVideoProcess.md)

## Routes details found here:

- [Routes](./docs/Routes.md)

## Modules details found here:

- [Modules](./docs/Modules.md)

## Test request to upload video

```bash
curl -X POST http://localhost:8000/videos/upload-video \
  -F "video=@/Users/nick/Documents/_testData/testVideos/ProblemStatement15.mp4" \
  -F "teamHome=Team A" \
  -F "teamAway=Team B" \
  -F "dateOfMatch=2024-12-15"
```

```bash
curl -X POST http://192.168.1.18:8001/videos/upload-video \
  -F "video=@/Users/nick/Documents/_testData/testVideos/ProblemStatement15.mp4" \
  -F "teamHome=Team AUC" \
  -F "teamAway=Team B" \
  -F "dateOfMatch=2024-12-13"
```

## video installations

`npm install multer ffmpeg ffmpeg-static fluent-ffmpeg`
`yarn add multer ffmpeg ffmpeg-static fluent-ffmpeg`

### more

- mac `brew install ffmpeg`
- Ubuntu/Debian:

```
sudo apt update
sudo apt install ffmpeg
```

## Folder structure

```
.
├── README.md
├── app.js
├── bin
│   └── www
├── docs
│   ├── Routes.md
│   └── images
├── middleware
│   └── auth.js
├── models
│   ├── Action.js
│   ├── CompetitionContract.js
│   ├── Complex.js
│   ├── GroupContract.js
│   ├── League.js
│   ├── Match.js
│   ├── OpponentServeTimestamp.js
│   ├── Player.js
│   ├── PlayerContract.js
│   ├── Point.js
│   ├── Script.js
│   ├── SyncContract.js
│   ├── Team.js
│   ├── User.js
│   ├── Video.js
│   └── _connection.js
├── modules
│   ├── common.js
│   ├── match.js
│   ├── userAuthentication.js
│   └── videoProcessing.js
├── node_modules
├── package.json
├── public
│   ├── images
│   ├── index.html
│   └── stylesheets
├── routes
│   ├── actions.js
│   ├── adminDb.js
│   ├── groups.js
│   ├── index.js
│   ├── matches.js
│   ├── players.js
│   ├── scripts.js
│   ├── syncContracts.js
│   ├── teams.js
│   ├── users.js
│   └── videos.js
├── server.js
└── yarn.lock
```

## Troubleshooting

### 1. Error: `Error reading video metadata`

- install the ffmpeg package
