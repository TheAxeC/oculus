# O85 landing

Roadmap entry: the oculus migration plan (`.scratch/migration/`). Step O85, a hub's own settings set in Settings for any hub, landed 2026-10-26. Next: /spec O84; O86's and O89's reports and reviews.

## Open items

- 462: moving `self: axel-faes` out of `.oculus/workspaces/research-hub.yml:16` before O84 lands; (a) a one-off run of O84's own `self` write at its landing and a hub commit, (b) the line removed and "this is me" pressed, (c) left as it is (the lazy option). Recommendation (a).
- 461: which headings O88 draws with `GroupHead`; (a) the card groups too, (b) every heading, each folding, (c) as listed (the lazy option). Recommendation (b).

## Check of the agents

`ListAgents` at the landing listed two subagents running, O89's builder a6462cf6ae75f9bfa and O86's builder a932a66494c50d411; none of O85's builder (a3a4085fe48cb342d) or reviewers (a0e17faa413580c97, ae28be89d8e8cf281).

## NOT DONE

Nothing of the step.

## What landed

The whole range from base 8d52965c (one wip commit 54e24f24f of the builder's work), 61 paths, 2450 insertions and 430 deletions:

- In a workspace of two hubs, a Settings row of one of the 37 keys each hub's own `.oculus/config.yml` is read for draws a Hub select, the primary first and chosen, shows the chosen hub's value and line, and writes that hub's file. The 12 keys read from the primary alone keep writing the primary with no choice.
- The write bodies take an optional `root`; `GET /api/hub-settings?hub=<name>` answers a hub's slice; the undo of a write to another hub takes it back in that hub's file.
- While the chosen hub's settings are being read or could not be read, the row draws that sentence alone; when the chosen hub's file does not parse, the row draws the file's sentence and its controls send nothing.

## Checks

In the gate worktree at main's head 3e07588ae, after `git cherry-pick -n 8d52965c..migration-O85` (conflicts only in the generated `docs/diagrams/*`, taken from main and regenerated):

```
$ npm run diagrams && npm run test:quick
ok      ASCII gate (2.1 s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (33.2 s)
ok      eslint (171.0 s)
ok      svelte-check (184.6 s): 1793037799731 COMPLETED 546 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (228.4 s)
ok      vitest (250.2 s)
ok      vitest slow (273.8 s)
test:quick: 307.2 s; every command passed
```

The gate ran while O86's and O89's builders were at work, without the `ps` check of the state file's rule that a gate starts only when no other worktree runs tests; it passed with no time-out. On main the gate's staged diff was applied with `git apply --index`, the `docs/data-map.md` lines staged alone so the uncommitted section on the primary hub stays out of the commit; every one of the 61 staged paths is equal under `cmp` to the gate's file.

## The look

On a scratch server on port 8797 started from the gate, over a two-hub scratch workspace (research the primary, lab with its own `rail_color`):

- Rail color: a Hub select, research first and chosen. lab chosen: lab's red and `lab/.oculus/config.yml:60`.
- blue picked with lab chosen: lab's file changed to `#2563eb`; research's file the same under `shasum`.
- Slurm Resource, a key read from the primary alone: no select, the primary's line.
- lab's file made not to parse: the row drew "lab/.oculus/config.yml is not valid YAML, so the line of a setting in it is not shown: ..." under its control; a pick wrote nothing to either file. The file was put back.
- Seen and left as ruled (Z1036): on a row whose hub's file does not parse, the colour control stays drawn with oculus's value and does nothing when used; the red sentence under it says why.

## Visible changes

As the booking under O85 in `plan.md` states them, the round's changes included: the refusal of a key outside the 37 with another hub named reads "{0} is not one of a hub's own settings, so it is not set for the hub {1}"; the route answers `{ hub, config }`; Reset of the last key of a settings file that also holds a comment takes the key out and leaves the comment and `{}` (Z1042).

## What was found

- The builder's first report did not pass its bar: handed back at case 16 and the draft question, then one repair round of five items.
- The review over the round found no defect in the code; its points were fixed at landing: the `gear.ts` head comment, the `editor-saved.test.ts` titles, the `primary_only` sentence, the two stale rows of the report.
- `agents/guarded.md`: G8, G9, G28 and G96 name the step's code and tests.

## Usage

- Brief check a8ab0d4773e514752, claude-opus-5-5: 276151 tokens, 97 tool uses, 14 min 31 s.
- Builder a3a4085fe48cb342d, claude-opus-5-5: 334254 tokens, 82 tool uses, 14 min 23 s (first run); 328209 tokens, 596 tool uses, 111 min 4 s (build under the cases ruling); 258807 tokens, 138 tool uses, 27 min 11 s (repair round 1).
- Reviewer a0e17faa413580c97, claude-opus-5-5: 107756 tokens, 105 tool uses, 26 min 59 s.
- Reviewer over round 1 ae28be89d8e8cf281, claude-opus-5-5: 262691 tokens, 77 tool uses, 19 min 3 s.

## Next

/spec O84; O86's and O89's reports, reviews and landings; O88 after 461.
