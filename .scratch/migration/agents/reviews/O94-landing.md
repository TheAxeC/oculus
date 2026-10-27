# O94 landing report

Position: the migration plan (`.scratch/migration/plan.md`), step O94, LinkedIn's Mark posted, landed. In flight: O87 (repair round 1 built, review over the round next), O88 (building), O91 (building). Queued: O90, O92, O93.

## Open items

- 489 (2026-10-27, /spec O91): the ten titles of the research hub's `joint-work.yml` entries, which ruling 470 (a) would delete with the file. (a) each title kept as the first sentence of that person's `note`; (b) a new `work` field on the people schema; (c) the titles deleted, the lazy option. Recommendation (a). Scheduling: O91's hub commit at its landing. Booked in the state file.

## The check of Steps 1

`ListAgents` listed no agent of O94: its builder a842e39268dc6aed0 and its reviewers a3d20902e374d2dd1 and aaadd9a0ced9cd29d had ended. Nothing is NOT DONE.

## What landed

O94 from base 5c3847a33, the whole range (one wip commit 5bb5a57a9), 16 paths, 561 insertions and 53 deletions; hub commit 34232a90b for `.oculus/tasks/linkedin.md`.

- Mark posted writes `date:` as the day pressed and `publish: True`, renames the idea and its sidecars, and refuses before any file moves.
- The LinkedIn view and Mark posted read one front matter rule (`splitFrontmatter`) and one name rule (`isLinkedinIdea`).
- A write or sidecar rename that throws after the rename puts the folder back as it was and passes the error on.
- The snapshot's last-post reader takes a `.MD` post.
- The LinkedIn task drafts posts only.

## What was found

The review over round 1 and its closures are in `agents/reviews/O94-refuter.md` "Closed". Fixes at landing: the view's front matter rule, the head comment of `postedText`, the roll-back of a failed promotion with the stopping error passed on, the `.MD` suffix of the last-post reader, the test's mocks (the throw rows load the writer afresh, since the quick run shares modules between files), the byte order mark written as an escape, five comment lines rewrapped. The first gate run was red in the ASCII gate, the comment-width check and the two throw rows; the second: `test:quick: 200.4 s; every command passed`.

The look on the scratch server (port 8797, a copy of the hub and its LinkedIn folder): an idea closed by `...` drawn with its title and date; Mark posted made it `10-look-dots.md` with its `.png`, `publish: True`, `date: 2026-10-27`, the `...` line kept; a second idea became `11-look-two.md`; the open view drew both under Posted within 4 s; "last post 0d ago, on track"; no console error.

## Agents

- Brief check a0b48bbc141e6efce (claude-opus-5-5): 183761 tokens, 49 tool uses, 8 min 7 s.
- Builder a842e39268dc6aed0 (claude-opus-5-5): first run 133375 tokens, 23 tool uses, 8 min 52 s; after the round-0 ruling 231386 tokens, 102 tool uses, 35 min 34 s; round 1 328755 tokens, 79 tool uses, 16 min 10 s.
- Reviewer a3d20902e374d2dd1 (claude-opus-5-5): 209441 tokens, 56 tool uses, 17 min 47 s.
- Reviewer over round 1 aaadd9a0ced9cd29d (claude-opus-5-5): 198815 tokens, 58 tool uses, 20 min 46 s.

The builder's first report did not pass its bar (a cases ruling and one repair round).

## Next

/refute over O87's repair round 1; O88 and O91 building.
