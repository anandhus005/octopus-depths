# The Cute Octopus
Scroll-driven Canvas 2D experience (Vite + Lenis, no other runtime deps).

## Run locally
    npm install
    npm run dev        # open the printed http://localhost:5173

## Build
    npm run build && npm run preview

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → Add New → Project → import the repo.
3. Vercel auto-detects Vite (build: `npm run build`, output: `dist`). Click Deploy.
(or: `npm i -g vercel && vercel`)
