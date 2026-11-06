# Brief check: O165, the guides redesigned

Read on main at 2ba2827a3 (`git log --oneline -1` printed `2ba2827a3 Open a card's links on their entry's page`). I changed nothing.

## Names

Command: `grep -rn --exclude=local.yml -e "HELP\.md" -e "data-map\.md" -e "decks\.md" src tests config docs README.md templates utils bin .agents/plan.yaml | grep -v "^docs/HELP.md\|^docs/data-map.md\|^docs/decks.md"`, then the same names grepped in the root files (`grep -n -e "HELP" -e "data-map" -e "decks.md" -e "Data map" -e "Decks guide" CLAUDE.md`), then `grep -rn -i -e "the manual" -e "data map" -e "decks guide" ...` over src, tests, config, the other docs and README.md, then a loop over every heading of the three pages grepped with `grep -rn -F "<heading>"`.

Hits outside "Paths this step writes":

- **`CLAUDE.md:5`** (tracked; `git ls-files CLAUDE.md` printed `CLAUDE.md`; `AGENTS.md` is a symlink to it): "For orientation read `README.md` (how to run and check oculus) and `docs/HELP.md` (what each view, setting and file does, as a user meets it)." **The rewrite can make this false.** It describes the same scope as `README.md:95` ("every view, key, setting and file"), which item 5 rewrites because ruling 711 narrows it. The brief does not list this line. The builder cannot fix it, because `agents/spec.md:9` forbids reading the instruction file. It has to be fixed by the orchestrator at landing, or named in the brief as the orchestrator's change.
- `src/lib/views/shared/prose/doc-link.ts:3` (`docs/HELP.md#the-keys`, an example in a comment). It stays true as long as decision 1 keeps the heading "The keys".
- `src/lib/views/system/help/Help.svelte:18`, `:20` ("pages of prose about the whole tool"), `:23`, `:26` ("The manual holds no diagram"), `:30-33`. These stay true unless the builder adds a diagram to Help, which nothing in the brief asks for.
- `src/lib/views/system/help/keys/Keys.svelte:3` ("after the manual"). Stays true.
- `src/lib/server/content/docs.ts:17`, `:37`, `:667`, `:805`, `:825`, and the "manual" comments in `src/lib/state/system/docs.svelte.ts`, `src/lib/views/sources/doc/Doc.svelte` and `src/lib/views/shared/prose/Markdown.svelte`. These name the path or the route, not the content. They stay true.
- `tests/checks/source/history.test.ts:4-5`. Its comment names only HELP.md, README.md and apps.md, but its code (`:24-26`, `:132-141`) reads every `docs/*.md`. The rewrite does not make this false. It is an existing gap between the comment and the code, and this step does not change that file.
- `tests/views/shared/prose/doc-link.test.ts:17,30,60,74,80,122` and `tests/routes/docs/docs.test.ts:28-29,74,157`: synthetic fixtures. They stay true.
- `config/defaults/layout.yml:143,145` (tab labels "Data map" and "Decks guide") and `tests/state/workbench/layout/saved/layout-given.test.ts:44,46,203-204,236,296,340,359`: tab names only. They stay true.
- `README.md:44` ("read the manual, the keyboard shortcuts, ... the data map, ... and the Decks guide"). Stays true.
- Heading citations: the only file that cites a heading of the pages is `return-place.ts:3` ("Pages and the pane tree"), which is in the write list. The other heading hits are generic phrases ("The title bar", "The primary hub's", "The keys of ..."), not citations.

These lines are inside the write list but item 3 is likely to make them false: `README.md:99` ("every key of `present.yml` and every slide kind, each with an example") and `docs/templates.md:1924` ("gives every key and every slide kind, each with an example"). Item 3 gives keys "what it holds and its value when unset" and gives examples only per slide kind, so "each with an example" no longer holds for the keys. Item 5 covers both lines, but it names only `:95` and `:97` as the ones to rewrite. It should also name these two.

## The step line

Step line: `plan.md:1718`. Ruling 711: `plan.md:3627` (its parts D1 to D4 are read in sequence, as no D labels are written there). State file: `orchestrator-state.md:200`.

