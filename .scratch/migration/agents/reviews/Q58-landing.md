# Q58 landing

## Open items, verbatim from the state file

- Where the ten views opened for something rather than listed (deposit, doc, document, editor, file, note, person, project, slides, source) sit, raised 2026-09-22 by both reviews of Q58. Ruling (3) put `config/text/views` in one subfolder per rail group; these ten have no rail group, so the ruling does not place them. Q58 puts each in the group it is opened from, in `src/lib/views/<group>/` and in `config/text/views/<group>/` alike (project, editor, deposit, person under boards; source, file, document, doc, note under sources; slides under academic). The other option is an `opened/` folder beside the eight groups: in `config/text/views/` it fits (nine items), in `src/lib/views/` it makes eleven, so there it would need another fold (for example `registry.ts` into `shared/`). Recommended: keep Q58's layout, since a view's folder then names the rail group a reader reaches it from, and the two trees keep one rule without a fold made only to fit the count. The lazy option is neither; the cheaper one is keeping what landed, and it is recommended on its merits, not its cost. Q58 lands with its layout; a ruling for `opened/` is a small move step.

Booked list: four entries in the state file. Q59 carries three of them: the audits scan's three holes, the outstanding findings of the recurring pass and the closure audit, and the sixteen revert lines that prove nothing. The fourth is the TEST-page look owed by three earlier landings (Q30, Q45, D22).

## Not done

Nothing inside the brief. The plan is paused after Q58, as Axel asked.

## What landed

Q58 as one commit on main, the whole range from base `e9a53f16` cherry-picked by `land.sh` and the landing fixes made on main:

- the eleven files over the size line split by concern, `bin/size-allow.txt` down to its header;
- every folder under `src`, `tests`, `bin` and `config` at ten items or fewer, held by `bin/folder-check.sh` and its cases;
- the API routes in route groups with every URL unchanged, the views in `views/<group>/<name>/`, the five vocabularies in `config/catalogs/`, the view catalogs in `config/text/views/<group>/`;
- the history wording out of every source, test, config and document file, and the history audit reading comments, text files and the three documents;
- DESIGN.md, HELP.md and README.md following the tree.

## Fixes at the landing

The run over repair round 1 (`agents/reviews/Q58-refuter.md`, "Repair round 1, refuted") left twenty points; each is closed on main, listed under that file's Closed heading. The ones that change code or tests:

- eight tests moved to mirror their sources (`tests/views/shared/card/`, `links/`, `prose/`, `tests/server/accounts/connect/oauth.test.ts`);
- every position in `tests/checks/tree/allow-duplication.txt` set to where its copy first sits, read with the check's own `copies` function;
- the history audit's case keeps its name and a second case covers the documents; the `.sh` branch of its planted case has its own revert line;
- the three git tests' module paths back in their pre-round form;
- one-line doc comments over 100 columns split into blocks; YAML comment paragraphs one line each, as the spec asks;
- eleven comments naming `config/text.yml` or `config/text-oculus.yml`, and two DESIGN.md paths, rewritten.

The look found one defect, fixed at the landing: the Config view drew its eleven cards cut to their titles, the description, the line count and the Open control clipped, because the card list was a flex column the pane's height squeezed and a card clips what overflows it. The list is now a grid whose rows are as tall as their cards, and it scrolls. `tests/browser/workbench/system.spec.ts` gains `every configuration card is as tall as what it holds, and the list scrolls`, red with the fix reverted (`node bin/revert-check.mjs tests/browser/workbench/system.spec.ts`). The clipping was there before Q58: the view's styles and the Card primitive match the base.

## Verification, on main over the landed tree

```
npx vitest run --reporter=dot        Test Files 271 passed (271); Tests 4404 passed (4404)
npm run check                        COMPLETED 1278 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run build                        exit 0
npm run format:check                 All matched files use Prettier code style!
npm run lint                         exit 0
ASCII gate (perl form of spec.md)    prints nothing
sh bin/size-check.sh                 exit 0
sh bin/folder-check.sh               exit 0
npm run test:browser                 272 passed (8.0m)
node bin/revert-check.mjs            over the 34 test files carrying a revert line: 173 reverts, 16 unproven, 434 unchecked; 157 red
```

The 16 unproven are the Q59 set, the same lines in the same seven files, each unproven at the base as well: `form-drafts.test.ts` 7, `writes-collection.test.ts` 2, `explorer.test.ts` 2, `person.test.ts` 2, `leads.test.ts` 1, `radar.test.ts` 1, `unsaved-forms.spec.ts` 1.

The case count against the base: 4,395 to 4,404 node cases, nine new and none lost; 174 names changed, each because a path in it moved.

## The look, on the TEST page

Created through the page menu (New page, renamed TEST); Axel's Page 1 was not touched.

- Config view: the five top-level files, then `catalogs/glyphs.yml`, `catalogs/icons.yml`, `catalogs/manifest-schema.yml`, `catalogs/meta.yml`, `catalogs/vocab.yml`, then `local.yml` with its tag; each card with its description, its Open control and its line count after the fix above.
- A catalog opened from its card: a source tab `icons.yml` on `catalogs/icons.yml`.
- Files: the engine root holds `catalogs/` with the five files and `text/`, the breadcrumb reading `engine > catalogs > glyphs.yml`.
- Focus: the command center, the task lanes and the parked and incubation lanes with their heads, counts and cards; a card's Move to menu opens with the current lane marked, and Escape closes it and returns focus to its button.
- The Sources group menu opens and draws its seven entries.

Nothing else wrong was seen.

## Next

The plan is paused. On Axel's word: his ruling on the open item, then Q59 + Q65 + O31.
