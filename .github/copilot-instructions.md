<!-- .github/copilot-instructions.md - concise guidance for AI coding agents working in this repo -->
# Copilot / AI agent quick guide — Gomate-FYP

Short actionable notes to help an AI become productive in this mono-repo.

1) Big-picture architecture
- This repo contains three main apps plus shared libraries:
  - `gomate-backend/` — NestJS REST + WebSocket server (TypeScript, mongoose). Key files: `src/app.module.ts`, `src/main.ts`, `src/socket/gateways/ride.gateway.ts`.
  - `gomate-frontend/` — Passenger app (Expo Router + React Native). Entry: `app/` and `package.json` scripts use `expo start`.
  - `driver-frontend/` — Driver app (Expo Router + React Native). Similar to passenger app; see `app/`, `scripts/reset-project.js`.
  - `gomate-admin/` — Admin dashboard (Next.js). Entry: `app/` and `components/` with `next dev`/`next build` scripts.

2) Integration points & data flows
- Backend exposes REST endpoints (controllers in `gomate-backend/src/*/controllers`) and real-time Socket.IO gateway `ride.gateway.ts`.
- Frontends use REST (axios in `gomate-frontend`) and `socket.io-client` for realtime events that mirror the gateway events (e.g., `createRideRequest`, `receiveCounterOffer`, `offerAccepted`).
- Persistent storage: MongoDB via `mongoose`. Backend loads `.env` via `ConfigModule.forRoot({ envFilePath: '.env' })` and `main.ts` calls `dotenv.config()` — look for `process.env.MONGODB_URI`.

3) How to run locally (most common flows)
- Backend (development):
  - cd into `gomate-backend/`
  - create a `.env` with at least `MONGODB_URI` and optional `PORT`
  - npm install
  - npm run start:dev  (hot-reload NestJS, Swagger UI available at `http://localhost:3000/api`)
- Driver/Passenger (Expo):
  - cd into `driver-frontend/` or `gomate-frontend/`
  - npm install
  - npx expo start  (or `npm run android` / `npm run ios`) — app routing is file-based under `app/`
  - `npm run reset-project` (driver) resets starter code into `app-example` and creates a blank `app/`.
- Admin (Next.js):
  - cd `gomate-admin/`
  - npm install
  - npm run dev

4) Project-specific conventions & patterns
- Expo Router / file-based routing: both mobile apps use the `app/` directory for routes — treat `.tsx` files there as routes.
- NestJS: Config is global via `ConfigModule.forRoot`; DB connection is in `app.module.ts`. Pay attention to lifecycle hooks in `AppModule.onModuleInit()` that log Mongo connection state.
- Realtime pattern: `RideGateway` keeps in-memory Maps for connectedDrivers and connectedPassengers and manages ephemeral offers via  `rideOffers` Map — any change to event names must be kept in sync with clients.
- DTOs & validation: `main.ts` enables `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`. Use DTOs (create-*.dto.ts) and class-validator decorators when changing APIs.

5) Tests, linting, and other scripts
- Backend tests: `npm run test`, `npm run test:e2e`, `npm run test:cov` in `gomate-backend/` (Jest + ts-jest).
- Linting: frontends use `expo lint`; backend uses `eslint` and `prettier` via scripts in `package.json`.

6) Files to inspect first for most tasks (quick jump list)
- Backend: `gomate-backend/src/app.module.ts`, `src/main.ts`, `src/socket/gateways/ride.gateway.ts`, `src/drivers/*`, `src/rides/*`.
- Driver app: `driver-frontend/app/*` — UI routes like `pickup.tsx`, `ride-request.tsx`, `profile.tsx`.
- Passenger app: `gomate-frontend/app/*`.
- Admin: `gomate-admin/app/`, `components/`.

7) Safety notes for automated edits
- Avoid changing socket event names (`createRideRequest`, `registerDriver`, `receiveCounterOffer`, etc.) without updating both server `ride.gateway.ts` and mobile clients.
- When modifying DTOs or validation rules, update client data shapes and maintain backward-compatible changes where possible.

If any section is unclear or you'd like the instructions to include additional examples (e.g., exact socket events used by the mobile clients or common .env keys), tell me which area to expand and I will iterate.
