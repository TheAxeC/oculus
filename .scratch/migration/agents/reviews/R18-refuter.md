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

# Repair round 1, refuted

Verification (run from .agents/worktrees/R18/tools/oculus, Node v24.21.0, Doc text NOT applied unless marked "copy")

1. `npx vitest run --reporter=dot`: `Test Files 1 failed | 281 passed (282)`, `Tests 1 failed | 4542 passed (4543)`. The one failure is `tests/views/system/help.test.ts > the diagrams in the manual > audits that the manual shows every diagram the generator writes, each one committed` (`expected [] to deeply equal [ 'channels', 'layers', 'writes' ]`), which is the HELP.md gate. This matches the report.
2. `npm run check`: `COMPLETED 1309 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: `build exit=0`.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: `lint exit=0`.
6. The perl ASCII gate prints nothing (`ascii exit=0`). `LC_ALL=C grep -c '[^ -~]' docs/diagrams/*` gives 0 for all six files.
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0. `ls bin | wc -l` gives 10. `wc -l bin/diagrams.mjs` gives 876.
8. `node bin/diagrams.mjs` run twice gives `identical`. The hashes match the committed files and the report: channels.dot 7491ef89, channels.svg ff54c8a9, layers.dot a6e2fab4, layers.svg e2b7a314, writes.dot 053ef7dd, writes.svg 1994d5f6.
9. Copy at $TMPDIR/r18-refute2 with the report's revised HELP.md Doc text inserted before `## Running it and checking it`:
   - `npx vitest run` over help.test.ts, diagrams.test.ts and routes/docs/diagrams.test.ts: `38 passed`.
   - `npm run build` exit 0. `lsof -iTCP:8792 -sTCP:LISTEN` printed nothing.
   - `npx playwright test tests/browser/workbench/system.spec.ts`: `11 passed (17.9s)`.
   - The whole browser suite was not rerun.
10. Copy: `node bin/revert-check.mjs tests/checks/diagrams/diagrams.test.ts tests/routes/docs/diagrams.test.ts tests/views/system/help.test.ts tests/browser/workbench/system.spec.ts` gave `35 reverts, 0 unproven, 14 unchecked`, every directive `red`. This matches the report.
11. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before and 7015 after every run.

Round-report counts, measured:
- layers.svg is `width="4014pt" height="986pt"`, writes.svg `1788pt` by `1349pt`, channels.svg `462pt` by `1264pt`.
- `grep -c " -> "` gives layers 361, writes 113, channels 71.
- system.spec.ts is 290 lines.
- writes.svg has 0 `<a ` and 103 `<title>.*: `. writes.dot has 103 `tooltip=`, so every tooltip edge carries its names in its title.
- `grep -n "? src" docs/diagrams/*.dot` gives `audit-mute.ts:79 SIGNATURE.test(` and `server.ts:40 import(built)`.
- writes.dot:130-131 draw `writes.ts -> data/sources/config/merge.ts` and `-> settings.ts`.
- All reproduce.

Spec

- bin/diagrams.mjs:10-15 claims more than the code does (ruling 2). The head comment says "every import, publish, read or call a reader cannot follow, is drawn with its file and line ... A diagram never hides what its reader met and did not understand." A scratchpad probe of the exported readers shows each of these is dropped with no edge and no "not placed" entry:
  - Layers: `import(\`./x/${a}\`)`, because line 256's pattern `(?!['"\`])` excludes a template literal and IMPORT reads only `'` and `"`.
  - Layers: `import.meta.glob('...')`. This occurs in the tree at src/routes/views.ts:33 (`export const viewModules = import.meta.glob('$lib/views/**/*.svelte', ...)`). The committed layers.dot has no entry for it; `"routes" -> "views"` exists only through the type import at views.ts:5.
  - Channels: `switch (channel) { case 'old': }` and `channel === NAME`. Line 338 reads only `channel === '<literal>'`.
  - Writes, `export * from './old.ts'` in a barrel: importsOf's pattern (bin/diagrams.mjs:507) has no `export *` form. The trace draws `writes.ts -> all.ts` and stops, so the writer and the disk are lost and the barrel lands in "reached, writes nothing".
  - Writes: `import * as fs from 'node:fs'; fs.writeFileSync(...)` and `import fs from 'node:fs'; fs.writeFileSync(...)`. The fs set gets `fs=*` or `fs=fs`, and METHOD finds `fs` in neither spaces nor names, so no disk edge and no entry.
  - Writes: a call through a parameter or a local alias (`function handleWrite(save) { save(); }`, `const save = pick(kind); save();`).
  - Only the glob is in the tree today. The rule the round was sent to close still does not hold.
