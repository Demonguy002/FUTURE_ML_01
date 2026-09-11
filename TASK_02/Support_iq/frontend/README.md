# SupportIQ Frontend

React + Vite frontend for SupportIQ.

## Run locally

```bash
npm install
npm run dev
```

Open: http://localhost:5173

The local Vite server proxies `/api/*` requests to the deployed SupportIQ Render backend, so the browser does not call Render directly.

## Build

```bash
npm run build
```

## Deploy to Vercel

Upload/push this `supportiq_frontend` folder as the frontend project. `vercel.json` proxies `/api/*` to the deployed backend and preserves SPA navigation.
