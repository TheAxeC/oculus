# E4 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration), step E4 "the apps built", landed. Next: E4g, O30b, Q123, Q124, D23 and X3e prepared and built, six at once (Z632).

## Open items

None.

## The check of Steps 1

`ListAgents` listed no agent of E4 running before the cherry-pick.

## Not done

- The wallpaper over an app's frame was not looked at: turning the wallpaper on writes `appearance.yml`, and a look leaves no write.
- A penpal message from the Document view's frame and from a second browser tab was not sent. A second tab holds no reference to the app's frame, so it has no window to send to.
- P2, the Confirm's detail measured as drawn (`scrollWidth` against `clientWidth`): the look saw the whole address wrapped inside the box, but did not measure it.
- P3, a press from one frame into another: a press the browser tool sends into an app's sandboxed frame does not land where it is aimed, so the look drove the bridge from the app's own script instead.

## What landed

Apps added while oculus runs, from base b811d87d5 (145 files, 11795 insertions, 2462 deletions):

- machine apps under `~/.oculus/apps/` and root apps under `<root>/.oculus/apps/`, each offered in the catalogue's Apps group;
- each app drawn in a sandboxed frame on penpal 8.0.1, only after approval of the hash of its files;
- the approval panel in plain sentences, Keep approved while I edit for a machine app, and Revoke;
- the channels a manifest lists, `getState` and `setState`, and the store under `app-data/` with its GET route;
- the `app-store` write kind, recorded in the change log with both sizes and undone from History;
- `open` of a view, a project, a file of a root (closed paths and dot paths refused) or an address behind a Confirm;
- the write gate on the app and kind headers;
- findings for a bad manifest;
- the Settings view's Apps heading with nine keys.

## Fixes at landing

1. 22 cherry-pick conflicts with O30, A3 and D44 resolved, both sides kept.
2. The block `describe('the shipped files')` removed from `settings.test.ts` (Z605).
3. B1: the Confirm's detail wraps a long address (`overflow-wrap: anywhere`).
4. B2: an app's Confirm opens with the keyboard on Cancel (Z603).
5. B3: `color-scheme: light` on the base body, and `light dark` on an app's root from `oculus.js` (Z604).
6. B4: `FrameLayer.svelte`'s frame loop raises `focusin` on the slot of a frame that newly holds the focus.
7. B5: the second apps effect registers the rows the page holds after the seed.
8. S1: the dropped inputs of 14 cases restored to the manifest, app-files, app-open, app-gate, methods and app-store tables (Z602).
9. S2: `guarded.md` names E4's tests under G1, G8, G9, G31, G49 and G50, and E4.md's app-store title follows Z601.
10. S3: DESIGN.md and HELP.md state the Cancel focus and the wrap, and DESIGN.md names functions where it gave line numbers.
11. The `themes.css` head comment rewrapped within 100 columns.
12. penpal and the Electron binary installed in main's `node_modules`.

## Verification

Run in `.agents/worktrees/gate-E4` at main with the range and the fixes:

- `npm run diagrams` exited 0.
- `npm run test:landing`:
  - ok ASCII gate (1.3 s)
  - ok format:check (25.7 s)
  - ok lint (33.8 s)
  - ok test:checks (101.0 s)
  - ok npm test (113.9 s)
  - ok check, then build, then test:slow (252.6 s)
  - "test:landing: 252.6 s; every command passed"
- Main's staged diff is `cmp`-equal to the gate's (145 paths).

P1, the C101 run before B3's fix (`c101z.out`) is quoted whole in the booking. `appSeesDark` reads `true` on every line, under the light themes too. After B3, the look found:

- the app's root `color-scheme` reads `light dark`;
- its native controls are drawn dark under vscode dark modern and light under vscode light modern.

No A/B was run, since the block's `bench:` is empty.

## The look

The look ran on TEST at localhost:8790, on Axel's dev server after his restart (Z631), in the dark theme with one switch to light and back.

The scratch apps:

- a machine app `zz-look-e4` that reads portfolio and config;
- a machine app `zz-look-e4-bad` that reads processes;
- a root app `zz-look-e4-root` under a throwaway root `~/workspace/zz-look-e4`, added through `workspaces.json`.

