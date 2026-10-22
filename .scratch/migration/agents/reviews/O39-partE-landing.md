# O39 part E, landing

Position: roadmap entry O39, oculus in its own repository; plan step O39 part E, the page's first HTML carries the theme it starts on. Next on O39: the first paint under the dev server (booked under O39 in `plan.md`), then the desktop look C8 after `npm run app:package` and the tick. Next in the plan: /land O54, /land O65.

## Open items

- Open item 259 (2026-10-22, O65): Pin Editor and Unpin Editor show the chord Cmd+K Shift+Enter in the palette, but no key runs it, on main or in O65; with Cmd+K now the editor's chord key (ruling 258 (b)), the hint names a key that does nothing. Options: (a) bind Cmd+K Shift+Enter in the editor to pin and unpin the tab, as VS Code does, in O65's repair round; (b) keep the hint as it is, naming a key that does nothing; (c) drop the hint, the lazy option. Recommendation: (a), since the palette then tells the truth and the key behaves as in VS Code.

## Agents stopped

The builder ae778f34fa099ded2 and the reviewers a6d705f9b51150ea3 and aa1b7392be4f5e72b had all ended before the landing; the agent listing named none of them.

## NOT DONE

- The first paint under the dev server: under `vite dev` a reload's first frame is white for every theme. Found at this look, not covered by part E's brief, folded into O39 (Z468) and booked under O39 in `plan.md`.
- C8, the desktop look after `npm run app:package`: O39's closing.

## What landed

Part E on main from base 200f12da, the whole range (wip commit 0617874b: the builder's work, the round-0 cases ruling and repair round 1), 29 files, +1333 -492 with the fixes at landing. The first HTML (`src/app.html`, filled by `pageTheme` in `src/hooks.server.ts`) carries the start theme's body class, its derived tokens as the root element's style and, for an app's colour theme, the converted block in the style element the page's first draw replaces. The host marks its session's user agent; the find page draws its theme by the same mark as the audience and print pages. Guarded entries G11 and G118 updated in `agents/guarded.md`.

## Fixes at landing

The findings of the review over round 1:

- R1-T1: the head comment of `src/lib/shell/window/appearance.svelte.ts` rewrapped under 100 columns.
- R1-T2: the comment in `src/lib/views/system/findings/Findings.svelte` made true: the token is derived for every theme and the first HTML carries it.
- R1-T3: `lookShape` (`src/lib/state/shared/words/appearance.ts`) reads `text_size` (through `boundedTextSize`), `rice` and `crt` as `z.unknown().optional()`.
- R1-P2: `withThemeBlock` in `src/lib/ui/theme/theme.ts` joins the theme sheets and an app theme's block in one place, used by `paintLoad`, `pageTheme` and the hook test's `pageTokens`.
- R1-T4: the row 'reads it once for a page...' tagged slow.
- R1-B1: `deriveTokens` (`src/lib/themes/derive.ts`) sets every `--seti-*` token for every theme, so a later draw replaces each one an earlier draw or the first HTML set.
- R1-P1: the new hook row's failing run on the unchanged tree cannot be run, since its imports do not exist at the base (`git show 200f12da:src/app.html` has no root style; `theme.ts` exports no `derivedTokens`).

## Verification

Only the tests related to the changed files, by Axel's standing demand, in the gate worktree: `npm run diagrams && npm run test:quick`, exit 0.

```
ok      prettier (3.5 s): All matched files use Prettier code style!
ok      ASCII gate (4.1 s)
ok      svelte-kit sync (18.5 s)
ok      vitest slow (41.3 s)
ok      vitest (46.1 s)
ok      vitest checks (52.4 s)
ok      eslint (58.4 s)
ok      svelte-check (58.5 s): 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 77.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

The build ran for the look: `vite build` in the gate, exit 0. Main: `git cherry-pick -n 200f12da..0617874b`, the diagram conflict resolved to main's head and regenerated, the gate's 29 files copied; `cmp` of `git diff --cached --binary` on main and in the gate printed SAME (29 files changed, 1333 insertions, 492 deletions). A/B: none, `bench: []`.

## The look

C9, on a scratch server with a scratch HOME and a scratch hub from `tests/fixtures/hubs/demo` holding the approved app `ember` (Ember, `sideBar.background` `#7a1020`). Every frame of a reload was recorded by headless Chromium's screencast; Chrome on the desktop was behind another window, so a screen recording held no page.

- Built server (`vite build`, then `vite preview`, the server the packaged app runs): `theme: dark` and Ember each draw their own ground in the first frame after the reload (rgb 11,17,33 and 123,16,32), no light frame. C9 met.
- Dev server (`vite dev`): the first frame after the reload is white (rgb 255,255,255 at every sampled point) for `theme: dark` and for Ember, then the theme's ground. A static control page dark from its first byte, reloaded the same way, shows no white frame. Cause: the dev server's first HTML carries the class, the root style and the block but no stylesheet, so nothing paints the ground until the scripts load the CSS. Folded into O39.

The scratch servers were stopped after the look (`lsof` on 8797 and 4173 prints nothing).

## Agents

- Builder ae778f34fa099ded2, claude-opus-5-5: round-0 hand-back 252,026 tokens, 50 tool uses, 14 min 3 s; build after the cases ruling 350,578 tokens, 66 tool uses, 17 min 14 s; round 1 259,868 tokens, 140 tool uses, 34 min 37 s.
- Brief check aece82159cd53f676, claude-opus-5-5: 221,577 tokens, 71 tool uses, 10 min 19 s.
- Reviewer a6d705f9b51150ea3, claude-opus-5-5: 272,567 tokens, 67 tool uses, 17 min 28 s.
- Reviewer over round 1 aa1b7392be4f5e72b, claude-opus-5-5: 264,783 tokens, 62 tool uses, 28 min 0 s.

The first report did not pass its bar: a cases ruling, one repair round and six fixes at landing.

## Next

/land O54, then /land O65; then /spec O61, O53 and O56; on O39, the first paint under the dev server, then C8 and the tick.