- "rewritten" maps to items 1 to 3.
- "carefully curated selection, every sentence that means nothing to a reader removed" maps to item 4.
- D1 (Help: per view what it is for and only what the screen does not show by itself, and the keys table) maps to item 1. Ruling 706 (`plan.md:3620`) also maps to item 1.
- D2 (each hub file, its keys and what links them) maps to item 2.
- D3 (a deck's files, its keys and the slide kinds, each with one example) maps to item 3.
- D4 (a builder drafts from the code, the writing review checks every sentence, Axel approves before landing) maps to items 1 to 3 ("written again from the code") and item 6. The D4 rule for the rules file is already at `agents/spec.md:72`, so it needs no item.

No part of the step line is left without a requirement.

Two items reach beyond the ruled words, and the brief does not name them under "Decisions taken in this brief":

- Item 1 keeps "The window's parts (the rail, pages and panes, workbenches, the palette, the status bar) ... and the configuration" where a reader needs a fact. These are not registered views, and D1 gives Help only per-view entries and the keys table. Either this is a decision taken in the brief and listed as one, or it is dropped.
- Item 2 keeps "a second hub, the primary hub and the repositories below a hub". It is close to D2 ("as far as they change which file is read"), and that is acceptable if it is named.

## Premises

All rerun on main at 2ba2827a3:

- `ls docs/adr` printed "ls: docs/adr: No such file or directory". Matches.
- `ls docs` printed `apps.md data-map.md decks.md diagrams HELP.md licenses palette.md templates.md third-party.md`. Matches; there is no glossary.
- `wc -l -w` printed `646 32223 docs/HELP.md`, `311 5206 docs/data-map.md`, `434 5687 docs/decks.md`. Matches.
- `grep -n "^#" docs/HELP.md` gives the brief's headings at the brief's lines (`:11`, `:127`, `:205`, `:392`, `:576`, and the subsections). The brief leaves out the "Files and the editor" subsections ("Notes" `:419`, "Language servers" `:438`, "Hub keys in YAML" `:451`, "Linters" `:456`); these are omissions, not errors.
- `src/lib/server/content/docs.ts:805` is `export const MANUAL = 'docs/HELP.md';`. Matches.
- `config/defaults/layout.yml:143` and `:145` are the Data map and Decks guide tabs. Matches.
- `rows.ts:1-8` is the head comment naming its sources. Matches. **But** that comment, and `grep -n -i "present\|deck\|PageUp" src/lib/views/system/help/keys/rows.ts` (no hit), show that the Keyboard Shortcuts rows do not include the Present view's keys. Those keys are bound in `src/lib/views/academic/present/screen/box.ts:1-6` (see Cases and checks, C2).
- `registry.ts:273` is `function registerView`. Matches. The premise "Each view registers through registerView" is incomplete: `src/routes/views.ts` registers four more kinds:
  - the collection views, one per `collections:` entry, through the factory `views/boards/collection/registration.ts:42`, at `views.ts:162-181`;
  - the board views of `boards:`, through `Projects.svelte:30 boardRegistration`, at `views.ts:118-138`;
  - the apps' contributed views, at `views.ts:250-268`;
  - the unlisted panel and editor views, `OPENED`, at `views.ts:270-287`.

  `grep -rln "export const registration" src/lib/views | wc -l` printed 62, and `grep -rn "listed: false" src/lib/views | wc -l` printed 20.
- `ls src/lib/data/sources/deck` printed the brief's ten files. Matches.
- `history.test.ts:4`: the brief says it "reads every line of `docs/HELP.md`". That is true but incomplete. `documentsOf` (`history.test.ts:132-141`, `GUIDES = 'docs'` at `:26`) reads every `.md` under `docs/`, so all three pages are held to it. C7 still holds.
- The anchor grep printed only `src/lib/views/shared/prose/doc-link.ts:3:HELP.md#the-keys`. The same grep over tests printed nothing. Matches.
- The brief's quotes of `README.md:42,95,97,99`, `docs/templates.md:1924` and `docs/apps.md:3` match when read with `sed -n`.
- The brief's quotes of `return-place.ts:3`, `chords.ts:120`, `clone-exclude.test.ts:25`, `git-scan-depth.test.ts:210`, `sources.yml:35` and `help.yml:1` match when read with `sed -n`.
- `agents/spec.md:72` quote. Matches.
- `.agents/plan.yaml:4` is `verification: .scratch/migration/orchestrator-state.md`. Matches.

Premise not in the brief: `tests/tiers/quick.mjs:35-36` says "A change outside src, tests and utils (a file under docs or .scratch alone) chooses none of the checks that read the tree's text". Its ASCII gate (`tests/tiers/run.mjs:25`) runs `find src tests bin config` only. So `npm run test:quick` checks neither the three pages nor `README.md` for the character set, and it does not run `history.test.ts` for a docs change. The brief's separate C7 run covers the history test. Verify item 3 ("The character-set check of the rules file over the changed files") gives no command for `docs/*.md` and `README.md`, which `agents/spec.md:103`'s `find` does not reach. The brief should dictate the command, for example the perl gate of `spec.md:103` with the changed file list in place of the `find`.

## Cases and checks

- **C2 contradicts ruling 706 and cannot pass as written.** C2 expects every row of Help's keys table to be "a binding the Keyboard Shortcuts view lists ... and the deck rows of ruling 706 are among them". Item 1 says "every row true of the bindings `rows.ts` reads, the rows of ruling 706 kept". The 706 rows (`docs/HELP.md:200-201`, "Right / Left, Page Down / Page Up, Space / Shift+Space" and "Home / End", "in Present") are bound in `src/lib/views/academic/present/screen/box.ts` and `screen/keys.ts`. The comment at `Present.svelte:42-47` says the keys are the pane's own. No source that `rows.ts` reads holds them (`grep -rln -i present src/lib/data/helpers/keys src/lib/views/system/help` printed nothing). Suggested fix: C2 and item 1 say "a binding in the code: a row `rows.ts` builds, or a key a view binds on its own box (the Present view's `screen/box.ts`)", and the expected result is "no row without its binding in the code". The same applies to the other view-local rows of today's table (`docs/HELP.md:199`, "F / P / O").
- **C1's set of views is not defined.** "Every view the app registers" and "read from each component's registration" leave out, or leave open:
  - the collection views (one per `collections:` entry, so hub-defined);
  - the board views of `boards:`;
  - the apps' contributed views (unknowable from the tree);
  - the 20 static registrations with `listed: false` (Post, Output, Person, Entry, Project, File, Source, Merge, Diff, Doc, Document, and others).

  The brief should say whether Help gives the Collection view and the board view once each as kinds, whether unlisted views get entries, and that apps' views are excluded. Decision 2 ("ordered as the rail groups them") also has no place for unlisted views. Read item 2 of "Read, with sections or line ranges" should add `src/routes/views.ts`.
- **Item 1 and C3 give no means of judging "what the screen shows".** The builder runs no page (`agents/spec.md:65`). The brief should say that this is judged from the view's markup and its catalog strings under `config/text/views/`, read by the builder.
- **C4's file population.** "Every hub file of `config/defaults/sources.yml` and the settings files under `.oculus/`" does not name the `project.yml` manifests that `scan:` finds (`sources.yml:10-18`), nor a repository's own `.oculus/` files (`docs/data-map.md:26` lists `project.yml`, `settings.yml`, `commands.yml`, `launch.yml`, `cpp.yml`, `app-data/<name>.json`). Both are files oculus reads, with keys and links. It should state whether they are in.
- **Decision 3** cites the nested-repos block as its example of a fact written once, but does not say which page gets it. Today it is on both pages: `docs/HELP.md:631` and `docs/data-map.md:311`. Item 5 does catch the test comments wherever it lands.
- No other case is inconsistent with the rules file:
  - "No test is written" is consistent with `spec.md:60`.
  - "no page" is consistent with `spec.md:65`.
  - one quick run is consistent with `spec.md:26`.
- The rules file still binds these, without the brief repeating them:
  - for the comment lines the step edits in `return-place.ts`, `chords.ts` and the two tests: the history-word grep (`spec.md:44`) and the rewrap at 100 columns (`spec.md:45`);
  - `npm run diagrams` before the list (`spec.md:26`).
- No case asks the builder to check, quote or explain a place the step does not change. C1 and C2 read the registrations and the bindings only as the source the pages are judged against.

## The question

The goal: three guides holding only true, needed sentences in the ruled scope.

- **C1, C4, C5**: yes, each could pass without the goal. Each checks coverage (every view, file, key and kind present, nothing extra). A page with an entry for each that holds untrue or unneeded sentences passes.
- **C2**: as written it cannot pass at all (see above). Once fixed, it checks the keys table only.
- **C3**: yes. It asks for five screen-repeating sentences of today's Help and their absence from the new Help. Removing those five passes it while others remain. It should say that every sentence of the new Help was read against its view's markup and catalog strings.
- **C6**: no for its own scope, the lines elsewhere. It says nothing about the pages.
- **C7**: yes. It passes on any page free of plan ids, dates and session words.
- **C8**: yes. Links resolving says nothing about the content.
- **The step line's check**: the line names none beyond "built as open item 711 rules". The effective gates are item 6 (the writing review and Axel's approval) and item 4.
- **Item 1**: yes, while its set of views is open (C1) and "what the screen shows" has no stated means of judging.
- **Items 2 and 3**: the coverage parts can pass with wrong content. Their truth rests on item 4.
- **Item 4**: partly. "The report gives per section the code read for it" lets a section citation stand over sentences that are not true; a citation per sentence, row or paragraph would let the reviewer check each fact. "Needed" is a judgment, left to the writing review and Axel.
- **Item 5**: no for its scope, apart from the `CLAUDE.md:5` line it does not list.
- **Item 6**: no. Axel reads and approves the pages, which is the gate that reaches "needed" and "curated".