- The HELP.md Doc text sentence "What a diagram's reader meets and cannot place or follow (a module no layer row names, an import, a publish or a read whose target is not written out, ...) is drawn with its file and line in a dashed group named "not placed"" is false in two ways (ruling 11):
  - It is false for a template-literal import and for a `channel === NAME` read, per the probe above.
  - It is false for "a module no layer row names": that is drawn as a bare folder node (`"assets";`, `"highlight-languages.d.ts";` at layers.dot:95-96) with no file and line.
  - The DESIGN.md item 4 text repeats the same sentence.

Proof

- src/lib/views/system/help/Diagram.svelte:55 `$effect(() => ask(load(name)));` (ruling 3). In the copy I replaced it with `$effect(() => { ask(load(name)); });`, which drops the cleanup newestAnswer returns, then rebuilt. `npx playwright test tests/browser/workbench/system.spec.ts` gave `11 passed`, and help.test.ts gave `16 passed`. The wiring that makes the after-close and superseded guards take effect in the component can be dropped with every check green. The two newest.ts cases prove newestAnswer alone. The report's "Remaining notes" says this, but the spec's "in flight, after close, and superseded" is still unproven for the component.
- Two lost paths added this round have no case:
  - bin/diagrams.mjs:387 `if (builds.length === 0) lost.push({ at: match.index, what: match[0] });`, a `.listen(`/`.subscribe(` with no naming function.
  - bin/diagrams.mjs:394 `else if (part.trim() !== '')`, a non-literal `connect([...])` entry.
  - In the copy, with both conditions set to `false`, diagrams.test.ts and help.test.ts gave `32 passed`. The report lists both under ruling 2 but names cases only for the import, the publish, `message(which)` and `HANDLERS[kind]()`.
- The METHOD-on-imported-value lost branch (bin/diagrams.mjs:598-602) has no dedicated case. Only the byte-for-byte stale case reaches it, through audit-mute.ts:79 in the committed writes.dot.
- tests/browser/workbench/system.spec.ts:129 uses one directive `revert: src/lib/ui/html.ts:260 => export const GRAPH_TAGS = ['svg', 'style', 'g', 'polygon', ...]`. It adds `style` and removes `title` at once, so it shows that one of the two assertions (titles hold `logChanges`; `svg style` count 0) is live, but not that each one is.
- tests/views/system/help.test.ts names the two newestAnswer cases "audits that ...". Both are red under `newest.ts:17 => take(answer);`, so they are proofs of the helper and not audits in the spec's sense. The name undersells them for newest.ts and oversells nothing, but it muddles the audit vocabulary.

Standards

- R18-report.md, repair round item 3: "I also wrote a browser case that renamed a figure while its answer was out. It stayed green under the guard revert, so it proved nothing, and I removed it." This narrates a wrong turn taken and backed out, which the spec's report rule forbids. The end-state fact (the browser cannot reach the superseded path, because docs.svelte.ts:140-141 remounts every figure) can stand without it.
- The rest of the delta has no history in comments, no non-ASCII and no comment past column 100.
  - newest.ts opens with a layer head comment (`// Layer 3, view helper.`), as manual.ts does.
  - html.ts's `drawingProfile` removes the repetition the first review named, and no list was widened: GRAPH_TAGS and GRAPH_ATTR are unchanged apart from comments.

Behaviour

- The standalone grey (ruling 9) is wrong for an `.svg` opened on its own under a dark scheme.
  - In Chrome (playwright, `channel: 'chrome'`, `colorScheme: 'dark'`), `file://.../docs/diagrams/writes.svg` computes `color: rgb(204, 204, 204)` with `backgroundColor: rgba(0, 0, 0, 0)`.
  - The screenshot shows light grey lines on a white canvas: Chrome draws a standalone SVG document on white whatever the scheme, and the file declares no `color-scheme` and no background.
  - So the report's reader-visible change ("a .svg opened on its own draws ... light grey on a dark one") and the HELP.md Doc text sentence "Opened on its own, outside oculus, each .svg draws in a grey of its own: dark on a light background, light on a dark one" do not describe what a dark-mode Chrome user sees: #cccccc on white.
  - Under a light scheme it is #333333 on white, which is readable.
- Route (ruling 5): `diagramPath` builds the folder as `join(realpathSync(engine), DIAGRAM_DIR)` and compares `dirname(real)` against it (src/lib/server/content/diagrams.ts:45-47). A link at `docs/` or at `docs/diagrams/` is refused. The new case at tests/routes/docs/diagrams.test.ts:80-93 covers both and is red under its directive (revert-check). No finding.
- Edge titles (ruling 8): no `<a `, no `xlink:title` and no `loading=` in any diagram file or in the help view folder (grep). The browser case finds `logChanges` in a `g.edge > title` after the filter. No finding.
- The `<style>` and the filter (ruling 9): each `.svg` opens with the style line (layers.svg:3). GRAPH_TAGS has no `style`, and the browser case asserts `svg style` count 0 in the Help view (passes in the copy). No finding beyond the dark-scheme one above.

