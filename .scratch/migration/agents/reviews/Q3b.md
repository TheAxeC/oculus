# Review of Q3b (codex:gpt-5.6-sol, read-only, 2026-09-12)

The reviewer's report over the first diff, verbatim.

1. Acceptance items not met

- Item 1 is not connected to the initial page load. `vocabCatalog()` omits `terminal` from `VOCAB_KEYS`, while the page initializes appearance solely from that catalog: `src/lib/data/sources/config.ts:275-285`, `src/routes/+page.server.ts:30`, `src/routes/+page.ts:21`.
- The required `npm test` check cannot pass. The exact key assertion still expects `appearance.yml` to contain only `themes`, `wallpaper`, and `crt`, but the file now adds `terminal`: `tests/config.test.ts:224`, `tests/config.test.ts:308-311`, `config/appearance.yml:37-38`.
- The fallback constant's comment does not say that 12.5 is the numeric value of `--fs-md`, as required by the brief: `src/lib/state/appearance.ts:41-42`, `.scratch/migration/agents/briefs/Q3b.md:29`.

2. Spec rules broken

- No hardcoded config value: `DEFAULT_TERMINAL_FONT_PX` duplicates the configured default and is used as a code fallback: `src/lib/state/appearance.ts:41-42`, `src/lib/state/appearance.ts:109-112`, `config/appearance.yml:37-38`.
- One line per YAML paragraph: the new terminal explanation is hard-wrapped across two comment lines: `config/appearance.yml:35-36`, `.scratch/migration/agents/spec.md:46`.

3. Tests missing for named behaviour

- Initial landing must carry `terminal.font_px` through `vocabCatalog()` into `setAppearance()`. The existing first-load contract instead codifies a nine-key catalog without `terminal`; update this test to assert the nested value: `tests/state/tones.test.ts:139-153`.
- No automated test verifies that xterm receives the configured size or the computed `--fs-md` fallback. This belongs in a browser terminal test; the server-rendered view test explicitly stops at the mount point: `src/lib/views/sessions/Terminal.svelte:129-135`, `src/lib/views/sessions/Terminal.svelte:179-186`, `tests/views/sessions.test.ts:635-637`.

4. Defects shown by concrete input

- Input: set `terminal.font_px: 20` and load the page. `vocabCatalog()` drops `terminal`, so `terminalFontPx()` is null and the grid receives the body token instead of 20: `src/lib/data/sources/config.ts:275-285`, `src/routes/+page.ts:21`, `src/lib/views/sessions/Terminal.svelte:131-135`.
- Input: omit `terminal.font_px`, mount under the default theme, then switch to a rice theme. The page token changes from 12.5 px to 11.5 px, but the theme effect updates only the palette and never updates `grid.options.fontSize` or refits it: `src/lib/themes/tokens.css:71`, `src/lib/themes/themes.css:608-624`, `src/lib/views/sessions/Terminal.svelte:179-186`, `src/lib/views/sessions/Terminal.svelte:229-240`.

5. Anything else worth attention

- The brief directly conflicts with the standing rule: it requires the 12.5 fallback in `appearance.ts`, while the spec forbids hardcoded fallbacks for configured values: `.scratch/migration/agents/briefs/Q3b.md:29`, `.scratch/migration/agents/spec.md:44`.
- The `appearance.ts` head comment still describes only themes, wallpaper, and CRT despite the new terminal setting: `src/lib/state/appearance.ts:1-6`.