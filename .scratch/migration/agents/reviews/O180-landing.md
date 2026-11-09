# O180 landing

Position: the oculus migration, step O180 (the fields of a paper on the website come from configuration) landed. Next: O181 builds on, then its review and landing.

Open items: none.

## Check of Steps 1

The runner's agent listing showed no agent of the step running.

## Not done

Everything in the brief is done. The hub's lines are written to its `.oculus/config.yml` and wait for the hub commit.

## What landed

The website's field names, list keys and words as settings of the primary hub, the readers and writers over them, the refusal `website-no-cv-fields`, the setting `website.file_header`, the manifest field `cv.cv_hide`, the documents and the tests.

## Found

- Fixes at landing: Sp2, P1, P2, S1, S2, B1 and B2 of the review over round 1, a comment over 100 columns, and `tests/data/hubs/workspace-projects.test.ts` tagged slow.
- The project form draws "Hidden on the CV" and "Project hidden on the CV" side by side; the two are `cv.hide` and `cv.cv_hide`.
- The audit over the hub's copy offers Write the website for `_data/data.yml` and `_data/publications.yml`.

## Verification

In the gate: `npm run diagrams && npm run docs:palette && npm run test:quick`, 381.1 s, svelte-check 0 errors and 0 warnings. Two red: `comment-width.test.ts`, fixed, `Tests 2 passed (2)`; `workspace-projects.test.ts`, passes alone, `Tests 5 passed (5)`. eslint no output, prettier clean, ASCII no output.

## Look

Scratch server 8797 from the gate over a copy of the hub's tracked files with its lines added. Settings, Primary hub, filter `website.`: 64 settings found, with Code statuses, Cv fields and File header. The project form draws `cv.cv_hide` as a checkbox. Findings holds no word finding and two Website findings offering the write.

## Agents and fixes

Builder a693cdb5194fcfd55 326442 tokens, 152 tool uses, 2557 s, its round 302568 tokens, 139 tool uses, 2093 s; brief check af5af1f8f126742f6 269392 tokens, 39 tool uses, 696 s; reviewer aade7a12319164806 233680 tokens, 32 tool uses, 936 s; reviewer over round 1 a4cd58a46c0fe40f7 281075 tokens, 42 tool uses, 719 s. The first report did not pass its bar; round 1 closed it.
