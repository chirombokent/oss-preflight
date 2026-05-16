# Official Bob Session Exports

This folder is the single judge-facing export location for Bob task-session
evidence. Summarize exports once in `bob_sessions/build-report.md`.

For every relevant Bob task session, add a subfolder:

```text
S<id>-<slug>/
  task-history.md
  consumption-summary.png
```

Export path in Bob IDE:

1. Views and More Actions -> History.
2. Select the relevant project task.
3. Select the task header.
4. Screenshot the task-session consumption summary.
5. Select Export task history and save the markdown file.
6. Update `bob_sessions/build-report.md` with the session row.
