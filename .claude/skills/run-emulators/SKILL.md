---
name: run-emulators
description: Run this Firebase project locally on the Firebase emulators — check Node and Java, build the functions, start the emulators with the demo project, seed synthetic data, start the UI against them, check the endpoints, stop everything by PID. Use when asked to run, start or debug the project locally, before a browser check of a flow that needs the backend, or when integration tests need running emulators.
---

# Run the project on the emulators

Rules: `107-firebase-emulators.md`, `111-testing.md` (111.4, 111.6, 111.7), `014` (parallel
sessions).

## Steps

1. **Check the environment:** `node -v` matches `engines.node` of `functions/package.json`;
   `java -version` is the one `firebase-tools` needs (107.12); dependencies are installed in the
   root, `functions/` and `ui/`. Never pass a production project id: the project is `demo-<slug>`
   (`EMULATOR_PROJECT` in `agent-rules/project.sh`, 107.5).
2. **Ports:** check the emulator ports from `firebase.json` and the UI port are free
   (`lsof -iTCP:<port> -sTCP:LISTEN`). Taken ports belong to another session: do not stop them;
   ask, or use a copy of `firebase.json` with other ports passed with `--config` (107.12).
3. **Tests only:** `<PKG> test` at the root builds the functions and runs the suite inside
   `firebase emulators:exec`; the emulators stop when it ends. Nothing else to clean up.
4. **Interactive run:** start `<PKG> run dev` at the root in the background (it builds the
   functions, then runs `tsc --watch`, the emulators and `next dev`), note its PID, and wait for
   "All emulators ready" and the Next.js "Ready" line. Then `<PKG> run seed` for the synthetic data
   (107.8).
5. **Check the backend:** `curl http://127.0.0.1:5001/demo-<slug>/<region>/api/public/<route>`
   answers with data; the Emulator UI (port 4000) shows the collections and users. After changing
   functions code, wait for the `tsc --watch` rebuild and the emulator's reload line before testing
   again (107.7).
6. **Check the UI** with skill `verify-in-browser`, against this local backend.
7. **Stop** by PID: the process group of `<PKG> run dev` (`kill -TERM -- -<pgid>` or its child
   processes, then the PID), and check the ports are free again. Do not stop processes another
   session started (014.4, 014.5).
8. **Record** in the work log: commands, ports, what was checked, anything that did not start and
   its log (`firebase-debug.log`, `firestore-debug.log`).
