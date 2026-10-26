# O89 landing

Roadmap entry: the oculus migration plan (`.scratch/migration/`). Step O89, one record card and one way to add a dated line, landed 2026-10-26. Next: /land O86; /spec O88.

## Open items

- 479: which cards outside the project card draw the strip of projects. (a) a person's card, one strip of the projects whose team holds them; (b) a person's card one strip per role (Lead, Supervisor, Collaborator), an organisation's card the projects of its affiliated people, a resource's card the projects whose `compute:` names it; (c) none (the lazy option). Recommendation (b).
- 480: scheduling rulings 470 to 478 (and 479). (a) six steps O91 to O96 grouped by the files they change, and from now on a design open item carries its scheduling; (b) one step per ruling; (c) left unscheduled (the lazy option). Recommendation (a).
- 481: which side names the link between a project and an event, a teaching entry or an application. (a) `related:` stays on the entries; (b) the manifests name them and the entries lose `related:`; (c) no decision (the lazy option). Recommendation (a).

## Check of the agents

`ListAgents` at the landing listed one subagent running, O84's builder a6b9bb9efcca75eff; none of O89's brief check (a17b47d782ada96fb), builder (a6462cf6ae75f9bfa) or reviewers (a96110aabd9a11d96, ae4b4974dbde33b60).

## NOT DONE

Nothing of the step. The look did not see an inbox thread's card, since the scratch workspace has no mail account.

## What landed

The whole range from base 1da23d50b (one wip commit c4a336e4e of the builder's work), 84 paths, 4222 insertions and 3064 deletions:

- Every card that is a record or a list of projects (project, entry, venue, dataset, domain, pillar line, lead, Lit Watch paper, LinkedIn post, inbox thread, Literature search hit, Archival, Orphans, No funding) has the project card's head and its "..." and right-click menu, each kind adding its own actions.
- The menu's Add group holds Follow-up, Subtask and Deadline; the add form has a line above it, a heading and visible labels; Quick add on Focus picks the kind of record and the record in two dropdowns and opens the same form.
- An entry's fields are edited on its page or through the menu.
- `npm run test:quick` runs the checks that scan source text whenever a file under `src`, `tests` or `utils` changed; the palette page lists the board views.

## Checks

In the gate worktree at main's head c38a6b62a, after `git cherry-pick -n 1da23d50b..migration-O89` (conflicts only in the generated `docs/diagrams/*`, taken from main and regenerated), `npm run diagrams && npm run docs:palette && npm run test:quick` after the last fix:

```
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (3.8 s)
ok      svelte-check (131.6 s): 1793049464361 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (182.3 s)
ok      vitest checks (288.5 s)
ok      vitest (293.2 s)
ok      vitest slow (326.2 s)
test:quick: 330.3 s; every command passed
```

On main the gate's staged diff applied with `git apply --index`; each of the 80 staged paths that is not a deletion is equal under `cmp` to the gate's file.

## Fixes at landing

- `utils/diagrams/palette.mjs` registers the board views, and `docs/palette.md` regenerated lists them.
- `NO_HUBS` frozen; the comment of `editor-saved.test.ts:10-11` rewrapped.
- The record cards' own actions read capitalised in the menus (Applied, Decline, Reopen, Posting, Paper, Restore, Dismiss, Idea, Open at the provider, Triaged, Mark posted, Edit, Source), as `docs/HELP.md:302` names them, and a lead's delete reads Delete.

## The look

Scratch server on port 8797 from the gate, over a copy of the hub's data and manifests, Pillars first: pillar lines, Orphans, provisional and off-pillar lines as record cards with their strips; a line's menu (Page, Follow-up, Subtask, Edit in File, Delete); the in flight picker grouped by stage; the Archival card keeping one stage open at a time; a venue's deadline 37 days ahead drawn as its date; Focus Quick add with its two dropdowns, "New subtask", What, Deadline, Save and Cancel; a lead's, a Lit Watch paper's and a LinkedIn post's menus.

## Agents

Brief check a17b47d782ada96fb (claude-opus-5-5, 241420 tokens, 78 tool uses, 11 min 1 s); builder a6462cf6ae75f9bfa (claude-opus-5-5): 333768 tokens, 626 tool uses, 84 min 20 s, repair round 1 314732 tokens, 77 tool uses, 22 min 45 s; reviewer a96110aabd9a11d96 (claude-opus-5-5, 314122 tokens, 92 tool uses, 14 min 2 s); reviewer over round 1 ae4b4974dbde33b60 (claude-opus-5-5, 225147 tokens, 60 tool uses, 11 min 1 s). The builder's first report did not pass its bar (one repair round of nine items).
