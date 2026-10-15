# Monthly Hisab

## MongoDB setup

1. Create a MongoDB Atlas cluster and database user, then allow the server's IP address in Atlas Network Access.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, a private `APP_PASSWORD`, and a random `SESSION_SECRET` (at least 32 characters). Keep `.env` private; it is ignored by Git.
3. Run `npm install` once.
4. For local development, run `npm run server` in one terminal and `npm run dev` in another. Open the Vite URL and sign in with `APP_PASSWORD`.
5. For a hosted deployment, build the client with `npm run build`, run `npm start`, and configure the host's environment variables from step 2. The Node server serves both the built app and its API.

### Deploying to Vercel

The root `api/` directory contains Vercel Functions for login, logout, and database reads/writes. In the Vercel project settings, add `MONGODB_URI`, `APP_PASSWORD`, and `SESSION_SECRET` as environment variables for the deployment environment, then redeploy. The MongoDB Atlas Network Access rules must allow connections from the deployed functions.

The app stores its full state in one MongoDB document. On the first login to an empty database, it imports the existing browser's `monthly-hisab-v1` local data automatically. After that, MongoDB is the source of truth and the same password gives access from other browsers. This is a single shared-password app; it does not provide separate user accounts.
