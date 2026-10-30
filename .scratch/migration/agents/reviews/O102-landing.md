# O102 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O102, the website's data files generated from what oculus holds, landed; next step O101, the Zenodo deposit.

## Open items

None. Axel ruled 585 (a), 591 (a), 573 (a), 575 (b), 576 (a), 577 (a) and 583 (a) on 2026-10-30.

## The check of Steps 1

`ListAgents` listed no subagent: the builder aa81f114239560b1f and the reviewers a465faae897c463b9 and a1799933a38474851 had ended.

## Not done

- The Live HPC tables (Capacity, Login, Recent) were not looked at: the view showed the cluster unreachable from this Mac, which is off the UT network.
- Write the website was not pressed in the look, since a press writes the website's three files and runs its CV command.

## What landed

- oculus: the whole range bd8ad0a08..migration-O102 (wip commit 299b294ac), with the Doc text and the fixes at landing.
- The research hub: commit 9e297c9c5, the hub patch with the ELIXIR-BE `statement:` (585 (a)) and the course key of the `engine` teaching row, 69 paths.
- The website: commit 574da70, `_data/website.yml` and `_includes/site/head.html`.

## Verification on main

- `npm run build`: exit 0. `npm run diagrams`, `npm run docs:palette`: exit 0, the diagrams and the palette page unchanged.
- The verify list, its last run: prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (0 errors, 0 warnings), vitest checks, vitest and vitest slow ok; "test:quick: 273.0 s; every command passed".
- Earlier runs on main were red on load timeouts alone (`commands.test.ts`, `hub-portfolio.test.ts`, `config-key.test.ts`, each green alone) and once on `comment-width.test.ts` for a comment written at landing (`cv.ts:144`, shortened, green alone).
- The case run on a fresh patched copy: config check 0, problems of the build 0, `_data/data.yml` 3 differences (the 591 texts), `_data/publications.yml` 4 (case 2), `_data/industry.yml` 0, 48 publication records, data check 1 (the copy's missing deck folder).

## The look on 8790

- Focus opens with the command center and no Career banner.
- The Career tab draws the editor of the career file in its schema's order; positions are record cards; profiles show the shared block. Write the website sits in the header, its tip naming the three files and `python _scripts/cv_pdf_generator.py --save --quiet`.
- The Audit's Website section lists `_data/data.yml` (first at `experience.content.0.about`) and `_data/publications.yml` (first at `papers-in-review.papers.0.pub_post`), each with its write button.
- The `axel-faes` people card shows FAMILY Faes; it draws no links, as before, when no entry held links. The person page draws the four LINK rows, and the person form holds four link rows of name, url and handle.
- The Usage History table draws its first row below the header row.

## Found at landing

The findings of the review over round 1, fixed on main:
- S2: `cv.ts` gives `audit.msg_cv_key_twice` when a row names a key two records hold, naming the row; two collections sharing an id that no row names give none.
- B1: the hub patch's `engine` teaching row names `bioinformatics-2025-2026`.
- P1: `careerShown` returns no `sections`; the Career view's form row reads the editor's `pageFields` and `toEdit`.
- P2: the comment paragraphs of the 13 new `.ts` and `.svelte` files rewrapped.
- St1: the `files.ts` head comment and the `TIMESTAMP` comment say the award day reads as text in PyYAML and in YAML 1.2.
- St2: G139's Test line leaves the three name rows to G32.
- P3 and P5: the report's quote and patch figures corrected.
- P4: the four verify runs of round 1, named in the booking.

## Agents

- Brief check a21c5d23d4cd30493 (claude-opus-5-5): 261287 tokens, 91 tool uses, 14 min 52 s.
- Builder aa81f114239560b1f (claude-opus-5-5): round 0 hand-back 206001 tokens, 41 tool uses, 6 min 5 s; build after the cases ruling 195013 tokens, 1543 tool uses, 3 h 2 min 50 s; round 1 117934 tokens, 441 tool uses, 50 min 12 s.
- Reviewer a465faae897c463b9 (claude-opus-5-5): 364636 tokens, 112 tool uses, 21 min 34 s.
- Reviewer over round 1 a1799933a38474851 (claude-opus-5-5): 316945 tokens, 116 tool uses, 20 min 46 s.

The builder's first report did not pass its bar: its findings went back in repair round 1 (22 items).

## Next

`/spec migration O101`, with O101.md written from Axel's rulings 573 (a), 575 (b), 576 (a), 577 (a) and 583 (a), the people field `family` now on main, and the EPIPE fix of `git-write.ts:195`.
