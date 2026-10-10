# D55 landing

Position: oculus migration plan, step D55 (roots as hubs) landed; next: D58 (the engine's guides on every hub, added by Z766), then Q72 (the architecture re-read).

## Open items

None.

## Check before landing

`ListAgents` before the cherry-pick listed none of D55's agents (only the peer session research-hub-92); D55's builder aba524e6dd605ba38, its reviewer a1856be287746a96e and its reviewer over round 1 aa068552ee5aa1c92 had ended.

## Not done

Nothing inside D55's brief and the rulings on it. The look did not cover the dark theme, a tab's not-found state (19d) or the Audit view.

## What landed

Roots as hubs, from base ecbc37a0c (175 paths, +5906 -2358 against main). A `roots:` entry marked `hub: true` is a hub of its own: the portfolio is built per hub with that hub's own settings and merged, each record of a hub other than the first carrying `root`, with its id and the references to it prefixed by the hub's key. A write goes to the file of the record's own hub; a manifest field that names a registry or the projects is written without the key; a form offers the records of the edited record's own hub alone. Each card, page and palette row of a second hub carries the hub's chip or hint. Each hub's `secrets` folder is private to the relay, the file views, search and the name listing, in whatever letter case the file system folds. A registry view reads each card's entry, schema and file from the hub that holds it. A write of a collection entry carries a list of maps, so the undo of a deleted entry puts its `subtasks` back. HELP.md, DESIGN.md, `docs/DATA-MAP.md` and `docs/apps.md` describe the second hub.

## What was found

The review over repair round 1 found: a manifest write of a second-hub project kept the hub key on the records it names, and the form offered every hub's records; the page named the first hub's file for a second-hub entry write; a second hub's registry card had no entry, so no deadline in place and no Edit in File; two letter-case tests failed on a file system that does not fold case; `docs/apps.md` did not give the second hub's ids and `root`; a copy of the real hub's folders sat under `$TMPDIR/d55basetree`. Its two points declined to judge, `root?` on the `feed-field` and `feed-delete` writes and `Person.file` on the portfolio channel, were closed as Z767.

The look found a second hub's `related:` ids resolving to the first hub's projects, palette rows of both hubs alike, and `lab:method` and `lab:stream-bench` drawn on a second-hub card.

Fixes at landing: 9, the six findings and the three defects of the look, plus the two red lines of the first run on main named under Verification, each in `agents/reviews/D55-refuter.md`, Closed (at landing). The cherry-pick conflicted with D49 in HELP.md, DESIGN.md, `docs/DATA-MAP.md`, `docs/apps.md` and the three guides D49 removed; D55's sentences are carried into the files D49 kept.

## Verification

On main, `npm run test:landing` from `tools/oculus`:

```
ok      ASCII gate (1.3 s)
ok      npm run lint (14.0 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run format:check (22.0 s): All matched files use Prettier code style!
ok      npm test (177.0 s)
ok      npm run check, then npm run build, then npm run test:slow (319.3 s)
ok      npm run test:checks (371.5 s)
test:landing: 371.5 s; every command passed
```

The hub tests (`tests/routes/hubs`, `tests/data/hubs`, `tests/state/client/held-unsaved.test.ts`): 5 files, 51 tests passed. The first run on main failed two checks of `test:checks` on the landing's own fixes: `boundaries.test.ts` ("holds no process-wide state under src", a hub-key list held in `tones.ts`) and `comment-width.test.ts` (`hub-names.ts:40`); the domain lookup now holds no state and the comment is rewrapped, and the run above is after both.

## The look

On a scratch oculus from the gate (port 8796), a copy of `demo/` as the first hub and a second copy as the hub `lab`, holding a venue, a person and a task of its own. The `lab` venue draws its deadline in place, and Edit in File opens `lab/registries/venues.yml`. The `lab` project's editor offers four people, Lab Only Person among them; the first hub's offers three. The `lab` project card shows the `lab` chip, "Methods frontier", `stream-bench` and its own Disseminated in, and the first hub's project lists one talk. Palette rows of the second hub carry `lab`. The person page of the `lab` Ana Rivera has the chip, and its source control opens `lab/registries/people.yml`. The Tasks view draws the `lab` chips with the tooltip "This record is from the hub served as lab". Not looked at: the dark theme, 19d and the Audit view.

## Agents

Builder aba524e6dd605ba38 (claude-sonnet-5-5) 347,362 tokens, 962 tool uses, 166.1 min, round 1 256,919 tokens, 252 tool uses, 61.9 min; brief check a1d9331ec3d46e873 (claude-opus-5-5) 226,582 tokens, 90 tool uses, 10.7 min; reviewer a1856be287746a96e (claude-opus-5-5) 196,464 tokens, 159 tool uses, 35.7 min; reviewer over round 1 aa068552ee5aa1c92 (claude-opus-5-5) 91,605 tokens, 149 tool uses, 23.9 min. The first report did not pass its bar (one repair round). No A/B (no `bench:`).

## Next

/spec D58, then Q72.
