Verification (run from .agents/worktrees/R18/tools/oculus, Node v24.21.0, Doc text NOT applied)

1. `npx vitest run --reporter=dot`: `Test Files 2 failed | 280 passed (282)`, `Tests 2 failed | 4530 passed (4532)`. The failures are (a) `tests/views/system/help.test.ts > audits that the manual shows every diagram the generator writes, each one committed` (`expected [] to deeply equal [ 'channels', 'layers', 'writes' ]`), which is the HELP.md gate and was expected, and (b) `tests/checks/bin/revert-check.test.ts > removes its copy of the tree when it is stopped by a signal`. Case (b) is a timing case: rerun alone with `npx vitest run tests/checks/bin/revert-check.test.ts` it gives `19 passed (19)`.
2. `npm run check`: `COMPLETED 1308 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0.
6. The perl ASCII gate prints nothing. `LC_ALL=C grep -n '[^ -~]' docs/diagrams/*` also prints nothing.
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0. `ls bin | wc -l` gives 10.
8. `node bin/diagrams.mjs` run twice leaves `shasum docs/diagrams/*` identical to the delivered files and to each other: channels.dot 7491ef89, channels.svg e6bd7069, layers.dot 703cb174, layers.svg acb848ba, writes.dot eceaf370, writes.svg 5e597629. These match the report.
9. `npm run build` gave exit 0. `lsof -iTCP:8792 -sTCP:LISTEN` printed nothing. `npx playwright test tests/browser/workbench/system.spec.ts --reporter=list` gave `3 failed, 7 passed (45.4s)`. The three failures are the Help diagram cases (colour at :71, script at :96, in flight/closed at :126). All three fail with no `[data-diagram]` on the page, because HELP.md has no diagram lines yet; they were expected. The route case (:159) passes. On the first run the pre-existing case at :44 also failed once with `browser.newContext: Test ended.` and passed on the rerun.
10. `node bin/revert-check.mjs` over tests/checks/diagrams/diagrams.test.ts, tests/routes/docs/diagrams.test.ts, tests/checks/source/html-sites.test.ts, tests/views/whole/type-scale.test.ts, both migration tests and tests/views/system/help.test.ts gave `21 reverts, 0 unproven, 28 unchecked`. system.spec.ts was not put through it, because three of its cases are red without the Doc text.
11. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before, 7015 after every run.

Other checks I ran:
- I copied src, boundaries.test.ts and docs into the scratchpad, added one import to lib/data/model.ts and one `hub.publish('brandnew')` to server/watch/git.ts, and ran generate() against the committed files. layers and channels (dot and svg) came out STALE and writes came out same. So the stale gate does go red when the source changes.
- I ran the report's HELP.md Doc text through `new Marked().parse` and `splitManual`. It gives prose, layers, prose, channels, prose, writes.

Spec

- bin/diagrams.mjs:697 and :727-753 (`const kept = chainTo(edges);`, where a module "a module of the data layer no path to the disk goes through ... is left out"). The brief says "a module the reader cannot place is named in the diagram, not dropped". I ran writesDot from a scratch copy with chainTo replaced by "keep every traced node". The trace reaches ten modules the committed writes.dot does not show at all: lib/data/index.ts, lib/data/helpers/{dates,deck,finding-text,guards}.ts, lib/data/snapshot/{normalise,validate}.ts, lib/data/sources/manifests.ts and lib/data/sources/config/{local,merge,settings}.ts. Among the edges lost are writes.ts -> data/sources/config/merge.ts (configDir, loadConfig) and -> settings.ts (changesKeep). No refusal edge was lost (the `dashed` count is 2 in both versions). The report books this as judgment call 3. These modules are placed and left out on purpose, so the letter of the rule is not broken. But nothing in the drawing tells the reader they were cut, and the HELP.md Doc text says "never left out".
- The readers do drop, without naming them, modules they cannot follow, which the brief's rule forbids. A scratchpad probe of the exported functions showed two cases:
  - A client module reading a channel through a variable (`const which = 'old'; message(which)`) is absent from channelsDot's output. Line 394 matches literals only, and nothing puts the miss in the "channels not placed" group.
  - A write module reached through a dispatch table (`HANDLERS[kind]()`, with the table importing `saveOld`, which calls `writeFileSync`) is absent from writesDot: `table.ts named? false`, `old.ts named? false`. Line 690 follows a property call only through a namespace import, and line 684 skips any other call silently.
  - Neither pattern occurs in the tree today (`grep -rnE "\bmessage\(\s*[^' )]"` over the client finds only the declaration at entities.svelte.ts:53). The generator's head comment (bin/diagrams.mjs:10-12, "a diagram never hides what it did not understand") and the Doc text claim more than the code does.
- Paths outside the brief's list: src/lib/ui/html.ts, tests/views/system/help.test.ts, tests/views/whole/type-scale.test.ts, tests/routes/docs/diagrams.test.ts, tests/browser/workbench/system.spec.ts and tests/browser/helpers/serve.ts. The report names each one (judgment call 2).
  - Each widening is needed by the mechanism: the inline SVG needs a filter, and a new view file needs its type-scale entry.
  - The html-sites change adds `sanitiseGraph(` to FILTERED. It adds a named sanitiser and does not widen the predicate for other calls, and Diagram.svelte:66 is the only new site.
  - serve.ts:156-158 only copies docs/diagrams into the run's own engine directory.
  - None of these is a substitute for a brief item.
- The report's item 9 ("Early on I ran one read-only `git diff --stat`") breaks the brief's "Run no git command" (brief line 5), though it was self-reported.

Proof

- tests/browser/workbench/system.spec.ts:126-157 is titled "... and a closed view drops it", with the directive `revert: src/lib/views/system/help/Diagram.svelte:61 => delete`. That directive proves only the loading line. The after-close assertion (`toHaveCount(0)` once the tab closes) is the unmount itself.
  - It stays green with the guard reverted: `src/lib/views/system/help/Diagram.svelte:51 => drawn = answer;`. Svelte 5 raises no page error when $state is assigned after destroy. I have not run this revert, so this is inferred from the code.
  - The superseded path (a later name at :33, `drawn.name === name`) has no test. The report says so (item 8).
  - The spec requires every asynchronous path to be exercised "in flight, after close, and superseded by a later one", so two of the three are short.
- tests/views/system/help.test.ts:122-130 (the HELP.md gate) builds the manual's HTML with a regex, `MANUAL.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1">')`, and not with the renderer the view uses. `renderMarkdown` is exported from src/lib/server/content/docs.ts:208, and for the manual it is `new Marked().parse`. The regex also counts an image written inside a fenced code block, which marked renders as text, so the gate can pass while the view draws nothing.
  - On the Doc text as given, the real renderer yields all three diagrams (my Marked run above). The gate is therefore correct in outcome, and it goes red when HELP.md lacks the lines, as it does now.
  - revert-check lists this case as "red" under `bin/diagrams.mjs:27`, but the case is red before any revert on the delivered tree, so that result proves nothing until the Doc text is applied.
- tests/checks/diagrams/diagrams.test.ts:40 names a generator revert (`node [shape=ellipse]`) and no source change. My scratchpad probe (verification above) shows a source change also turns it red. The failure message names the file (`${file} is stale: run node bin/diagrams.mjs`) but stops at the first stale file.
- tests/routes/docs/diagrams.test.ts:72-78 covers a file symlink out of the folder only. src/lib/server/content/diagrams.ts:44 compares against `realpathSync(folder)`, so a `docs/diagrams` (or `docs`) that is itself a link out of the engine directory is followed and its `.svg` files are served. The test does not exercise this.
- Report counts I could not reproduce:
  - "3637 by 994 pt": layers.svg's head is `width="3825pt" height="994pt"`.
  - system.spec.ts is given as "243 (... not re-measured)": `wc -l` gives 276.
  - "1 failed" for the unit suite: I got 2, the second a timing case that passes alone.
  - "about 360 edges" does match: `grep -c " -> " layers.dot` gives 360.

Standards

- The Doc text for HELP.md says "A module or a channel the generator cannot place is drawn in a dashed group whose name says it is not placed, never left out." That sentence is false against the code: the two Spec findings above, plus the ten data-layer modules cut from the write diagram. The rest of the Doc text matches the code:
  - DESIGN.md:66, :256 and :259 are at the lines quoted, and the report's text is correct for them.
  - The anchors at :104, :127 and :155, and HELP.md:193, are where the report says.
  - I found no other DESIGN.md, HELP.md or README.md line the change makes false, by grepping those three files for sanitise, profile, api/docs, bin/, docs/, the two script names, dependencies and diagram.
- src/lib/ui/html.ts:246-305 (GRAPH_TAGS, GRAPH_ATTR, GRAPH_PROFILE, sanitiseGraph) repeats SVG_PROFILE and sanitiseSvg (:228-244) almost line for line. One profile builder taking its lists would cover both (DRY).
- SVG filter security, from reading the lists and the browser case at :96 (which fails here only for want of HELP.md):
  - No script, foreignObject, use, image, a, style, href, xlink:href, id or on* attribute is allowed, and GRAPH_TAGS and GRAPH_ATTR are frozen.
  - `fill` and `stroke` values are not checked, so `fill="url(...)"` passes. Browsers do not load a cross-origin paint server, and the file is written by the generator, so I rate this low.
  - Page CSS cannot reach the kept Graphviz classes (`node`, `edge`, `cluster`, `graph`): the only selectors with those names are scoped Svelte styles in Graph.svelte and Lanes.svelte.
- I found no history in the new comments and no non-ASCII. Every file is under the size limits, and bin/ is at 10 items.

Behaviour

- Every write edge except the refusals and the edges into the disk carries its function names only as a Graphviz tooltip: 55 `<a xlink:title=...>` wrappers in writes.svg. The graph filter removes `a` and `xlink:title`, so in the Help view those arrows carry no names. The report states this (item 7).
- In the Help view the layer diagram is 3825pt wide, about 5100 CSS px, and scrolls sideways. The report's before and after gives the width as 3637pt.
- The DESIGN.md Doc text adds the three `.svg` files as Markdown images. When DESIGN.md or HELP.md is opened in a Markdown viewer, an `<img>` of a `currentColor` drawing renders black on transparent, so it is unreadable under a dark viewer theme. Only the Help view takes the page's colour. The report states no before and after for DESIGN.md read outside oculus.

Not checked

- The Help-view browser cases and the whole browser suite with the Doc text applied (I was told not to apply it).
- Running the three Help browser cases under their own revert directives.
- The Diagram.svelte:51 revert described under Proof, which is inferred and not run.
- The theme colour case with the Doc text applied.
- Whether the channel reader finds every real reader in the tree. I only confirmed that no client read uses a non-literal channel, and that the `x.entities.y` hits outside `useState` are snapshot entities.
- The package-lock.json entries beyond the one-line package.json change.
- Every line of the three `.svg` files: I sampled the head and counted every fill and stroke value (only `currentColor` and `none`).

Usage: not measured. The session ran one full unit suite, one alone rerun, two runs of the system browser spec, one build, one revert-check over seven files, and scratchpad probes.
