VoiceViz

A full-stack SQL analytics platform that lets users query and explore databases using natural language and voice, instead of writing raw SQL.

Overview

VoiceViz turns spoken or typed natural-language questions into database queries and visual results. It's built for teams who want to explore data without needing to know SQL, while still giving power users a real, secure, multi-workspace analytics environment.

Features


Voice-to-query — ask questions out loud or by typing plain English; VoiceViz translates them into SQL and runs them against the connected database
Authentication & protected routing — secure sign-in with route-level access control so only authorized users reach workspace data
Multi-user workspace management — isolate data, queries, and dashboards per workspace so multiple teams/users can work independently
Schema exploration — browse tables, columns, and relationships visually instead of digging through raw schema dumps
Interactive result visualization — query results are rendered as charts/tables that update as you explore


Tech Stack

LayerTechnologyFrontendReact, TypeScriptBackendFastAPIDatabase / Backend servicesSupabase

How It Works


User submits a question via voice or text
The backend parses the query intent and converts it into a SQL query
FastAPI executes the query against the connected database via Supabase
Results are returned and rendered as interactive visualizations (tables/charts) in the React frontend
Users can drill into schema details directly from the results view


Getting Started

bash# clone the repo
git clone https://github.com/LAXMINARAYAN24/VoiceViz.git
cd VoiceViz

# install frontend dependencies
npm install

# set up environment variables
# create a .env file with your Supabase project credentials:
# VITE_SUPABASE_PROJECT_ID=your_project_id
# VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
# VITE_SUPABASE_URL=https://your-project.supabase.co

# run the dev server
npm run dev

Open the URL shown in the terminal (typically http://localhost:8080).

Project Structure

src/
  components/   # reusable UI components
  pages/        # page-level views
supabase/
  functions/    # Supabase Edge Functions
  migrations/   # database migration SQL

License

MIT
