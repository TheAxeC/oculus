# O105 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O105, the website keeps its own words, landed; next, O106, cards and the entry page.

## Open items

None.

## The check of Steps 1

The builder a335cf314e42c8f6c and the reviewers abfcac510589136aa and a920bd5bb2132e0e7 had ended before the cherry-pick.

## Not done

- Not looked at, each covered by the step's tests alone: the bad-path line under Write the website and its audit finding, and a generated file that is a link out of the folder. Both need a wrong setting in the real hub's `.oculus/config.yml` or a scratch hub.

## What landed

- oculus: the whole range eafa79e6e..migration-O105, 35 paths, with the Doc text of `agents/guarded.md` and the head comment of `src/lib/server/content/audit/website/site.ts` fixed at landing.
- The research hub, commit f35ad1faf: `.oculus/config.yml` and `.oculus/data/academic/career.yml`. Axel's `applications.yml` and the Maastricht folder stay uncommitted.
- The website, commit 33ff3b0: the patch of 14 files, and `_data/data.yml`, `_data/publications.yml`, `_data/industry.yml` and `cv.pdf` as written by the press.

## Verification on main

- In the gate worktree: `npm run diagrams && npm run docs:palette && npm run test:quick`: all ok, "test:quick: 361.4 s; every command passed". The cached diff on main against the gate printed 0 lines.
- It covers no test that reaches no changed file within the import depth, other than the source and tree checks, no build, and no lint of unchanged files.

## The look, on 8790

- Career, Write the website: the tip names the three files and the command in `website.cv`. One press wrote the three files at 11:44:48 with 32 lines fewer (`git diff --stat`), the line under the button names them, and `cv.pdf` was rewritten at 11:44:58.
- Audit: "no website file that differs from what the hub's files give" after the press.
- Settings, Primary hub, search `website.files`: Website Folder and the three rows Files CV, Papers and Industry with their help and defaults, the Folder help naming the keys.

## Agents

- Brief check ae6e12bde917fae57, claude-opus-5-5: 242743 tokens, 26 tool uses, 662 s.
- Builder a335cf314e42c8f6c, claude-opus-5-5: 243369 tokens, 280 tool uses, 4052 s; round 1: 320510 tokens, 55 tool uses, 980 s.
- Reviewer abfcac510589136aa, claude-opus-5-5: 289085 tokens, 33 tool uses, 1032 s.
- Reviewer over round 1 a920bd5bb2132e0e7, claude-opus-5-5: 207458 tokens, 35 tool uses, 683 s.

The first report did not pass its bar (repair round 1). Fixes at landing: one, the head comment named above (T7).

## Next

O106 lands with its hub and website patches, then a second press of Write the website.
