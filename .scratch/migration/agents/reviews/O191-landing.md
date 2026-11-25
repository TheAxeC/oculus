# O191 landing

Position: the migration plan, step O191, a value for none in the board filters, landed; no step is queued after it. Next: the app rebuilt from main and copied over `~/Applications/oculus.app`.

## Open items

None.

## Landed

- Check of Steps 1: the runner's agent listing shows no subagent of the step left; the builder, the brief check and the reviewer had all completed.
- NOT DONE: nothing of the brief.
- With the landing commit: `config/text/views/boards/projects.yml`, `src/lib/state/boards/board/facets.ts`, `filter-menu.ts`, `presets.ts` and `state.ts`, 87 insertions and 34 deletions, from base 35d2f571e (wip commit 8e0eaa33c).
- What is built: the seven facets Situation, Domain, Waiting on, Venue, Pillar, Datasets and Form give a project with nothing there the value for none, drawn as No situation, No domain, Not waiting, No venue, No pillar, No dataset and No form and listed last (ruling 781); a facet whose only value is the value for none draws no group unless it is picked, for all eleven facets that have one (782 (1) (a)); No venue draws no share bar and the Venue bars are scaled over the named venues (782 (2) (a)).
- Fixes at landing, from the review: the reason clause of `filterGroups`'s head comment narrowed to the projects whose values the facet lists; the `NONE` comment of `presets.ts` names the Category group of a collection page's Projects section.
- Found: the builder ran helper programs under `.agents/scratch/` that the brief does not build (`wrap.mjs`, which printed a wrap, a `sed -i` on its scratch program, redirects into logs); closed under the ruling Unapproved builder scripts, the breach recorded in the booking and every comment hunk read and kept, since no tree file was written by a program.

## Verification

In the gate at main's head c010e5c98 with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` at normal priority: `5 changed file(s)`, `27 test file(s)`, prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (`593 FILES 0 ERRORS 0 WARNINGS`), vitest slow, vitest and vitest checks ok, `test:quick: 49.8 s; every command passed`. Main's staged diff equals the gate's (`cmp`: SAME). Not covered: tests that reach no changed file within the import depth. A/B: none, `bench: []`.

## Look

A scratch server on port 8797 with a scratch HOME and a scratch hub holding every manifest outside the archive, the hub's `.oculus/` without its private files, and the deck folders; Oculus Light.

- Research board: Situation lists the chips, then No situation 38; the pick shows 38 of 45. Venue ends with No venue 2, with no bar, while the named venues keep theirs.
- Personal board: no Form, Year or Venue button on line 1; More holds only Tier, Reproduced and Sessions.
- Software board: no Form or Waiting on button; More lists No pillar 7 and No dataset 7 last.
- Map: Pillar ends with No pillar 5; the pick shows five projects and no pillar node.
- Present view: Form ends with No form 45, Waiting on with Not waiting 54.
- Funding view, Projects section: Form is journal article 3, then No form 32; Pillar ends with No pillar 4.
- The No venue count sits at the row's end, where the other counts sit just before their bars; that is the menu's existing layout.

## Agents

- Builder a3e0282f96f945e44 (claude-opus-5-5): 278789 tokens, 110 tool uses, 1696 s. Its first report passed its bar: every item and all 18 cases met, reproduced by the reviewer; no repair round.
- Brief check a501a225694f4340a (claude-opus-5-5): 213152 tokens, 81 tool uses, 570 s.
- Reviewer a187824606f56cf5b (claude-opus-5-5): 233135 tokens, 65 tool uses, 1324 s.
