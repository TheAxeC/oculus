# O104 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O104, one page frame and one editor, landed; no step is left unticked in `plan.md`.

## Open items

None.

## The check of Steps 1

`ListAgents` listed no subagent: the builder a64b1775be113ff93 and the reviewers acbb52be2a1105eff and a794fd0690f9f9703 had ended.

## Not done

- Not looked at: the light theme, a post with an image, the No funding and Archival listings, an empty set, a save refused, a press of Save, Write the website's outcome line, a career file with no schema.
- An entry of a file with no schema still opens a page that says unknown (`pageOf` null, `page-entry.ts:303-310`), as at the base.
- Whether the step made `tests/data/hubs/hub-portfolio.test.ts` slower is not verified: the base copy has no `node_modules`.

## What landed

- oculus: the whole range 3b366cd98..migration-O104, with the Doc text of `agents/guarded.md` and the fixes at landing.
- The research hub: commit 2db7d35dd, 17 files, 220 `section:` rows and five corrected sentences. Axel's uncommitted change of `applications.yml` stays uncommitted.

## Verification on main

- `npm run diagrams`, `npm run docs:palette`: exit 0.
- The verify list, its last run, after the last fix: ASCII gate, prettier, svelte-kit sync, eslint, svelte-check (0 errors, 0 warnings), vitest, vitest slow and vitest checks ok; "test:quick: 143.4 s; every command passed".
- It covers no test that reaches no changed file within the import depth, other than the source and tree checks, no build, and no lint of unchanged files.
- Two earlier runs on main were red only on the 20 s test timeout: 3 tests, then 1, of `hub-portfolio.test.ts` and `website.test.ts`, with the load average near 12. `hub-portfolio.test.ts` alone passed 3 of 3 (16 tests, 35 to 41 s of test time). No timeout was changed.

## The look

On 8790, dark theme with the wallpaper: the project page and its editor (BTTN), an entry's page and editor (MSc supervision), Career and its editor, a venue's page (AIIM), a person's page (Axel Faes), the Orphans listing, a pillar's page, a LinkedIn idea's page. The console showed no error. The look found the Career strategy card drawing "Quantitative Researcher:" and an empty label for an order row with an empty `when` and `note`; fixed at landing and seen right.

## What was found

The review over round 1 gave five findings, closed under the Closed heading of `agents/reviews/O104-refuter.md`.

## Usage

- Builder a64b1775be113ff93: 274086 tokens, 395 tool uses, 52.7 minutes; round 1: 152472 tokens, 125 tool uses, 15.4 minutes.
- Brief check a566ce9e7d193844e: 296680 tokens, 40 tool uses, 13.2 minutes.
- Reviewer acbb52be2a1105eff: 130606 tokens, 74 tool uses, 16.4 minutes.
- Reviewer over round 1 a794fd0690f9f9703: 288659 tokens, 41 tool uses, 11.9 minutes.

The first report did not pass its bar: repair round 1, 9 items. Fixes at landing: findings 1 to 5 of the run over round 1, the sentence on `Surface` in `RecordPage.svelte`, and the order rows of `Career.svelte`. No bench line.
