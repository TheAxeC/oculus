# Rulings added to O138 (round 0)

Axel ruled two open items after the brief was written. Each item below is a ruling that adds to the brief: the rest of the brief is unchanged, and the final report carries these items.

1. Ruling 664 (a). In item 1 of "What to build" both rows also carry `live_subtasks: true`, aligned as the rows around them are:

   ```
   interview: { color: "#7c3aed", closes_deadline: true, deadline_met: true, live_subtasks: true }
   offered: { color: "#0d9488", closes_deadline: true, deadline_met: true, live_subtasks: true }
   ```

   C8 then reads: an applications entry at `interview` or `offered` with a follow-up note and a subtask keeps both on the radar (`ticker.ts:461-466`, `:522-527`, `statusFlag(..., 'live_subtasks')`), while the entry's own deadline line still leaves it; an `applied` entry's leave it, as on the base. The case-run program prints both for the three statuses.
2. Ruling 663 (a). The Education template's `status` options (`docs/templates.md:1505`) read `[ongoing, planned, completed]`, and its commented entry's comment (:1538) reads `# required: ongoing, planned or completed`; the Tasks template's options (:1600) read `[doing, todo, done, dropped]`, and its comment (:1612) reads `# required: doing, todo, done or dropped`, each in the column it has now. The paths this step writes gain `docs/templates.md` lines 1505, 1538, 1600 and 1612. C7 gains: the Education and Tasks templates written by Make Folder a Hub hold those orders.
3. The research hub's own `education.yml`, `tasks.yml` and `applications.yml` are the orchestrator's at landing, not yours.
