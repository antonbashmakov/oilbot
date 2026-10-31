---
name: verify-in-browser
description: Check a change in this Next.js app in a real browser — start the dev server on a free port, open the changed pages at desktop and mobile width, walk the flow, read the console and network calls, record evidence in the work log, stop the server. Use before handing a UI task to review, or when asked to check, run or show the app.
---

# Verify a change in the browser

Rules: `111-testing.md` (111.3–111.6), `110-browser-security.md`, `011.11`.

## Steps

1. **Backend.** Decide what the pages will talk to: a local or development backend, or mocks. Never a
   production backend with real personal data (111.4). With the Firebase layout (rule 107) the
   backend is the emulators: start them with skill `run-emulators`, which also starts the UI. If the
   flow needs a backend that is not available, check what you can with Storybook and say what was
   not checked.
2. **Start** the dev server (in `ui/` with the Firebase layout) in the background on a free port (for example `PORT=3100 <PKG> run dev`
   or `<PKG> run dev -p 3100`), note its PID, and wait until it answers. Do not touch a dev server
   another session started (014.5).
3. **Open** every changed page with the browser tool available in the session (in Claude Code the
   built-in browser; otherwise ask the developer to look). Check desktop width and a mobile width
   (375 px).
4. **Walk the flow** the task changed, including error and empty states you can trigger.
5. **Console:** no new errors or warnings. **Network:** the right endpoints and payloads; no personal
   data in URLs or in requests to third parties (110.3).
6. **Record** in the work log under "Checks": date, URL and width, what was seen, console and network
   findings, what could not be checked and why. Screenshots are not committed if they show personal
   data.
7. **Stop** your dev server by its PID (014.4).
