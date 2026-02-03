# Backend — Task Plan Prototype

This Express server exposes a simple endpoint to generate a mock study plan.

Endpoints

- `POST /api/generate-plan` — JSON body: `{ "prompt": "create a study plan for 3 months frontend interview preparation" }`.
  - Returns `{ meta, plan }` where `plan` is an array of weeks, each with tasks.

- `GET /api/health` — health check.

To plug a real AI provider (OpenAI):
- Replace the logic in `server.js` under `/api/generate-plan` with an API call to the provider using an API key from an env var.
- Validate and sanitize prompt inputs.
Using a real AI provider

- The server will automatically use OpenAI if you set `OPENAI_API_KEY` in your environment. The backend requests the model to return strict JSON matching the prototype shape; if the AI response cannot be parsed, the server falls back to the mock plan generator.

Setup example

1. Copy the example env file and add your key:

```bash
cp .env.example .env
# then edit .env and set OPENAI_API_KEY
```

2. (Optional) If your Node version is older than 18, install `node-fetch`:

```bash
npm install node-fetch
```

Run

```bash
cd backend
npm install
npm start
```

Server runs on port 4000 by default.