Not checked

- The whole browser suite with the Doc text applied. Only system.spec.ts was run.
- The Help view in Axel's Chrome on the TEST page.
- How an `.svg` renders as an `<img>` inside a Markdown viewer's dark theme (for example GitHub), where `prefers-color-scheme` inside the image may follow the OS and not the page.
- Whether DOMPurify leaves the removed `<style>`'s text as a stray text node. The browser case checks the element count only; `style` is in DOMPurify's default FORBID_CONTENTS, so I expect not, but this is not verified.
- Over-drawing by the "refers" pattern (bin/diagrams.mjs:584), which also matches an imported name inside a string literal or a type position. Not probed against the tree.
- The package-lock.json entries.

Usage: not measured. The session ran one full unit suite; check, build, format, lint and the ASCII, size and folder gates; two generator runs; one scratch copy with one build, one system.spec run and one revert-check over four files (4m04s); one rebuild and system.spec run under the cleanup-drop revert; two targeted vitest runs under the lost-path reverts; one Chrome standalone-SVG look; and scratchpad probes. The scratch copy is removed.

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/R18-report.md`, "# Repair round 1") unless named otherwise:

- Spec, the write diagram cutting placed modules: every module the trace reaches is drawn, the ones with no path to the disk in the dashed group "reached, writes nothing"; red under its revert.
- Spec, readers skipping what they cannot follow: a publish, a `message(...)`, a listen or subscribe with no naming function, a connect entry, a computed-member call and a method call on an imported value whose target is not written out are named with file and line under "not placed"; the dispatch table is followed to its writer.
- Spec, the widened paths: each needed by the mechanism, as the review found; kept.
- Proof, the Diagram guard: moved into `views/system/help/newest.ts`, whose two cases are red under `newest.ts:17 => take(answer);`.
- Proof, the manual gate on a regex: it renders through `renderManual`, and an image in a code block counts for nothing, red under its revert.
- Proof, a linked docs folder served: refused, red under its revert.
- Proof, the stale test stopping at one file: `staleFiles` names every one, and a source change turns it red.
- Standards, the two SVG profiles repeating each other: one `drawingProfile` builds both.
- Behaviour, the edge names lost in the Help view: each edge's `<title>` carries its function names; the Help browser case finds them after the filter.
- Behaviour, black on transparent outside oculus: each file carries its own colours in a `<style>` the graph filter drops.
- The report's counts: measured in the round.

The run over repair round 1, closed at landing on 2026-09-23:

- Spec, the readers still dropping what they cannot follow: `import.meta.glob` (in the tree at `src/routes/views.ts:33`) now draws its layer edge; a template-literal import, a non-literal `channel ===` comparison, a non-literal `case` under `switch (channel)` (a literal case is read), and a whole-module `export * from` are named with file and line under "not placed"; a write through a namespace or default import of `node:fs` reaches the disk. A call through a parameter or a local alias is not followed, and the head comment of `bin/diagrams.mjs` and the Doc text say so. Nine new cases in `tests/checks/diagrams/diagrams.test.ts`; `node bin/revert-check.mjs tests/checks/diagrams/diagrams.test.ts`: 25 reverts, 0 unproven, 0 unchecked.
- Spec and Standards, the Doc text sentence that claimed more than the code: HELP.md and DESIGN.md now list exactly what is named, say a module no layer row places is drawn in the "not placed" group, and state the alias limit.
- Proof, the two lost paths with no case (a listen with no naming function, a non-literal connect entry) and the method-call branch: each has a case, red under its revert.
- Proof, the one directive changing two things: split into two directives, one per assertion, each red.
- Proof, the Diagram wiring (`$effect(() => ask(load(name)))`) that can lose its cleanup unseen: not covered by a case. The node tests render components on the server, where effects do not run, and in the running app the two paths the cleanup guards cannot be observed: a changed manual remounts every figure (`docs.svelte.ts:140-141`), so a mounted Diagram never changes its name, and an answer landing after close changes nothing a page can see. `newestAnswer` itself is proven by its two cases.
- Proof, the newest-answer cases named "audits that": not a defect here. `tests/checks/tree/audits.test.ts` requires every case under `tests/views/` that never renders a component to carry that name, and renaming them turns that check red.
- Standards, the round's report narrating a removed browser case: a record in the ledger, no change to the tree.
- Behaviour, light grey on Chrome's white canvas under a dark scheme: the file's dark rule also sets a dark ground (`background: #1e1e1e`); the standalone colour case matches the new rule. The standalone file under a dark scheme was not looked at again after the change.
