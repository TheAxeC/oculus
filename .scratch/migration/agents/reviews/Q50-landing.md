# Landing report: Q50

## Open items at this landing (verbatim from the state file)

- A write that never answers (raised 2026-09-18 02:03 by Q48's second round): `state/writes.svelte.ts`'s `send` has no timeout and no abort, so a request that never comes back leaves that form's Save control disabled until Cancel or a reload. Recommended: a write gives up after 30 seconds and says so in the form's own refusal line, the duration in `config/behavior.yml`.
- The project tab and the card disagree about a document the project has not got (raised 2026-09-18 05:15 by R14's repair round): the card draws a known document a project does not hold as a plain `Tag`, the tab draws nothing, and `tests/views/project.test.ts:219` pins the difference. Recommended: the tab draws the absent tags the card draws.
- A tap reaches no ticker button on a device that also has a pointer (raised 2026-09-18 05:31 at Q49's landing). Recommended: leave it as it stands.

## NOT DONE

Nothing of the step itself, and nothing of the two reviews left open.

## What landed

Q50 landed 2026-09-18 06:25 from worktree `q50` at base `dacfc4bb` by `land.sh --no-browser`, after one review (five rulings), one repair round, and a second review whose sixteen findings were closed here.

A value whose first segment is a host is an address, not a path of the hub: `www.` with anything behind it, or a dotted first segment with a letters-only suffix and a path behind it, with an optional port. Such a value gets no Show in Files control and no "not there" line, and `hrefOf` puts `https://` in front of it.

The round the first review asked for made the builder put the same question to every caller of the rule, and that found three more wrong surfaces than the review had: the venue card's site link rendered a scheme-less value as a relative href, the venue card's call link was raw, and `isDocument` opened `www.example.org/index.html` in the document view under the hub root.

Fixes at landing, all in the worktree before the cherry-pick:

- **A `folder` field is a path of the hub whatever its first segment looks like** (`HUB_ONLY_FIELDS` in `src/lib/state/collection.ts:310`). This hub holds a folder named `theaxec.github.io`, and the round's rule read a `folder:` under it as a web address, so the Person view stopped listing a folder it had listed before. The case that pinned that behaviour is rewritten to assert the rule; red with `HUB_ONLY_FIELDS` emptied.
- **The Person view says when a folder is not one of the hub** (`person.folder_outside` in `config/text/views/person.yml`), where the round left a heading over an empty block. Red with the line replaced by a comment.
- **`isDocument` asks the same question as the Show in Files control** (`hubPathsOf({ link }).length > 0`), so a path climbing out of the hub is not a document either; the round left it on `isHubPath`, which excludes an address but not `../`.
- **The lead and radar cards draw a posting written without its scheme.** Both decided with `url.startsWith('http')`, so `jobs.example.org/x` drew no link at all; both now go through `hrefOf` and draw the link when it names a web page, which keeps `ftp://` out as before. A case in each, red with the rule narrowed.
- **The comment above `ADDRESSED`** now names the `www.` branch, which the second review found it still missing; **`VenueCard.svelte`'s head comment** says a path opens in a tab of its own, which is what the code does.

## Verification on main

- `npx vitest run --reporter=dot`: 251 files, 4,276 tests, 1 red, `tests/server/git.test.ts > carries the newest commits...`, a known load flake with three reviewers' suites running beside it; green alone, `34 passed` in 10.58s.
- `npm run check`: 1,222 files, 0 errors, 0 warnings. `npm run lint`, `npm run format:check`, the ASCII gate and `python3 -c yaml.safe_load` over `person.yml`: all clean. `npm run build`: exit 0.
- In the worktree: the whole node suite 4,275 passed, and `npx playwright test` 253 passed (5.6m).

## The look

Taken 2026-09-18 06:25 on the TEST page of Axel's Chrome. The Venues view draws 67 cards; every site link is absolute (`https://www.sciencedirect.com/...`, `https://academic.oup.com/bioinformatics`) and **none is relative**, which is the shape the step's first defect produced. Nothing on screen differs from before the step, which is what the probe says to expect: of 257 values at a `link`, `url` or `folder` key in the hub, 0 are read differently.

## What the landing recorded

- Two claims of the round's report the second review did not reproduce: its revert A and revert B rows say 5 and 4 cases red where the reviewer's own run over the same files gives 6 and 6, and seven of its ten files-changed rows are short by the blank lines between the added blocks (`git diff dacfc4bb --numstat` gives `22 3` for `collection.ts`, not `20 3`).
- The integrity case's count mixes fields: of the 256 values it walks, 92 are `entities.projects.folder`, which never passes through this rule at all, since `ProjectCard.svelte:149` hands `project.folder` to `showInFiles` raw.
- A bare host with no path (`github.com`) still reads as a path of the hub, by the ruling that the shape-based rule stands: separating it from `README.md` would take the hub root's own listing, which lands after a card is drawn and would take a control away again. The integrity case prints any such value the day one appears.

## Where the proof is

- The brief: `agents/briefs/Q50.md`.
- The builder's report and its repair round: `agents/reviews/Q50-report.md`.
- Both reviews: `agents/reviews/Q50-refuter.md`.
