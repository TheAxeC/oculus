# O129 landing

Roadmap entry: the cockpit-to-oculus migration. Step O129, the Status view's line count removed whole. Next: O130, every hub's category rows held to the config check (ruling 645), then O131, the editor holds a one-text `multi` value to its words (ruling 646).

## Open items

- None. Axel ruled 645 (a), step O130, and 646 (a), step O131; (b), no change, was the lazy option in both.

## Steps 1

The runner's agent listing showed none of O129's agents running: the builder a2610b093b6cffbd3, the brief check ab2ec14cae7da1de4 and the reviewers a9c8c428e5b66ae90 and a00fab92642def271 had each sent their completion notice.

## Not done

Nothing in the brief is left undone. The gate's two full runs were each red on one timeout in a file the step does not change (Verification below); no full run was green on every command.

## What landed

The whole range from base 81a913408 (the builder's work, repair round 1, wip commit 3e5ff9e7d), 34 paths, 88 insertions and 1298 deletions. The Status view's Lines of code section is gone with its store, its route, its server count, its model types and its words; `cloc` left `package.json` and the lock, and `docs/licenses/GPL-2.0.txt` and cloc's row of `docs/third-party.md` are gone, so oculus ships no GPL code; the start check names three optional programs (git, tmux, the Claude CLI) and no `perl`; `trackedFiles`, `app.thousands_separator` and `grouped` are removed with every sentence naming them; ten diagram files are regenerated. The merge with O128 in `docs/HELP.md` was automatic.

## Verification

- Gate, `npm run diagrams && npm run docs:palette && npm run test:quick`, first run: ok prettier, ASCII gate, svelte-kit sync, eslint, svelte-check ("582 FILES 0 ERRORS 0 WARNINGS"), vitest checks, vitest; FAILED vitest slow, a 40 s timeout in `tests/server/machine/apps/tools/languages.test.ts` ('join their answers the way VS Code joins them'). Alone: "Tests 15 passed (15)".
- Second run: ok prettier, ASCII gate, svelte-kit sync, eslint, svelte-check, vitest checks, vitest slow; FAILED vitest, a 5000 ms timeout in `tests/server/machine/runs/schedules/commands.test.ts` ('reads a hand change of the commands file into the payload'). Alone, three runs: "Tests 3 passed (3)" each, its tests 105-114 ms. The machine's load average stood near 9 (`uptime`: 6.30 9.30 8.88).
- The diagrams and the palette page unchanged by the gate's run; the staged diffs of main and the gate equal under `cmp`, 34 paths.
- The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

- `agents/reviews/O129-report.md`: the cited lines of `format.ts` moved to the file after the round (review over round 1).
- `src/lib/state/shared/words/format.ts:3-4`: the clause "and is tested directly" dropped; no test imports the file (`grep -rln "words/format" tests` prints only the layer table row `tests/checks/tree/layer-rows.ts`). It was false since before the step (review over round 1).
- `agents/guarded.md` G73: the optional programs read git, tmux and the Claude CLI.
- Decision 3: `lines` removed once from the instance's `folded` list in `~/.oculus/views.json`, read back as `['hooks']`.

## The look

A scratch server on 8797 from the gate, scratch HOME with a copy of the hub's `.oculus` without `local.yml`. The Status view shows no Lines of code section; the hooks block's top is 16 px below the git line (714 to 730, `margin-top: 16px`), and the Gallery's top 16 px below the hooks block (1166 to 1182); no console error on a reload. The server is stopped.

## Usage

Builder a2610b093b6cffbd3: first run 242247 tokens, 176 tool uses, 14 min 16 s; round 1 260867 tokens, 34 tool uses, 2 min 44 s. Brief check ab2ec14cae7da1de4: 216711 tokens, 103 tool uses, 11 min 11 s. Reviewer a9c8c428e5b66ae90: 209753 tokens, 64 tool uses, 11 min 26 s. Reviewer over round 1 a00fab92642def271: 159544 tokens, 28 tool uses, 5 min 42 s. All claude-opus-5-5. The first report did not pass its bar: one repair round.

## Next

/spec O130 and /spec O131.