What was seen:

- The Apps rail button.
- The catalogue's Apps group: both apps, each with a lock, and the root app's title carrying its root key.
- The machine app's approval panel: what it reads and writes, no outside address, and its store path.
- The root app's approval panel: it reads and writes nothing in oculus and reaches no outside address. It keeps its data in `<root>/.oculus/app-data/zz-look-e4-root.json`, "a file of the root that git tracks unless the root ignores .oculus/app-data/". It offers Approve with no Keep approved, as DESIGN.md says for a root app.
- Approve, with the frame in dark (`color-scheme` "light dark", dark controls) and in light (light controls).
- An edit revokes the approval and shows "This app changed since you approved it". The lock in the tab bar revokes too.
- Keep approved while I edit:
  - an edit of `app.js` reloads the frame, with a pencil on the tab;
  - an edit of `app.yml` still shows the panel with the warning.
- The app's folder moved out: the tab reads "Unknown view: app:zz-look-e4" with an empty body. Put back, the tab returns to the app's panel.
- `setStore`:
  - it resolves with the `onStore` push and a History row "app store, 0 bytes to 17 bytes";
  - its Undo answers "app:zz-look-e4 / store is back." with a new row from 17 to 4 bytes.
- Refusals:
  - `open` of `.env` refused `closed`;
  - `read processes` refused `not_declared`;
  - each with its page notice.
- The address Confirm shows the whole address wrapped, with the keyboard on Cancel. Cancel answered `declined`.
- The bad app's finding in Findings: "reads names processes, which is closed to every app...".
- Mod+K sent from the focused frame opens the palette, and Escape closes it.
- `/apps/-/penpal.js` and `/apps/-/oculus.js` answer 200.
- A forged penpal CALL to `setStore` from the page's own window ran nothing: the store stayed `null` and the change log gained no line.
- Opening the root app's `index.html`:
  - from Files (with Show Hidden Files on), from its bookmark and from the rail's Bookmarks menu, each opens a source tab with the page's text and no frame;
  - Open in Browser is answered `text/plain` with `nosniff`.
- The Settings view's Apps heading follows Calendar and mail, with nine entries: Connect timeout s, State max kb, Store max kb, Writes per min, Opens per min, Keys per s, Max files, Max mb and Closed paths.

What the look found outside E4's brief:

- History fetches its rows once and does not refetch after a write, so a new row shows only after a reload. This holds for every write kind, not only E4's.

Restored after the look, each checked with `shasum` against the copy made before it:

- `approvals.json` fd703e6f;
- `workspaces.json` 1bf5d57a;
- `bookmarks.yml` 96af1b35.

Cleanup:

- `ls -d` finds no `~/.oculus/apps`, `~/.oculus/app-data`, `~/workspace/zz-look-e4` or `~/.oculus/schedules.yml`.
- `git diff --quiet -- tools/oculus/config/sources.yml` is clean.
- `~/.oculus/changes.jsonl` keeps the look's app-store and bookmark lines, since no line of it is ever removed.

## Agents

- Builder a5159c4c5c1976000 (claude-sonnet-5-5):
  - first run: 341,893 tokens, 466 tool uses, 114.9 min;
  - round 1: 133,019 tokens, 281 tool uses, 68.6 min;
  - round 2: 118,930 tokens, 107 tool uses, 28.6 min.
- Brief check aeb43ede13fd69892 (claude-opus-5-5): 315,721 tokens, 114 tool uses, 17.3 min.
- Its findings were closed in the brief by ae0e68f75ea2cd5a2 (claude-opus-5-5): 335,301 tokens, 81 tool uses, 18.7 min, plus 344,740 tokens, 7 tool uses, 1.2 min.
- Reviewers, all claude-opus-5-5:
  - a4f365f02f4be4d29: 291,670 tokens, 164 tool uses, 25.1 min;
  - over round 1, a18a7261ae0aad603: 116,643 tokens, 134 tool uses, 22.0 min;
  - over round 2, ada0676ed07f8b726: 336,913 tokens, 107 tool uses, 18.9 min.

The first report did not pass its bar. It took two repair rounds, the second the plan's extra round for Z599. The fixes at landing are listed above.
