# Repo Remaker Lab

Beginner-friendly setup guide for this project.

## What This Project Is

This is a web app built with:

- React + TypeScript (frontend)
- Vite (development server and build tool)
- Supabase (backend services)

## 1) Install Required Software

You only need these 2 tools:

1. Node.js (recommended: version 18 or newer)
2. Git

How to check if they are installed:

```bash
node -v
git --version
```

If commands are not found, install Node.js and Git first, then reopen terminal.

## 2) Open This Project Folder

In terminal, move into the project folder:

```bash
cd "c:\Users\sahul\Desktop\HCI PROJECT\repo-remaker-lab"
```

Tip: Keep quotes because the path has spaces.

## 3) Install Project Dependencies

Run:

```bash
npm install
```

If Windows gives npm cache permission errors, use:

```bash
npm install --cache .npm-cache
```

## 4) Environment Variables (.env)

This repo already includes a `.env` file, so most people do not need to change anything.

If you need to recreate it, add these keys:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

Important:

- Never commit secret keys.
- `VITE_` variables are exposed to browser code by design.

## 5) Start the App (Development Mode)

Run:

```bash
npm run dev
```

Open the URL shown in terminal. In this project, it is usually:

```text
http://localhost:8080
```

To stop the app, press `Ctrl + C` in the terminal.

## 6) Useful Commands

Run tests once:

```bash
npm test
```

Watch tests while coding:

```bash
npm run test:watch
```

Check lint errors:

```bash
npm run lint
```

Create production build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## 7) First-Time User Checklist

Use this quick checklist:

- `node -v` works
- `npm install` completed with no fatal error
- `.env` exists
- `npm run dev` starts
- App opens in browser

If all 5 are true, your setup is good.

## 8) Common Problems and Fixes

`npm` is not recognized:

- Node.js is not installed or terminal needs restart.

Port already in use:

- Close the old process using that port, then run `npm run dev` again.

Permission/cache errors on Windows:

- Use `npm install --cache .npm-cache`.

Supabase or auth errors in app:

- Check `.env` values are present and correct.

Git commit opens an error about editor pipe:

- Commit from terminal using:

```bash
git commit -m "your message"
```

## 9) Project Structure (Simple View)

- `src/` -> main frontend app code
- `src/components/` -> reusable UI components
- `src/pages/` -> page-level screens
- `supabase/functions/` -> Supabase Edge Functions
- `supabase/migrations/` -> database migration SQL files

## 10) Recommended Learning Path (If You Are New)

1. Run the app first (`npm run dev`).
2. Open `src/pages/` and edit one text label.
3. Refresh browser and see your change.
4. Run `npm test`.
5. Run `npm run build`.