Brief check of O164 (a card's links open their page), read on oculus main at f7a6f17fa (`git log --oneline -3`). Nothing was changed or written.

Summary: the brief is not ready to dispatch. Four findings stop it as written:
- C-1: CardLinks and CardFacts cannot import rows.ts, so the shared function has to move, and the write list lacks the paths that move touches.
- C-2 and C-3: the brief leaves out two tags on the project card that name an entry: Disseminated in and the domain tag.
- C-4: the Venue press, as briefed, either loses the tier glyph's colour, tip and wrap, or puts a focusable element inside a button.
- C-5: item 3 dictates a markup form that contradicts itself.
The other findings are wording, or cases that cannot be checked on the real workspace.

## Names

C-1. The Focus board's functions cannot be called from the card. Place: brief items 1 and 2, and "Paths this step writes".
- Evidence: `tests/checks/tree/boundaries.test.ts:28-36`. A view may import only its own folder `views/<group>/<name>/**` and `views/shared/**`. The views row of `tests/checks/tree/layer-rows.ts:293-303` allows `ui/**`, `state/**` and `views/shared/**`. The test's own synthetic case refuses exactly this kind of import (`boundaries.test.ts:452`: "views/shared/Card.svelte imports views/boards/projects/Card.svelte").
- So `src/lib/views/shared/card/project/CardLinks.svelte` and `CardFacts.svelte` cannot import `src/lib/views/boards/focus/rows.ts`. The brief's first option ("`rows.ts` `entryPage`") is impossible. The move to a shared module is required, not optional.
- The write list names no target module. It also misses every importer whose import line changes:
  - `git grep -n -w entryPage` hits `src/lib/views/boards/focus/Band.svelte:9,44,103` (line 9 is a head comment naming "views/boards/focus/rows.ts `entryPage`", which the move makes false) and `src/lib/views/boards/focus/Focus.svelte:65,218`.
  - `git grep -n -w venuePage` and `-w pageLookup` hit `src/lib/views/boards/focus/CommandCenter.svelte:43,45,258`.
  - The types `EntryPage` and `PageLookup` (`rows.ts:346,352`) move with them.
- Close:
  - State that the move is required.
  - Name the module. `src/lib/state/forms/page-entry.ts` is the natural home: it already holds `pageView` and `writtenPage`, and the state row allows its imports.
  - Add that module, `Band.svelte`, `Focus.svelte` and `CommandCenter.svelte` to the write list.
  - Say the importers switch their import, with no re-export left in rows.ts.

C-2. `goto` has a second caller, and that caller has the same defect as the Funding tag. Place: item 5, and the "Callers and docs" premise.
- Evidence: `git grep -n -w goto -- src` hits `src/lib/views/shared/card/project/CardDetails.svelte:16,105`: `onclick={() => goto(client, entry.collection, entry.title)}`, on each "Disseminated in" tag. Those tags are drawn on the project page's card (`ProjectCard.svelte:385`, the `details` snippet).
- That press opens the whole collection view with a label. This is the defect the ruling names for Funding, and it is a tag on a project card that names an entry. `Dissemination` is `{ collection, id, title }` with the entry's internal id (`src/lib/state/boards/board/stats.ts:82,112`), so `pageView(collection, id, title)` gives its page directly.
- The premise checked callers for `linkView` only. As written, item 5 removes `linkView` and keeps `goto`, and this defect stays.
- Close: add an item for the Disseminated in tags opening their entry's page. Add `CardDetails.svelte` to the write list. Then `goto` loses its last caller and goes under item 5.

C-3. The domain tag is not in the brief. Place: what to build.
- Evidence: `src/lib/views/shared/card/project/ProjectCard.svelte:344-346` draws `<Tag label={item.domain.label} tone={item.domain.tone} />` with no press. `item.domain.id` is the project's first `domainIds` entry, an internal id (`items.ts:150-153`).
- `domains` is a registry word (`model-collections.ts:12-24`), and the entry view draws a domain's page (`RegistryPageCard.svelte:5`, DomainCard). The ruling's "and such", and the goal "every tag and fact on a project card", cover it.
- The card's other facts name no entry: the lane, form, chips, year, code, reproduced, deadline, stale and the Lead badge.
- Close: add the domain tag (registry `domains`) to item 1 and `ProjectCard.svelte` to the write list, or state in the brief why it is outside.

Other names, no finding:
- `linkView`: hits only `card.ts:89` and `CardLinks.svelte:40,171`, all in the write list.
- `press`: local to `CardLinks.svelte:158`.
- The HELP sentence's subject: the tag lines of `docs/HELP.md:299` (see C-9).
- The other `goto` hits are a glyph name, the palette's `:goto`, the editor's `goto` command and `oculus.goto`, none of them this function. Changing `card.ts` makes none of them false.

## The step line

Step line `plan.md:1712`, mapped to the brief's items:
- "each Funding, Pillar, Datasets and Venue tag (CardLinks.svelte)": items 1 and 2.
- "each compute tag of the card's facts (CardFacts.svelte:121-124)": item 3.
- "opens the page of the entry it names, as a Team tag opens its person and as the Focus board opens an entry (entryPage, venuePage)": items 1 to 3. Decision 3 (current pane) matches Team.
- "a Funding tag opens its scheme's page, not the whole funding collection": item 1, last sentence.
- "built by a builder agent": the brief.
- Items 4 to 6 go beyond the step line, which is acceptable.
- The ruling (`plan.md:3613`) says "and such". The brief has no requirement for the domain tag or the Disseminated in tags (C-2, C-3).

## Premises

Each premise was rerun on the tree. Results:
- Ruling text at `plan.md:3613`: holds verbatim.
- `CardLinks.svelte`: 261 lines (`wc -l`); kinds at `:90-143`; `press` at `:158-174`; plain `Tag` at `:186-194`. All hold.
- `card.ts`: 236 lines. `linkView` at `:89-93` and `goto` at `:120-124` both hold. The body of `goto` opens `view` with `{ label }` only (`card.ts:120-124`): holds.
- `CardFacts.svelte`: 151 lines. Compute at `:121-125` holds.
- `items.ts`: compute at `:173-178` `{ id, label, kind, order }`, ids at `:162-164`, venue at `:153-161`. All hold.
- `rows.ts`: `entryPage` is `:376-387` (the brief says 376-386), `venuePage` is `:393-398` (the brief says 392, the end of its doc comment), and `pageLookup` is `:360-366`. These are trivial offsets.
- `page-entry.ts:137-146` (`pageView`) and `Collection.svelte:248` both hold.
- Registry words at `model-collections.ts:12-24`: hold.
- Folder `src/lib/views/shared/card/project/` holds 7 items (`ls`): holds.
- `grep -n -i "funding tag\|tag opens" docs/HELP.md` prints only `:427`, about a note's `#word` tag, not cards: holds.
- `docs/HELP.md:307` is "A project's team.": holds.
- `guarded.md` line 3, "Views have no entry": holds.
- The verification page is the state file (`.agents/plan.yaml:4`, `orchestrator-state.md:850`): holds.

Form of the ids:
- Every id is an internal `<hub>:<key>` of the hub that holds the record. Funding, pillar, dataset and resource ids are resolved at merge (`src/lib/data/snapshot/hubs/merge.ts:145-152`, through `resolveKey` at `hub-names.ts:532-541`, own hub first, then a unique other hub, built with `hubId`). `item.venue.id` is `venue.id`, internal too (`merge.ts:138`).
- `entryPage(key, root, id, collections)` takes the id as it is when `root` is the id's own hub, because it strips the prefix with `bareId({ id, root })` (`rows.ts:383`). With any other root it finds nothing (see C-6).
- `venuePage(id, lookup)` takes `item.venue.id` as it is: it looks the id up in `entities.venues`, keyed by internal id, and reads the hub from `rootOf(venue)`.

Collections:
- Only `~/workspace/research-hub/.oculus/config.yml` exists among the workspace's folders. The loop over the nine folders of `.oculus/workspaces/research-hub.yml` printed "no .oculus/config.yml" for the other eight.
- That hub names no `collections:` and uses oculus's own list in `config/defaults/sources.yml:37-52`: `data` (datasets), `venues`, `pillars`, `domains`, `resources` and `funding`, each with its `registry:` word.
- The six files exist (`ls -la .oculus/data/...`).
- Every listed file becomes a collection with its entries (`src/lib/data/sources/collections.ts:190-216`, `normalise.ts:679`). So `registryKey` gives `funding`, `pillars`, `data`, `resources`, `venues` and `domains`.

The entry page:
- `Entry.svelte:302-335` draws an entry of any collection. A venue, dataset, domain or pillar gets `RegistryPageCard` (`RegistryPageCard.svelte:2-7`). A funding scheme or a resource gets `EntryCard`.
- So a page opens for a pillar, a dataset, a funding scheme and a resource: holds.

HELP item 6:
- `grep -n "Waiting on\|Datasets" docs/HELP.md` finds `:299` ("A project card."). That bullet lists the top-row facts and the lines "Funding, Pillars, Datasets, Team, Related ... and Venue". So the bullet exists: holds.

Not yet created (expected before the worktree is made):
- `.agents/worktrees/O164-base` and `.agents/worktrees/migration-O164` (`ls`: "No such file or directory").

## Cases and checks

Read against `spec.md`:
- C1 to C10 are checked by reading and by the look. That is consistent with `spec.md:65,67` (a builder runs no page) and with `spec.md:60` (no new test without a guarded entry). The one line `spec.md:69` asks for is in the report shape.
- C10 asks about `ProjectCards.svelte`, which the step does not change. It draws the same `ProjectCard` (`ProjectCards.svelte:9,65`), so the case reads the changed component: holds.
- C8 asks about kinds the step leaves unchanged: holds as a guard.
- Verify item 2 (size test plus the tests naming changed files) and verify item 5 (unused-exports against the base) match `spec.md:26,89`.
- The boundary test runs in `npm run test:quick` (`tests/tiers/quick.mjs:46-47`, SCANNERS takes `tests/checks/tree/`). So C-1 would show as a red line, not a silent pass.

C-4. The Venue tag cannot be pressed without a decision the brief does not make. Place: item 2, C4 and C9.
- Evidence: the pressed branch draws `<Tag label glyph tone />` only (`CardLinks.svelte:196-205`), dropping the `wrap`, `glyphTone` and `glyphTip` the venue kind sets (`:139-141`). Forwarding them puts the tier glyph's `<span tabindex="0" role="img">` and its Tooltip (`src/lib/ui/controls/Tag.svelte:65-71`) inside the ToolButton's `<button>` (`ToolButton.svelte:68`). That is a focusable element nested in a button: two tab stops, one inside the other.
- `docs/HELP.md:299` says the tier icon "takes a tab stop of its own".
- This is a user-visible shape (tab stops, accessible name, tier colour, wrapping), so `spec.md:18` requires the brief to name it.
- Close: dictate the form. My judgment is that the best option keeps the tier glyph, with its tip and stop, outside the button, beside a pressed tag of the venue's words that keeps `wrap`. The other option is a pressed tag that carries the tier words in its title or accessible name and loses the glyph's own stop. Then say which HELP:299 sentence changes.

C-5. Item 3's markup is self-contradictory. Place: item 3.
- Evidence: the folder fact is not inside a Tooltip. It is `<span class="folder"><ToolButton plain label title={folder.path} ...>` (`CardFacts.svelte:126-131`), and ToolButton draws its own Tooltip from `title` (`ToolButton.svelte:53,62-67`). "ToolButton plain around the Tag, inside its Tooltip" therefore makes two nested tooltips on one fact.
- The head comment `CardFacts.svelte:16-19` says the wrappers "take no tab stop, so a card gains no stops before its controls". Pressable compute facts make that sentence false.
- Close:
  - Dictate a `ToolButton plain` whose `title` is `t('project.card.compute_tip', resource.label)`, with no outer Tooltip, in a box styled as `.folder` without the monospace face.
  - Name `:16-19` as a sentence to rewrite.
  - Add `CardFacts.svelte`'s style block to item 3.

## The question

For each case and item: could it pass without the goal being reached?
- C1, C2, C3: no, provided the look names the entry page's title. C1 already says "named by its title".
- C4: yes. A press can open the venue page while the tier glyph loses its colour, tip and stop, or nests a stop inside the button (C-4). Add "the tier glyph keeps its colour and tip; one tab stop per tag" to C4 and C9.
- C5: yes. "Its tooltip shows as today" passes with two nested tooltips (C-5). Add "one tip".
- C6 and item 4: yes, vacuously.

C-7. C6's input does not occur in the data. Place: C6 and item 4.
- Evidence: merge drops a key that resolves to no record (`merge.ts:129-131` `idsOf`, "a key that resolves to none drops"). So `item.funding`, `pillars`, `datasets` and `compute` never hold an id without a held entity, and that entity was read from the same registry file the collection is.
- Close: say C6 is checked by reading the code path that returns null, and is not a look case.

C-8. C7 cannot be shown at the look on this workspace. Place: C7.
- Evidence: the workspace has one hub (see Premises). None of the eight non-hub folders' `.oculus/project.yml` names `funding:`, `pillars:`, `datasets:`, `venue`, `compute:` or `domain:` (the grep loop printed only the file names).
- Close: say C7 is read in the code, or name a scratch workspace with a second hub for the look.

The remaining items:
- C7 by reading: could pass with the project's hub used in place of the id's hub (C-6).
- C8, C9 (apart from C-4) and C10: no.
- Item 5: passes with `goto` kept while the Disseminated in defect remains (C-2).
- Item 6: passes while HELP:299's venue sentence becomes false (C-4, C-9).

C-6. The hub rule in item 1 points the builder at the wrong hub. Place: item 1, "the hub being the project's own (`addressOfId(item.id).hub`) unless the id names another".
- Evidence: the id always names its own hub (Premises). `entryPage` finds the entry only when `root` equals that hub (`rows.ts:382-385`). `registryKey` must be asked for that hub too.
- A project of a non-hub workspace folder has the folder's name for its hub (`hub-names.ts:13-15`), which holds no collection. Its references resolve into research-hub.
- The current code makes the same mistake: `CardLinks.svelte:170` asks `registryKey('funding', addressOfId(item.id).hub)`.
- Close: write "the hub is `addressOfId(tag.id).hub`, and the collection key is `registryKey(<word>, that hub)`".

## Implied inputs

- A Venue fact on a Focus lane card. C-10. Place: `src/lib/views/boards/focus/lanes/LaneCard.svelte:153-161,194-199`.
  - The lane card draws the project's venue (short name, whole name in the tip) with no press. It is the Focus board's card of a project, so the goal covers it.
  - Expected under the goal: a press opens the venue's page. LaneCard can import rows.ts, which is its own folder.
  - Close: add it with the path, or state in the brief why it is outside.
- The Map. Expected: unchanged. It draws nodes, not cards; a pillar node opens the Pillars view (`src/lib/views/structure/map/node-view.ts:12`). That is outside the goal and a separate concern, and the brief should say so in one line.
- The Project tab's own card. Expected: the same presses, opening in the current pane as Team does. It is the same `ProjectCard` (`Project.svelte:63,137`). The Person view and Listing draw it through `ProjectCards` (`Person.svelte`, `Listing.svelte:30`).
- A resource of kind other than cluster. Expected: it opens its entry page with `EntryCard`, the same as a cluster. The hub holds kinds cluster, machine and storage (`grep kind: resources.yml`), and 9 manifests name `compute: [this-mac]`.
- A funding id naming a scheme in another hub. Expected: the page in that hub (C-6). It cannot happen on this workspace today (C-8).
- A kind with more than SHOWN (3) tags. Expected: the tags drawn after "more" press the same way (`CardLinks.svelte:181,208-215`).
- The tag's label and the page's label differ. Expected: the tag shows the key (`items.ts:129-130`) and the page tab shows the entry's title, which falls back to the key (`model-collections.ts:190-200`). There is no defect, but the look should expect the title.

## ADRs

None. `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. `git ls-files | grep -i "/adr\|^adr\|decisions/"` prints nothing, and `grep -n -i adr .agents/plan.yaml` prints nothing.

## Dictated text

`grep -n "gets the sentence\|stays as it is\|drawn as the folder fact is\|..." .scratch/migration/agents/briefs/O164.md` finds lines 21, 23, 26, 32 and 36. `LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.
- Line 26, "`docs/HELP.md:307` stays as it is": holds.
- Line 26, the HELP sentence "a Funding, Pillar, Datasets, Venue or compute tag opens the page of its entry": breaks the no-synonym-cycling rule (hub "Writing docs"). C-9.
  - HELP:299 names the lines "Funding, Pillars, Datasets", while the card's label is "Pillar" (`config/text/views/boards/projects.yml:35`). It calls the compute facts "each compute resource", not "compute tag".
  - Close: use the bullet's own names, and fix "Pillars" to the card's label in the same edit.
  - If C-2 and C-3 are taken in, the sentence also names the domain and Disseminated in.
- Line 23, "drawn as the folder fact is (`ToolButton plain` around the `Tag`, inside its `Tooltip`)": breaks `spec.md:53`'s intent of one control and one tip, and contradicts the tree. C-5.
- Line 21, "the hub being the project's own ... unless the id names another": holds as a fact but misleads. C-6.
- Line 25, item 5's title "no longer": the history-word rule (`spec.md:44`) binds code comments and test titles, not a brief heading, so it holds.
- Decisions 1 to 3: hold. Decision 3 matches Team (`CardLinks.svelte:169`).

## Declined to judge

- Whether `openView` in the current pane replaces a project tab or adds a tab beside it on the Project tab's own card. It behaves as Team does today; only the look shows it.
- Whether the Focus lane card's Venue fact (C-10) and the Map are inside the ruling's "on a card". That is the orchestrator's or Axel's reading of the ruling; the brief should state it either way.
- Whether a keyboard Enter on a focused tag also reaches the card's own Enter handling. Team tags share the path today, and only the look on landing settles it.

## Closed

- C-1: item 1 moves `entryPage`, `venuePage`, `pageLookup`, `EntryPage` and `PageLookup` to `src/lib/state/forms/page-entry.ts` (421 lines on main), with `Band.svelte`, `Focus.svelte` and `CommandCenter.svelte` importing from there and no re-export; the paths are in the write list and verify 2 runs the boundary test.
- C-2: item 5 has the Disseminated-in tags open `pageView(collection, id, title)`; `goto` goes under item 8; case C9.
- C-3: item 2 adds the domain tag (registry `domains`, `ProjectCard.svelte:344-346`); case C8. The step line names it, under the ruling's "and such".
- C-4: item 3 keeps the tier glyph outside the button with its colour, tip and stop, beside a pressed tag of the venue words that keeps `wrap`; case C4 asks one tab stop per control; Decision 5.
- C-5: item 4 dictates a `ToolButton plain` with `title={t('project.card.compute_tip', resource.label)}` and no outer `Tooltip`, in a box styled as `.folder` without the monospace face, and the rewrite of `CardFacts.svelte:16-19`; C5 asks one tip.
- C-6: item 2 says the hub is `addressOfId(tag.id).hub` and the key `registryKey(<word>, that hub)`; case C7.
- C-7: C6 is checked by reading the code path that returns null (item 7).
- C-8: C7 is checked by reading.
- C-9: under the ruling "Help redesigned" and `agents/spec.md:72` the step changes no line of `docs/HELP.md`; item 9 has the report name each sentence made false, `docs/HELP.md:299` among them, for the orchestrator to bring to Axel.
- C-10: item 6 adds the Focus lane card's venue (`LaneCard.svelte:153-161,194-199`), named in the step line; case C10. Item 10 puts the Map out of scope in one line.
- Implied inputs: the Project tab's own card (C13), the resource kinds (C5) and a kind past three tags (C14) are cases.

Usage: a7883a6fa8f16f8f4, claude-opus-5-5, 187199 tokens, 71 tool uses, 10.1 min
