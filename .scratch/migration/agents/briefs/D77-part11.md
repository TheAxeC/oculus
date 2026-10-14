# D77, part 11: the Source Control Graph's doubled commits and its branch colours (open item 113)

Size: added to the full step D77, defects of delivered work folded into the step in flight (Z468; Axel: "also graph view lists several commits double? And local / orign have the same color?"). Every rule of the brief, the launch prompt and `agents/briefs/D77-cases.md` holds. Line numbers are as on main at the base abe5c9651.

## What is on the tree

- `src/lib/server/core/git/reads.ts:57-90` (`graphPage`): the history is `git log --topo-order <format> --skip --N HEAD --`, and the first page also carries `incoming` (`HEAD..@{upstream}`) and `outgoing` (`@{upstream}..HEAD`). `graph/Graph.svelte:394-407` draws the Outgoing head and its commits, then the history, which holds the same commits again: every commit the branch has not pushed is listed twice. The hub's main is 3 commits ahead of `origin/main` and ordo's too (`git rev-list --count @{upstream}..HEAD`, run by the orchestrator, gives 3 in each), so each shows three commits twice.
- VS Code's graph is one graph of "the current branch, the current branch's upstream branch, and an optional base branch", in which it "identifies incoming and outgoing commits", and "Select an Incoming Changes or Outgoing Changes entry to inspect its files" (code.visualstudio.com/docs/sourcecontrol/history, read by the orchestrator).
- The pills (`graph/CommitRow.svelte:249-273`): every pill is drawn with `--panel` and `--line`; only `data-pill='local'` (a local branch other than the checked-out one) takes `--accent-bg`. The checked-out branch is the head pill, so `main` and `origin/main` are drawn alike, and local and remote share the glyph `branch` (`CommitRow.svelte:128-131`). VS Code gives the graph's names three theme colours, `scmGraph.historyItemRefColor` ("History item reference color"), `scmGraph.historyItemRemoteRefColor` ("History item remote reference color") and `scmGraph.historyItemBaseRefColor` ("History item base reference color") (code.visualstudio.com/api/references/theme-color, read by the orchestrator); no theme token of oculus names such a colour (`git grep -n -i "historyItem\|remote-ref" -- src/lib/themes config` prints nothing). `config/catalogs/icons.yml:49` draws `branch` as `git-branch`; the icon package has `cloud.svg`.

## What to build

1. **Each commit once (Z895).** The history is read over HEAD and its upstream together (`HEAD` and `@{upstream}` when the branch has one), topologically, so an incoming commit sits in its own lane of the one graph and an outgoing commit in HEAD's, each drawn once. Incoming Changes and Outgoing Changes are one entry each, drawn where VS Code draws them (above the commits of their side, with the dashed circle of their kind and the count of commits), and a press on one opens the files changed over its whole range (`HEAD..@{upstream}`, `@{upstream}..HEAD`), each opening that range's diff of the file, as a commit's files open. The commits of each range are marked in the graph as incoming or outgoing (the dashed circle of their kind in their lane). Load More, Go to Current, the commit menus, the blame's open commit and the refresh rules of `Graph.svelte`'s head comment keep working over the combined history. A branch with no upstream reads HEAD alone, as now.
2. **Names in VS Code's three colours (Z896).** Three theme tokens in `src/lib/themes/tokens.css`, given in every theme of `themes.css` that sets the accent: the reference colour (the checked-out branch's head pill and every local branch), the remote reference colour (a remote branch), and the base reference colour (the upstream's base where the graph names it); a tag keeps the plain pill. A remote branch's pill carries a glyph of its own, a new glyph name drawn as the icon package's `cloud.svg` with its ASCII stand-in in `config/catalogs/glyphs.yml`. The colours pass the contrast check of `tests/checks/look/contrast.test.ts` under every theme.
3. `Graph.svelte`'s, `GraphHead.svelte`'s, `pills.ts`' and `reads.ts`' head comments, and `HELP.md`'s Source Control text, say what the code then does.

## Cases

40. A scratch repository whose branch is 2 commits ahead of its upstream and 1 behind: the graph lists each of the 4 commits involved once (the 2 outgoing and the 1 incoming among them), the Outgoing Changes entry counts 2 and the Incoming Changes entry 1, and a press on Outgoing Changes lists the files of `@{upstream}..HEAD` (a unit run of the read and of the rows, run on the unchanged tree first, where the 2 outgoing commits are listed twice).
41. A branch with no upstream: the history as now, no entry.
42. The pills: `main` (checked out), `feature` (local) and `origin/main` (remote) on commits: `main` and `feature` in the reference colour, `origin/main` in the remote colour with the cloud glyph, a tag plain (a unit run of `commitPills` and the drawn `data-pill`; the look for the colours).
43. The look: the hub's Graph (3 commits ahead of `origin/main`) lists each commit once, Outgoing Changes counts 3, and `main` and `origin/main` differ in colour, under the dark and a light theme.

Folders: `src/lib/state/sources/repositories/` holds 10 items (`ls | wc -l`), so no new file goes there; `graph/` holds 8 view files.

## Paths this part adds

- `src/lib/server/core/git/reads.ts`, `src/lib/views/sources/repositories/graph/` (every file), `src/lib/state/sources/repositories/graph-lanes.ts` and the other state files of the graph's rows
- `src/lib/themes/tokens.css`, `src/lib/themes/themes.css`, `config/catalogs/glyphs.yml`, `config/catalogs/icons.yml`, `config/text/views/sources/repositories.yml`
- `HELP.md`
