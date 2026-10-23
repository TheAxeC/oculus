# O39 part F, landing

Position: roadmap entry O39, oculus in its own repository; plan step O39 part F, the first HTML paints the start theme's ground under the dev server too, landed. Next on O39: the desktop look C8 after `npm run app:package`, then the tick. Next in the plan: /land O61, /land O56, /land O53.

## Open items

- none.

## The check of Steps 1

The agent listing named no part F agent: the builder ad81f9b1c597670ba, the brief check af556f98c3e4cc9ab and the reviewers add6b720b0361987f and a59a8e2d9a8cb5ab5 had all ended before the landing. The three agents it listed were the round reviewers of O61, O56 and O53, which have since ended too.

## NOT DONE

Nothing of the step. Not looked at: C8, the desktop window, which is O39's closing after `npm run app:package`.

## What landed, what was found

O39 part F landed on main from base d82cd0c3, the whole range (one wip commit 31b1aa87 of the builder's work and repair round 1), 12 files, +364 -125 with the fixes at landing (`git cherry-pick -n d82cd0c3..migration-O39-partF` in the gate worktree, then the same range on main, `git diff --cached --binary` of main and the gate equal under `cmp`). Built: the first HTML carries, ahead of the head Kit fills, a style element of its own (`oculus-ground`, `groundElement` in `src/hooks.server.ts`) that paints the root element's background in the start theme's `--bg` and holds the rule of the new sheet `src/lib/ui/theme/scrollbar.css` (ruling 261 (a)), which the layout also imports in place of its `:global(*)` rule; the page's first draw of its theme takes the element away (`applyTheme`); no element is sent for an app's theme whose block is withheld or a ground that is not a hex colour. Fixes at landing, from the review over round 1: the sheet's head comment says the text holds no closing style tag (it said a left angle bracket), names the status bar among the boxes that keep no bar (`StatusBar.svelte:396`), and is rewrapped at 100 columns; the round report's sentence on a failed first run removed. Found at the look and fixed at landing: the error page of an unmatched path keeps the element, since it draws no theme, in the same colours as its body; the sheet's head comment says so. G118's text, Code and Test lines name the ground element, `groundElement`, the sheet and the describe 'the ground a page is sent with'.

Review: `agents/reviews/O39-partF-refuter.md`, one repair round and a run over it; every finding closed. The builder's first report did not pass its bar (the repair round).

Verification in the gate, after the fixes: `npm run diagrams && npm run test:quick`: `12 changed file(s)`, `5 test file(s)`; ASCII gate, prettier, svelte-kit sync, vitest checks, vitest slow, vitest, eslint and svelte-check (537 files, 0 errors, 0 warnings) ok; `test:quick: 33.4 s; every command passed`; `npx vitest run tests/server/root/hooks-server.test.ts` 23 passed. Not covered: tests that reach no changed file within the import depth. The verify list was not changed. A/B: none, `bench: []`.

## The look

The look, on a scratch server on 8797 with a scratch HOME and a scratch hub from `tests/fixtures/hubs/demo` holding the approved app `ember`, every frame of a reload recorded by headless Chromium's screencast: C1, under `vite dev` with `theme: dark`, the first HTML holds `html { background: #0b1120 }` with the scrollbar rule before any link or script, no frame of 15 has a white sample point, and the element is gone after the draw; C2, Ember, `html { background: #7a1020 }`, the first frame after the reload rgb 123,16,32 at every sampled point; C1b, while only the ground's sheet is loaded the computed `scrollbar-color` is rgb 92,105,128 on 18,26,43, the dark theme's pair (headless Chromium draws no bar to see); C3, `theme: light`, `#f1f5f9`; C4, a dark start then `:theme` Light: body rgb 241,245,249, the element gone, 0 pixels of `#0b1120` in the window and after an overscroll; C5, `/?float=f1`, `/find`, `/present/show` and `/present/print` each sent `#0b1120`, no white frame, the element gone after the draw; the error page `/no-such-page` dark with no white frame; C3c, under the built server (`vite build`, `vite preview`), dark and Ember each draw their ground in every frame after the reload. The scratch servers were stopped (`lsof` on 8797 prints nothing). Not looked at: C8, the desktop window, which is O39's closing after `npm run app:package`.

## Agents

Agents: builder ad81f9b1c597670ba, claude-opus-5-5, 267220 tokens, 109 tool uses, 24 min 8 s, round 1 328461 tokens, 55 tool uses, 9 min 54 s; brief check af556f98c3e4cc9ab, claude-opus-5-5, 228914 tokens, 59 tool uses, 10 min 42 s; reviewer add6b720b0361987f, claude-opus-5-5, 243598 tokens, 57 tool uses, 24 min 10 s; reviewer over round 1 a59a8e2d9a8cb5ab5, claude-opus-5-5, 191148 tokens, 41 tool uses, 14 min 36 s.
