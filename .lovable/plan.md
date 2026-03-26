

# Plan: Fix Chatbot Scroll, Add CSV Export, Add Predefined Quick Actions

## 1. Fix Chatbot Scrollbar

The `ScrollArea` component wraps messages but the chat panel uses `max-h-[540px]` with `flex-col`. The `ScrollArea` needs explicit height constraints to enable scrolling. Will replace `ScrollArea` with a simple `div` that has `overflow-y-auto` and a fixed height, or give `ScrollArea` proper height via `min-h-0` on the flex child.

**Fix:** Add `min-h-0` to the `ScrollArea` wrapper (required for flex children to allow shrinking below content size) and ensure the viewport scrolls properly.

## 2. Add Predefined Quick Action Menu (like Jio app)

Add a grid of quick-action chips/buttons that appear when the chat is first opened (before any user message beyond welcome). These will be clickable suggestions like:
- "How to connect a database?"
- "What databases are supported?"
- "How to use voice queries?"
- "How to export charts?"
- "Is my data secure?"
- "How to switch chart types?"

Clicking a chip sends that text as a user message. The menu disappears once a user sends any message.

## 3. Add CSV Export for Query Results

Add a "Download CSV" button in the results section of `QueryWorkspace.tsx`. It will convert the current `results` array to CSV format and trigger a browser download using a Blob URL.

## Technical Changes

### File: `src/components/AIChatbot.tsx`
- Add `min-h-0` class to `ScrollArea` so flex layout allows scrolling
- Add a `QUICK_ACTIONS` array of predefined questions
- Render a grid of pill buttons below the welcome message when no user messages exist yet
- Clicking a pill calls `send()` with that text

### File: `src/components/QueryWorkspace.tsx`
- Add a `downloadCSV()` helper that builds CSV from `columns` and `results`
- Add a "Export CSV" button next to the row count header in the results section
- Import `Download` icon from lucide-react

