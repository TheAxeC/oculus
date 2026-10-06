# Q126, repair round 1

The review is `agents/reviews/Q126-refuter.md` (read it whole; line numbers are your worktree's). Every item below is inside the brief `agents/briefs/Q126.md`, whose rules still hold: guide headings are never renamed, no DESIGN.md line over 1500 characters outside Apps, the Apps section and `docs/apps.md` unchanged, a changed comment is its paragraph rewrapped whole at 100 columns, plain ASCII prose with no negation-contrast and no dash stand-in. A shortcut is a finding, and an item answered by a sentence in the report instead of a change in the file is sent back.

1. Spec 1: the fixed git choices (`DESIGN.md:137`, `docs/source-control.md:55`). Each reason is said once, in DESIGN.md; the guide keeps the behaviour (signing and the pull strategy come from the repository's git configuration, a commit uses `user.useConfigOnly`) without the "so" reason clauses, or DESIGN.md keeps only the reasons. No fact of `:55` restated.
2. Spec 2: the page leaf item (`DESIGN.md:237`) keeps its decision and reason and drops what `window.md:52` states.
3. Spec 3: the bracket keys' reason stays in DESIGN.md:523 alone; `window.md:68` keeps the behaviour without the reason.
4. Spec 4: `DESIGN.md:544` and `:562` hold no decision: remove each, or merge it into the item whose decision it belongs to with its reason stated, and name the result in the item table.
5. Spec 5: the guide says again that the deposit's snapshot push replaces the remote's `main` with a forced push, the one forced push in oculus, and `source-control.md:27`'s "none of them ever forces" stays true by naming that exception.
6. Spec 6: add table rows for base `:459` and base `:464`. For each fact they dropped, say where it lives now; a fact that lives nowhere and is true goes into its guide (the themes, the wallpaper and the icon or ASCII toggle; one rail button per page of `rail:`; every view in the Views catalogue). The "immediate tooltip" clause is false (`TooltipGroup.svelte` has `DELAY`) and is not restored.
7. Spec 7: fix the three cites: `DESIGN.md:523` names `HELP.md` "The keys" for the key table; `:558` names `docs/window.md` for `wrap_tabs` (or wherever the keys it names live, checked by grep); `:459` names the doc comment of `parse.ts`'s classifier by its function name, not "the head comment".
8. Standards 1: rewrap the comment paragraphs of `src/lib/server/root/socket.ts` and `src/lib/server/machine/pty/channel.ts` whole, filling each line to 100 columns.
9. Standards 2: rewrite the update tasks sentence of `DESIGN.md:533` so the flag is what is placed before the skill or the `--`.
10. Standards 3: restate `DESIGN.md:139`, `:490` and `:553` directly, with no "and not", "rather than" or "not X but Y".
11. Standards 4: `docs/files-and-search.md:47`: name which question is meant in each sentence and say what the folder wording is.
12. Standards 5: rewrite `DESIGN.md:445` so it parses.
13. Behaviour 1: `DESIGN.md:473` says what `saved.ts:9-15` does: an arrangement saved at version 4 or 3 takes the shipped floats once.
14. Behaviour 2: `DESIGN.md:147` says the credentials are under `calendar_dir` of `local.yml` (by default `~/.oculus/calendar`).
15. Behaviour 3: `DESIGN.md:490` agrees with Theming (`:245`) on what the capsule belongs to.
16. The report: correct case 1's result, the `auto_build` reason (Proof 2: `on_save` and "unless `never`" are the same rule; the sentence went as a repeat), and the count of cited names (17). Add a "Repair round 1" section to `agents/reviews/Q126-report.md` with a row per item above: the file and line, the text before and after, and the reruns.

Verify before you report, from `tools/oculus` in the worktree: `npm run diagrams`, then `npm run test:quick -- --base 60263c8d`; `npx vitest run tests/checks/source/history.test.ts`; the ASCII gate over `DESIGN.md docs/*.md`; `grep -nE "\S - \S" DESIGN.md docs/*.md` prints nothing; `awk 'length>1500' DESIGN.md` names only Apps lines; the headings `cmp` per guide against the base copy. Run no git command, no test:slow, no landing.mjs, no desktop test.