## Implied inputs

This is a text step. The code-step implied inputs do not apply:

- the base output of `utils/unused-exports.sh` (no export changes);
- `agents/guarded.md` tests (no test);
- the id and asynchronous-path checks of `spec.md:73`;
- the size and folder limits (`.md` files).

The step does edit comment lines in src, tests and config, so the history-word grep (`spec.md:44`), the rewrap (`spec.md:45`) and `npm run test:quick` apply to those files.

## ADRs

`ls docs/adr` printed "ls: docs/adr: No such file or directory". There are no ADRs.

## Dictated text

`grep -n '"The keys"' .scratch/migration/agents/briefs/O165.md` printed lines 16, 27 and 75. Line 16 is a premise listing today's headings. Lines 27 and 75 dictate the heading "The keys" for `docs/HELP.md`: holds.

`grep -n '"Everything in the brief is done"' .scratch/migration/agents/briefs/O165.md` gives line 119, which dictates the report's first line "Everything in the brief is done": holds.

`grep -n '"still true"' .scratch/migration/agents/briefs/O165.md` gives line 125, which dictates "still true" for the report. It holds: it is the rules file's own phrase (`spec.md:72`), and `spec.md:44`'s word list binds comments and test titles, not the report.

The brief dictates no other text for a file. Axel's quoted words at line 11 are a premise, not text to be written into a file. `LC_ALL=C grep -n '[^ -~]'` over the brief printed nothing.

