# Step O76 refuter report (on .agents/worktrees/migration-O76, base 006e4f24)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base 006e4f24      (worktree root)
test:quick: 9 changed file(s), from git since 006e4f24
test:quick: 0 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (7.7 s): 1792927861301 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (19.8 s)
test:quick: 22.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
(npm run diagrams left docs/diagrams unchanged: shasum of all 18 files before and after, diff prints nothing)

$ npm run test:quick      (the report's form, no --base)
exit 0
test:quick: 0 test file(s)
ok      svelte-check (7.9 s): 1792927891058 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 11.2 s; every command passed

$ sh utils/unused-exports.sh > <scratchpad>/o76-unused.txt; diff ../O76-base/unused-exports.txt <scratchpad>/o76-unused.txt
script exit 0
diff exit 0 (prints nothing); 343 lines in both

Verify 3 (prose read of each changed sentence): read by the reviewer; see "Declined to judge" for the ruled words.

Commands the builder's report quotes, rerun:
$ npx vitest run tests/checks/source/keys.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  10 passed (10)
$ LC_ALL=C grep -n '[^ -~]' config/text/views/structure/pillars.yml src/lib/views/structure/pillars/*.svelte .scratch/migration/agents/reviews/O76-report.md
(nothing; exit 1)
$ grep -n "if !muted\|<Tooltip\|</Tooltip>" src/lib/views/structure/pillars/LineCard.svelte
76:        {#if !muted}
77:            <Tooltip text={t('pillars.counts_tip')} focusable>
88:            </Tooltip>
$ git diff 006e4f24 -- config src | grep '^+[^+]' | grep -i -E "\bbefore\b|used to|no longer|\bstill\b|always has been|always had|as before|previously|the step adds|after this package|\bO[0-9]+\b|\bZ[0-9]+\b|20[0-9][0-9]-"
(nothing; exit 1)
$ grep -rn --exclude=local.yml -i "untagged\|method tag\|pillar membership\|maps to a pillar\|promotion trigger\|portfolio-fit\|counts_tip\|collapsible category" src tests config docs README.md utils
hits only in relay-route.ts, relay-join.ts, search.svelte.ts (unrelated identifiers), LineCard.svelte:77, OrphansCard.svelte:31, map.yml:17, pillars.yml:6 and :21; same as the report
$ grep -rln "LineCard\|OrphansCard\|ArchivalCard\|structure/pillars/Pillars" tests
(nothing; exit 1)
Brief premises rechecked: grep -n "skip_tiers\|research_audit\|^stages\|^categories" ~/workspace/research-hub/.oculus/config.yml prints nothing; grep -rn "pillars.orphans_blurb\|pillars.intro\|archival_blurb\|offpillar_note" tests prints nothing; git show 006e4f24: of pillars.yml, LineCard.svelte (151 lines, .metrics at :74-84, style comment at :105) and OrphansCard.svelte (:2-3, tag at :30) match the brief.
Ruled words compared exactly (python yaml.safe_load of pillars.yml against the brief's strings): intro True, counts_tip True, orphans_blurb True, archival_blurb True, no_orphans_blurb True, untagged True, offpillar_note ends with the ruled sentence True; the file parses.
docs/adr: "No such file or directory" (worktree and main checkout).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `pillars.intro` equals the ruled sentence exactly (pillars.yml:8), drawn at Pillars.svelte:85.
- 2: holds, `pillars.counts_tip` equals the ruled words as a single-quoted scalar (pillars.yml:6); the counts row is wrapped in `<Tooltip text={t('pillars.counts_tip')} focusable>` inside `{#if !muted}` (LineCard.svelte:76-89), as VenueCard.svelte:208 does.
- 3: holds, `orphans_blurb` equals the ruled words (pillars.yml:15).
- 4: holds, `archival_blurb` equals the ruled words (pillars.yml:5).
- 5: holds, `offpillar_note` keeps its sentence and ends with "Off-pillar lines carry no in-flight or venue-tier counts." (pillars.yml:13); RegistryCard.svelte is not in the diff, so the "<n> projects" tag (RegistryCard.svelte:79) stays.
- 6: holds, `no_orphans_blurb`, `untagged` and `provisional_note` as the brief gives them (pillars.yml:10, :21, :19); OrphansCard.svelte:2-4 and LineCard.svelte:109-111 rewritten and true against lines.ts:110-122 and :152-160; ArchivalCard.svelte:2-4 made true against its toggle at :46-53; the key identifier is Spec finding 1.

Cases of the brief's "Cases":

- 1 (intro): met, the exact compare above; the on-screen read is the look on landing.
- 2 (tip on pointer and keyboard; none on an off-pillar card): met by reading, the row of every non-muted card (pillar, provisional, 0 in flight) is inside the Tooltip at LineCard.svelte:77-88, the wrapper takes tabindex 0 and the description (Tooltip.svelte:259, tooltip-rules.ts describedControl), and a muted card draws neither (LineCard.svelte:76, Pillars.svelte:163); the bubble's showing is the look's.
- 3 (Orphans note, and the sentence with none): met, OrphansCard.svelte:21-23 picks `orphans_blurb` or `no_orphans_blurb`, both as ruled.
- 4 (Archival note): met, ArchivalCard.svelte:44 draws `archival_blurb`, as ruled.
- 5 (Off-pillar note; "<n> projects" tag kept, no in-flight or tier row): met, pillars.yml:13, RegistryCard.svelte:79 unchanged, LineCard.svelte:76.
- 6 (each sentence true against lines.ts, LineCard, RegistryCard): met under oculus's own vocabulary, inFlight keeps `live` stages (lines.ts:70-78, vocab.yml:67-73), tierStrip counts over inFlight (lines.ts:96), orphans leaves out skip_tiers ([personal], vocab.yml:203) and the archival category through realProjects (venues.ts:37-47, lines.ts:117-120), archival groups the dead-ends row (vocab.yml:225) by failed and stopped (vocab.yml:76-77), and no earlier categories row holds a dead stage (vocab.yml:219-224); the looseness of two ruled phrasings is under "Declined to judge".
- 7 (Orphans tag "<n> on no line"): met, OrphansCard.svelte:31 draws `t('pillars.untagged', projects.length)`, which reads '{0} on no line'.

## 1. Spec

- config/text/views/structure/pillars.yml:21 and src/lib/views/structure/pillars/OrphansCard.svelte:31: "untagged: '{0} on no line'" and "<Tag label={t('pillars.untagged', projects.length)} />"; what is wrong: the words now say "on no line", but the catalog key the code reads keeps the name `untagged`, which still says an orphan is a project with no `pillars:` tag, the premise item 6 and ruling Z998 exist to remove; item 6 asks that every key of pillars.yml the code makes false be made true, and the builder left the rename as its judgment 1 because OrphansCard.svelte is on the write list for a comment only; failure scenario: a maintainer reading OrphansCard.svelte or grepping the catalog for the Orphans tag meets `pillars.untagged`, takes an orphan to be an untagged project, and writes code or a help line that counts only projects with no `pillars:` key, missing those whose `pillars:` names no line of the file; verdict: none (item 6's words and comments hold; this is the key's name). A rename is two lines (pillars.yml:21 and OrphansCard.svelte:31) and keys.test.ts catches a key left without a reader.

## 2. Proof

none

## 3. Standards

- .scratch/migration/agents/reviews/O76-report.md (whole report): the new key `pillars.counts_tip` is not reported as checked; what is wrong: spec.md "What every package obeys", the rule "Every id or key a step introduces is checked empty, duplicated, and colliding with a configured or reserved key ... The report states what the code does in each case", and the report has no such statement for `pillars.counts_tip`; the reviewer's `grep -rn --exclude=local.yml "counts_tip" config src tests` finds it once in pillars.yml:6 and once read at LineCard.svelte:77, so the code is right and only the report lacks the row; failure scenario: the orchestrator reading the report at landing has no record that the key was checked against a duplicate in the `pillars` group, which the catalog rule "a catalog group lives in exactly one file" makes a real risk for a new key; verdict: none.

## 4. Behaviour

- src/lib/views/structure/pillars/LineCard.svelte:77: "<Tooltip text={t('pillars.counts_tip')} focusable>"; what is wrong: the wrapper is a span with tabindex 0 (Tooltip.svelte:259), so a mouse press on the counts row now moves the focus into the card, where before the row held nothing focusable; while that focus stays, `.card:focus-within` (Card.svelte:127-133) keeps the card's Edit in File and Delete actions drawn and, on a dormant line, `.dormant:focus-within` (LineCard.svelte:118-123) keeps the card at full strength after the pointer leaves, until the focus moves elsewhere; the press shows no focus ring and no bubble, since the wrapper opens words only on `:focus-visible`. The report's "Before and after" names the new keyboard tab stop but not this effect of a press; failure scenario: on the Pillars view, press the "<n> in flight" row of a dormant pillar card and move the pointer away: the card stays unfaded with its Edit in File and Delete buttons showing, which a reader takes for a card that is still hovered or selected; the look on landing settles whether it shows as read; verdict: none.

## Declined to judge

- What only the look can settle: the bubble after about 150 ms on the pointer's rest and on keyboard focus, the focus ring, the row's height and the gap to the goal paragraph now that the block `div.metrics` sits inside the Tooltip's inline-flex span (the only Tooltip in `src` that wraps a `div`, by `grep -rn -A1 "<Tooltip" src`), the pointer area shrunk to the counts' width, and Behaviour finding 1; no server or app may be started by the reviewer.
- Whether a block `div` inside the wrapper's `span` is acceptable markup: no standard of the repository names the HTML content model, and svelte-check reports 0 warnings.
- How a screen reader announces a focusable span with no role and a description: needs a screen reader on a page.
- The ruled words read loosely against the code: the intro's "a project is on a line when its manifest's pillars: names it" is not true of a dead-end that names a line (lineMembers goes through realProjects, lines.ts:64), an exception only the Archival note states; `counts_tip`'s "venue tiers: the venues of those projects" describes tier chips that count in-flight projects by their venue's tier, with a project with no venue or an unrated one under the fallback tier (lines.ts:93-98). Both are Axel's words, ruled verbatim (ruling 349 (b)); a change is his decision.
- The sentences of items 3, 4 and 6 name oculus's own vocabulary (personal, dead-ends, failed or stopped); a hub that overrides `research_audit.skip_tiers`, the `dead` stages or the `dead-ends` row would make them false on its screen. The hub's config overrides none of them today (grep above prints nothing); whether that limitation is acceptable is the brief's recorded choice.
- Whether docs/HELP.md's Pillars row (HELP.md:214) should name the new tip, as HELP.md:52 and :317 name other tooltips: the file is outside the write list and the builder's judgment 5 says no; the orchestrator's call.
- The report's "Open items of the state file, verbatim" quotes 364 as open; the state file now lists 364 under "## Closed items", written after the report, so what the file held when the report was written cannot be read with the reviewer's three git commands.
- The report's claim that the verify list ran once and no whole-suite command ran: not checkable from the tree; the builder's transcript would settle it.
- The four docs/diagrams files outside the write list: written by `npm run diagrams`, the command the brief runs; their counts (views/structure to ui 31 to 32, views to ui 1041 to 1042) follow from the one new import, and the reviewer's rerun leaves them byte-identical.

Reviewer usage: a55bd13713108565c, claude-opus-5-5, 188617 tokens, 54 tool uses, 8 min 33 s.
