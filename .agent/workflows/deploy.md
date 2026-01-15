---
description: Deploy DiscipleMe to Firebase (Hosting + Functions)
---
1. Login to Firebase CLI (if not already logged in):
   `firebase login`

2. Deploy everything (Hosting + Functions):
   `npm run deploy`
   
   *This command builds your frontend code and deploys both the static assets to Firebase Hosting and the backend code to Cloud Functions.*

Or deploy individually:

- **Hosting only**: `npm run deploy:hosting`
  *Use this for frontend-only changes (HTML, CSS, JS)*

- **Functions only**: `npm run deploy:functions`
  *Use this for backend-only changes (AI logic, Payment logic)*

## Verification
After deployment, visit your live URL (e.g., https://your-project-id.web.app) to verify the changes.