## Declined to judge

- Whether each view, file or key of today's pages is "needed": that is Axel's and the writing review's judgment by ruling 711.
- Whether the window's parts and the configuration should stay in Help at all (item 1 beyond D1): that is the orchestrator's or Axel's call on the ruled scope.
- Whether the slugs the Markdown renderer makes from the new headings resolve as `#the-keys`. I did not read the renderer; C8 checks it.

Usage: abe81b76d36c73c6b, claude-opus-5-5, 156582 tokens, 43 tool uses, 8.6 min

## Closed

- Names, `CLAUDE.md:5`: a premise added; the orchestrator rewrites the line at landing, and the report gives Help's scope as built for it.
- Names, `README.md:99` and `docs/templates.md:1924`: named in item 5 with why they are rewritten.
- The step line, the window's parts: Help's two parts stated in item 1; the shell's parts taken as decision 4.
- The step line, a second hub and the repositories below a hub: decision 5.
- Premises, the four registration sources: a premise added with the counts; `src/routes/views.ts` added to the read list.
- Premises, the Present keys outside `rows.ts`: a premise added; item 1 and C2 now take a binding in the code, `rows.ts` or a view's own box; `screen/box.ts` and `screen/keys.ts` added to the read list.
- Premises, `history.test.ts` reads every `docs/*.md`: the premise corrected.
- Premises, the quick gate does not read `docs/` or `README.md`: a premise added; check 3 now gives the gate of `spec.md:103` with the changed files in place of its `find`. That command line is the rules file's own gate, read whole: holds.
- Cases, C1's set: item 1 defines it (own registrations listed or not that a reader reaches, the collection view and the project board once each as kinds, the apps' views left out, the shell's parts); decision 2 places unlisted views.
- Cases, C2: rewritten as above.
- Cases, item 1 and C3, what the screen shows: judged from the view's markup and its `config/text/views/` strings; C3 now reads every sentence of the new Help.
- Cases, C4's files: item 2 names the manifests and a repository's `.oculus/` files.
- Cases, decision 3: the nested-repos block goes on the data map, the test comments then cite it.
- The question, item 4: the code citation is per paragraph, list item or table row.
- Headings omitted from the premise ("Notes", "Language servers", "Hub keys in YAML", "Linters"): no change; the builder reads the page whole.