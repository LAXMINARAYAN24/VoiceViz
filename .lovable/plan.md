

## Plan: Always Show SQL Textarea

Currently the SQL textarea is conditionally rendered only when `sql` or `generating` is true (line ~300: `{(sql || generating) && (`). The user wants it visible at all times.

### Changes

**File: `src/components/QueryWorkspace.tsx`**
- Remove the conditional `{(sql || generating) && (` wrapper around the SQL editor section (lines ~300-331)
- Keep the explanation block conditional (only show when there's an explanation)
- Always render the textarea and Run Query button, regardless of whether Generate SQL has been clicked

This is a single-line conditional removal — the textarea, label, and Run button will always be visible once a connection is selected and schema is loaded.

