# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: React 19 + Vite with React Router routes per capability and Bootstrap styling; every view loads data through the shared `getJson` client and shows loading (`role="status"`), empty and error (`role="alert"`) states.
- Logic tier decision: Express 5 + TypeScript on port 8000; thin routes in `routes/api.ts` delegate to `services/octofitService.ts`, which validates input and throws deliberate 4xx errors handled by one error middleware.
- Data tier decision: MongoDB on port 27017 via Mongoose models with `required` validation for User, Team, Activity and Workout; an idempotent upsert-based seed script that never clears unrelated records.
- Activity tracking approach: POST validates `userId`/`teamId` as ObjectIds and checks they exist (400/404, never a cast 500), computes points from minutes with a small intensity bonus and stores `occurredAt`; GET lists newest first.
- Team management approach: POST requires `name` and `mascot` (400 otherwise), validates that member ids exist, and stores members as User references; GET lists teams with their members.
- Leaderboard approach: aggregate activity points grouped by team, join team names, sort by total points descending and assign a 1-based rank.
- Workout suggestions approach: find the user by email (404 if unknown), map recent activity types to a focus (run -> endurance, strength -> strength, yoga -> mobility), rank workouts whose focus matches first and include a `reason`.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
