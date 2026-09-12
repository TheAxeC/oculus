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
## The reviewer again, after the repair round (2026-09-12)

1. Acceptance items not met

- Item 1 does not apply a changed `terminal.font_px` to an already mounted grid. `setAppearance()` updates a non-reactive module variable, while the terminal effect reruns only for reactive `theme()` or `id` changes: `src/lib/state/appearance.ts:45`, `src/lib/state/appearance.ts:107-112`, `src/lib/views/sessions/Terminal.svelte:238-255`.

2. Spec rules broken

- none.

3. Tests missing for named behaviour

- Configured size, computed `--fs-md` fallback, and refitting remain untested in a browser. The existing sessions test explicitly stops before xterm initialization. This needs a browser-level terminal test beside the sessions view tests: `tests/views/sessions.test.ts:635-637`, `src/lib/views/sessions/Terminal.svelte:181-194`, `src/lib/views/sessions/Terminal.svelte:245-253`.
- A live `terminal.font_px` config change on an already mounted grid is untested. This belongs in the same browser-level terminal test: `src/lib/state/socket.svelte.ts:181-190`, `src/lib/views/sessions/Terminal.svelte:238-255`.
- Output arriving while the repeated capture is pending is untested. Add a deferred-capture case beside the repeated-subscription test: `tests/server/pty/channel.test.ts:162-181`, `src/lib/server/pty/channel.ts:401-419`.

4. Defects shown by concrete input

- Input: mount with `terminal.font_px: 12.5`, then deliver a config message changing it to `20` without changing the selected theme or terminal. `setAppearance()` stores `20`, but no reactive dependency reruns the terminal effect, so the grid remains at 12.5 px: `src/lib/state/socket.svelte.ts:181-190`, `src/lib/state/appearance.ts:45`, `src/lib/state/appearance.ts:112`, `src/lib/views/sessions/Terminal.svelte:238-255`.
- Input: repeat the subscription, hold the `capture-pane` result, deliver live bytes, then resolve the capture with the earlier screen. The live chunk is published before the direct version-0 send; the client then resets the grid on version 0 and removes the live chunk: `src/lib/server/pty/channel.ts:401-419`, `src/lib/server/pty/channel.ts:425-427`, `src/lib/state/terminals.svelte.ts:279-287`, `src/lib/views/sessions/Terminal.svelte:200-204`.

5. Anything else worth the orchestrator's attention

- First review acceptance point 1, initial-load catalog omission: met by adding `terminal` to the catalog and asserting its value: `src/lib/data/sources/config.ts:275-297`, `tests/state/tones.test.ts:142-155`.
- First review acceptance point 2, exact config-key assertion: met: `tests/config.test.ts:221-224`, `tests/config.test.ts:304-311`.
- First review acceptance point 3, fallback constant comment: resolved by removing the code fallback; the value now lives only in config: `src/lib/state/appearance.ts:65-68`, `config/appearance.yml:35-37`.
- First review spec point, hardcoded code fallback: met by returning null for an absent or invalid key: `src/lib/state/appearance.ts:65-68`.
- First review spec point, hard-wrapped YAML explanation: met: `config/appearance.yml:35`.
- First review missing initial-load test: met: `tests/state/tones.test.ts:142-155`.
- First review missing browser test: not met: `tests/views/sessions.test.ts:635-637`.
- First review concrete input `terminal.font_px: 20` at initial load: met: `src/lib/data/sources/config.ts:282-296`, `src/lib/views/sessions/Terminal.svelte:181-188`.
- First review theme-switch fallback defect: met by recomputing the token, updating xterm, refitting, and resizing: `src/lib/views/sessions/Terminal.svelte:245-253`.
- First review brief/spec conflict remains: the brief says the default belongs in `appearance.ts`, while the spec forbids a hardcoded fallback and the implementation places it in YAML: `.scratch/migration/agents/briefs/Q3b.md:29`, `.scratch/migration/agents/spec.md:44`, `config/appearance.yml:35-37`.
- First review head-comment point: met: `src/lib/state/appearance.ts:1-6`.
- The `appearance.yml` file header still lists themes, wallpaper, and CRT but omits its terminal setting: `config/appearance.yml:3-4`, `config/appearance.yml:34-37`.