# O140 landing

Roadmap entry: the cockpit-to-oculus migration. Step O140, interview and offered drawn apart in every theme (rulings 665 and 666). Next: Axel's rulings on 667, 668 and 669; nothing else is queued.

## Open items

- 667: the `focus_lanes` comment at `config/catalogs/vocab.yml:181` claims neighbouring lane headers stay 10 apart in every theme and counts "ten of the pairs" below 10 in a collapsed layout; only pairs with teal or pink were measured. (a) a step that measures every lane pair over the 49 themes and rewrites the comment to the measured result, changing a lane colour where an open-layout pair is under 10; (b) the count and the claim taken out unmeasured, the lazy option. Recommended (a).
- 668: the Findings view's Audit kinds (Open items, Missing data, Website, Muted, ...) are drawn with the same strip as the Audit heading they sit in. (a) `GroupHead` draws a nested strip one level down (small label, indented), for every nested group including the Status Gallery; (b) the Audit kinds alone through a prop; (c) the outer Audit heading removed; (d) no change, the lazy option. Recommended (a).
- 669: a `stopped` status. 1 (a) an application whose procedure the employer stopped, added to `statuses:` with `closes_deadline: true`, to the Applications options of the research hub and of oculus's template, after `withdrawn`, with an `archive/stopped/` folder; 1 (b) the word in `statuses:` only, the lazy option. 2 (a) slate `#475569` like `withdrawn`; 2 (b) grey `#9ca3af` like `not-applied`; 2 (c) a hue of its own checked in all 49 themes. Recommended 1 (a) and 2 (a).

## Steps 1

The runner's agent listing showed no subagent running; none of O140's agents (the builder a1af65dc72468561d, the brief check ad6e98d66c1edb3ea, the reviewers ada1bd113ba2a7360 and ae90cb8bdcf3baa30) was listed.

## Not done

Nothing of the step.

## What landed

The whole range from base 3680ded21 (the builder's first run and repair round 1, in the wip commit 4157842db): 9 paths, 75 insertions and 65 deletions.

- `config/catalogs/vocab.yml`: `interview` and the Interview row of `position_stages` take `#ec4899` (`c-pink`) in place of `#7c3aed`.
- 14 theme blocks get a pink of their own and 17 a teal of their own, each at a CIEDE2000 of 10 or more against every status token on the hue and on `-txt` in all 49 themes; no `-lane` pair with teal or pink that was at 10 or more on the base is under 10 after.
- Each touched head comment names where its added hues come from; Oxocarbon's teal and pink are IBM Carbon's teal 50 and magenta 30.

Fixes at landing, from the review over round 1:

- S3: `src/lib/themes/rice/gruvbox.css:84` sets `--c-teal: #06a596`, the darkest teal found within Gruvbox Light's status chroma range that meets the bars. The case-run program, run from the gate, prints `teal #427b58 -> #06a596 L 64.9 C 0.114 h 183.5; nearest hue 17.7 (cyan); -txt #047369 nearest 10.1 (cyan)`, `C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10` and `C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after`. Keeping `#22aba2` was the lazy option.
- P3, T1 and B3 in `agents/reviews/O140-report.md`: the final-run heading names `run-r1-final.txt`; the sentence on the builder's edits names the heredoc that appended its round section (booked under "Unapproved builder scripts"); the visible-change list names the Usage view's tier tag (`Usage.svelte:205`).

## Verification

In the gate worktree at main's head db6b0a1b7, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
test:quick: 9 changed file(s), from git since HEAD
test:quick: 10 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.6 s)
ok      svelte-check (12.9 s): 1793751018103 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (27.2 s): Duration  13.25s
ok      vitest checks (48.5 s): Duration  34.22s
test:quick: 51.3 s; every command passed
```

On main, `git diff --cached --binary` equals the gate's under `cmp`. The verify list equals the page's commands. No A/B: the configuration names no bench.

## The look

A scratch server on 8797 from the gate, with a scratch copy of the research hub in which one application is set to `offered`:

- The Applications view's status chips: interview pink and offered teal, apart from active and applied, in the VS Code theme, Rose Pine, Gruvbox Light (`#c22d62`, `#06a596`), One Dark and Oxocarbon, each through the palette's `:theme` preview.
- The Focus board's Job applications column: the Interview stack's edge pink and the Offered stack's edge teal, both labels muted, in the VS Code theme, Rose Pine Dawn and Gruvbox Light.
- The Findings view's Audit group, for open item 668: "Audit 77" and "Missing data 75" are drawn as identical strips.
- No console error. The server is stopped and 8797 is free.

## Agents

The builder's first report did not pass its bar: the review found Spec S1 and S2, Proof P1 and P2, a `singles.css` sentence and Behaviour B1 and B2, closed by repair round 1. The review over round 1 found S3, P3, T1 and B3, fixed at landing.

- Builder a1af65dc72468561d (claude-opus-5-5): first run 208174 tokens, 148 tool uses, 27 min 27 s; round 1 248204 tokens, 36 tool uses, 5 min 8 s.
- Brief check ad6e98d66c1edb3ea (claude-opus-5-5): 180152 tokens, 47 tool uses, 9 min 14 s.
- Reviewer ada1bd113ba2a7360 (claude-opus-5-5): 216228 tokens, 57 tool uses, 12 min 14 s.
- Reviewer over round 1 ae90cb8bdcf3baa30 (claude-opus-5-5): 177543 tokens, 48 tool uses, 15 min 9 s.

## Next

Axel's rulings on 667, 668 and 669; each ruled (a) becomes a step.
