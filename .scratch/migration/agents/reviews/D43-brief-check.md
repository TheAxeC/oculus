# Step D43 brief check (on main at 0e9bde803)

D43 brief check (LaTeX navigation through texlab). Read-only: no repository file was changed and no state-changing git command was run. Scratch copies of the briefs' write lists went to /tmp by mistake and were deleted in the same command.

## Names

Command for the new names: `grep -rIl --exclude=local.yml -- <name> src tests config docs DESIGN.md HELP.md README.md`, run for each new name. `server_texlab`, `language_bibtex`, `ls_install`, `ls_tip_not_found_install`, `cmd_latex_restart`, `cmd_latex_output`, `latex_unapproved`, `approve_latexmkrc`, `approve_weave`, `latexmkrc_unread`, `texlab_path`, `unimath_symbols`, `includegraphics_preview`, `unimath`, `approve-latex`, `latex-changed`, `latexApproval`, `approveLatex`, `programPath`, `latexmkrcKey`, `approveLatexmkrc`, `Asks.svelte` and `texlab` return no hits. The other names do return hits:
- `approve_title` is in `composer.yml` and `apps.yml` under other groups, so `latex.approve_title` does not collide with it.
- `latexmkrc` appears only in `config/behavior.yml`, as a recipe name.
- `LatexAsk` matches only the type `LatexAsking` in `latex-tab.svelte.ts:45`.
- `bibtex` appears only as the program name or the literature format, so no language branch reads it.

Hits outside "Paths this step writes" that the change makes false:
1. `ServersOptions.latex` and `RelayOptions.latex` (decision 3, written as required members). `grep -rn "createServers\|new Relay(\|createRelay(" src tests` finds `tests/server/machine/lsp/lsp-fixture.ts:176` and `:183` and `tests/server/root/context-fixture.ts:53`. Neither file is in the write list. If `latex` is required, both fail the type check. lsp-fixture must also give texlab its settings for case 13's row in lifetime.test.ts.
2. The refusal words `latex-changed` and the unnamed "latexmkrc cannot be read" word. `grep -n "LATEX_REFUSALS" src -r` finds `src/lib/data/prose/latex.ts:44-68`. The words are turned into sentences by `latexSentence` in `src/lib/state/shared/answers/answers.ts` (around :115-126). Neither file is in the write list. The sentence keys follow the `latex.refused_<word>` pattern (`config/text/views/academic/latex.yml:112-131`), while O1 names `latex.changed` and `latex.latexmkrc_unread`.
3. The pressed clean. `grep -rn "'clean'" src/lib/state` shows that a pressed clean goes `actions.ts:198` -> `latex.svelte.ts:506` (`terminals.latex(target, main, step)`), not through builds.ts. latex.svelte.ts is in the list (#30); `src/lib/state/sessions/latex/actions.ts:195-200` is not. Item 5 says builds.ts opens the ask for a pressed clean, which does not match the code.
4. `config/behavior.yml`. The list gives :139-178, but the `latex:` block's comments that the new keys and the waiting automatic build make incomplete are at :133-138 (`sed -n 133,138p`: "auto_build: on_file_change builds a main file when any file it includes changes ...").
5. `pty-io.ts`. The list gives :25-50, but the answer shape the page parses (`actionAnswerShape`, `seedApprovalShape`) is at :68-85 (`sed -n 60,100p`).
6. Overlap with the other briefs in preparation. Comparing their write lists with `comm -12` gives:
   - D39 shares `transport.ts` and `kit/lsp/transport/`. Both briefs may split transport.ts, so their merge is not simple. D39 also shares relay.ts, servers.ts, context.ts, hosts.ts, lsp.ts, source.yml, catalog-files.ts and the docs.
   - D36 shares approvals.ts, recipes.ts, settings.ts, options.yml, behavior.yml, statusbar.yml, LanguageItems.svelte, extension.ts and the docs.
   - M6 shares config/sources.yml and the docs.
   The brief's "Shared with the steps in flight" names D39 only.
7. Line references in the brief are stale now that main has moved. `git log -1 --format=%h` gives 0e9bde803, while the brief says 884716764. `git diff --name-only e61cfc598 HEAD -- tools/oculus ':!tools/oculus/.scratch' | wc -l` gives 0, so every source premise still holds. In plan.md the citations have moved:
   - the D43 line is at :541 (sub-bullets :542-546, Step 0 :545), not :539;
   - Z347 is at :1163, Z682 at :1499, Z683 at :1500, Z690 at :1507, Z703 at :1520 and Z726 at :1547 (each 3 lines later than the brief says);
   - D39's sharing sentence is at :535, not :534.
   Z732 is already in the working copy's plan.md, at :1557 and on the D43 line.
8. Hits that stay true:
   - grammars.ts head comment, "Five names are spelt otherwise" (bibtex is Shiki's own id);
   - HELP.md:118 (the Problems row);
   - DESIGN.md:124 (the channel messages);
   - DESIGN.md:476;
   - docs/window.md:74 and :82;
   - docs/views.md:73.
   `servers.ts:10` ("five entries"), `followed.svelte.ts:3` (`.bib` in the latex list) and `approvals.ts:6` ("four kinds") are made false, but all three are in the list.

## The step line

Each part of the plan line and of its rulings maps to an item of "What to build":
- texlab for `.tex` and `.bib`: items 1 and 2.
- `\cite` completion and hover: item 1; case 18.
- Go to `\label`: item 1; case 19.
- The section outline: item 3; case 22.
- Undefined labels and citations as problems: item 1 and U8; case 21.
- The licence and install route: "Libraries checked".
- Z703 U1: items 1 and 7. U4: item 2. U5: item 4. U6: item 1. U7: item 1. U8: item 1. U9: item 3. U10: nothing to build.
- Z726 N1: items 1 and 5. N2: item 6. N4: item 5. U2: item 1. N3 is the orchestrator's.
- Z732 O1 to O3: items 1, 4 and 6.
- Z682 (8): item 1. Z683 (3): Z683 (3) is met by the composition `extension.ts:56` already does, and case 20 checks it.

Parts with no requirement:
1. "Unused ... citations". texlab's UnusedEntry (`D43-premise-survey.md:57`; `D43-premise-recheck-2.md:374`: "an entry no `\cite` uses is marked unused") has no case. Case 21 lists an undefined `\ref`, an undefined `\cite`, an unused label and a duplicate key only.
2. Z690 D45-1 keeps both hovers on a `\ref`-family command and on a package name. Case 20 covers `\ref` only; the package-name hover (texlab's package description beside D45's texdoc) has no case.

## Premises

Rerun on main at 0e9bde803. Every command of "What is on the tree" reproduces, except the points below.
- `command -v texlab` prints nothing and the exit status is 1. `command -v latexmk latex kpsewhich tectonic` prints the three TeX Live paths and nothing for tectonic. `brew info --json=v2 texlab` gives `5.26.0 GPL-3.0-only [] ['arm64_sequoia']`.
- `relay.ts`: reconcile at :251; `'the document is not open'` at :509; `held.lose()` at held.ts:229.
- `transport.ts`: 871 lines; `#forward` :371; `#rootState` :584; `#handle` :597; `#response` :614; REQUEST_CANCELLED at :634. `kit/lsp` holds 10 items; the `transport/*` files are 36, 239 and 132 lines.
- monaco-editor is 0.57.0; `provideCodeActions` is at :2055; the provider list matches.
- servers.ts, relay.ts, held.ts, process.ts, choices.ts and context.ts: the line counts and every line cited match. There are 4 adapters and 9 items in `lsp/`.
- These files match their line counts and every line cited: lsp-servers.ts, statusbar.yml, source.yml, LanguageItems.svelte, sources.yml, languages.ts, grammars.ts (31 SHIKI_IDS; `@shikijs/langs/dist/bibtex.mjs` exists), extension.ts, latex-tab.svelte.ts, followed.svelte.ts, client.ts, Outline.svelte, symbols.ts, problem-sources.ts, latex.ts, routes.ts, recipes.ts (content/latex holds 10), behavior.yml, approvals.ts, builds.ts, latex-state.ts, pty-io.ts, terminals.svelte.ts, Workbench.svelte (519; shell/commands holds 4), LatexItem.svelte, settings.ts and options.yml.
- The guarded lines G1 :7, G7 :25, G55 :37, G35 :62, G36 :65, G31 :74, G63 :140, G12 :149, G13 :152, G69 :167, G61 :170 and G24 :198 match `grep -n "^- G"`.
- `orchestrator-state.md:27` still reads `dispatch: []`.
- The unimath data: `ls -la` gives 334,627 bytes; parsed, it holds 2415 entries with the keys `{command, detail, documentation}`.

Differences:
1. Main's head is 0e9bde803, not 884716764 (three commits that change only the ledger). The plan.md line numbers have moved, as Names 7 lists.
2. `transport.ts`'s head comment runs :1-49, not :1-48.
3. `LatexBuilding` is at settings.ts:561-575, not :562-576.
4. The `served.has` precedent of folding.ts is code at :126-135; :10-13 is the comment that describes it.

## Cases and checks

1. Cases 11, 13, 27 to 31 and 37 against spec.md:57. The Rulings section says "The builder writes every row of cases 11, 13, 27 to 31 and 37 ... a row the ruling does not cover is deleted at landing". spec.md:57 says a step that needs an entry "writes no test until he has ruled". G36 (`guarded.md:65`) names five servers, and G55 (:37) covers language servers only, so these rows have no entry until open item 14 is ruled. The brief's own Cases paragraph says "G55 once O4 is ruled". The two instructions contradict each other.
2. Cases 27 to 30 and 33 to 39 are filed "under G35, G55 and G31". G35's text ("acts only on the terminal it names, and ends only what it says it ends") does not state an approval gate, and G31 covers case 32 only. The rest rest on the widening of G55 that is not yet ruled.
3. Cases 2 to 4, 7, 8, 15 to 17, 33, 34, 38 and 39 have no guarded entry and are not page-only. The brief says each "is checked by a run the report quotes, and no prototype script stands in for a test". It does not say what a run is when it is neither a test nor a script.
4. Case 15 (a `.tex` outside every served root gets no server) checks `openingTarget` in relay.ts, which the step does not change.

## The question

- Cases 1 to 4 (Step 0): they would fail if the fix were missing, since case 1's look reads the console. They could pass without the D43 goal being reached, but Step 0 is a separate defect fix.
- Case 6: it can pass without the goal. It runs prepare "with an `exists` that finds nothing", but item 1 has the PATH walk go through `programPath`. `onPath` (recipes.ts:241-246) uses `accessSync`/`statSync` on `env.PATH` and ignores `exists`. So the case shows nothing about the real lookup, and after N3 an uninjected test reads a PATH that holds texlab.
- Case 10 (the launch shape) and case 11 (the links folder): both pass even if texlab cannot work under the PATH that holds only the links folder (kpsewhich finding no distribution). Only looks 18 to 23 show the goal.
- Case 12: it passes if texlab never started, since the marker is absent then too. The look must first see texlab ready on the status item.
- Cases 13, 14, 16 and 17: each would fail without its code; they show nothing about the features.
- Cases 18 to 26 (looks after N3): each is the goal itself. Case 21's "No row comes from texlab's build log" passes vacuously unless a failed build has left a log in the aux folder.
- Cases 27 to 39: each would fail without the gate.
- The verify list (test:quick, the entry tests, the ASCII, size and unused-export checks): all can pass with texlab never answering, because nothing installs texlab before the landing look.
- Item 1: it can pass with the wrong configuration section or the wrong trigger characters; looks 18 and 19 would catch either.
- Items 2, 3, 5 and 6: the cases and looks cover them.
- Item 4: case 25 covers `.png` only (see Implied inputs 10).
- Item 7: it is read at review.

## Implied inputs

1. Where the adapter gets oculus's environment (PATH): `RootEnv` (servers.ts:73-84) carries no env, and the brief does not name a field. Expected: an injected env. Without it, cases 6, 10 and 11 depend on the machine, and case 6 changes result once N3 installs texlab.
2. `latex.texlab_path` set to a relative path, a folder, or a file that is not executable. Expected: not found, with the note naming it. Case 8 covers a missing file only.
3. The links folder cannot be made (lsp folder unwritable). Expected: `failed` with a note, and nothing spawned.
4. kpsewhich run by texlab under the PATH that holds only the links folder (texlab's distribution detection). Expected: package completion works. It is checked only at the look.
5. `latex.out_dir` or `latex.aux_dir` changed while texlab runs. texlab asks for its configuration only when told to. The brief's "a changed setting reaches the next question" needs a `workspace/didChangeConfiguration` push or a restart, and the brief names neither.
6. A compound folder value such as `%DIR%/build`. Expected: `build` relative to the main. Decision 5 and case 16 have no row for it.
7. What `repo` is in `JSON.stringify([repo real path, ...])` and in `{ repo, weave: [folder, tools] }`, and what "main folder" and "the root" are. latex.ts gives `folder.dir`, `folder.bound` (the hub for a project request, `latex.ts` latexFolder) and dirname(main). Expected: named, since each choice gives a different approval key.
8. The wire shape `{ approveLatex: { latexmkrc, weave: ..., text: ... } }` leaves `weave` and `text` as ellipses. One `text` is listed while item 5 says "the texts it was shown" (two kinds).
9. A picture name holding `)`, `]`, spaces or other Markdown characters in the preview's Markdown documentation. Expected: escaped or URL-encoded. A repository file name reaches rendered Markdown, which spec.md:69 treats as untrusted.
10. `\includegraphics{fig.pdf}` or `.eps`, the usual case under pdflatex. latex-widget.ts:189-190 draws a `.pdf` as its name only. Expected result not stated.
11. A weave tool that is not Rscript, julia or pweave (`R CMD Sweave`, `python -m pweave`, quarto). Expected: decided. Otherwise it runs a document's code without asking.
12. An automatic build blocked while the active tab is not a LaTeX file. LatexItem's head comment (:9-15) draws the item only for a LaTeX or PDF tab or a running build, so the warning tone is not seen.
13. Approve pressed from the status item. Does the waiting automatic build then run once? "As the press asked" does not decide it.
14. Only a weave approval is pending, or only an automatic clean. The dictated `latex_unapproved_tip` speaks of "the automatic build ... the files latexmk reads" only.
15. One Approve writing both the latexmkrc and the weave approvals as two `store` calls, and the second fails. Expected: both or neither, or the first kept and said.
16. The client.ts change sets symbols to `'none'` for every server that is failed or not found. A Python or C tab whose server is missing then changes from "loading" to "no symbols" in the Outline. This is a visible change the before and after should name.
17. The unimath data:
    - 964 `detail` values hold the glyph plus a package note (`'<U+2340> ("wasysym" command)'`), so "detail the glyph" is ambiguous;
    - the `Angstrom` documentation holds a non-ASCII letter that also needs an escape;
    - 986 glyphs lie above U+FFFF.
    The python3 read of `unimathsymbols.json` shows all three.
18. The catalog is pushed to every page even while `latex.unimath_symbols` is false. The brief asks for the byte count, but not what size is acceptable.

## ADRs

`grep -n adr .agents/plan.yaml` prints nothing (`standards: []` at :8). `ls tools/oculus/docs/adr` and `ls docs/adr` both print "No such file or directory". No ADR applies.

## Dictated text

The brief is ASCII: `LC_ALL=C grep -n '[^ -~]' agents/briefs/D43.md` prints nothing, and `grep -n " - \| -- "` prints nothing. The dictated lines are found with `grep -n` at :104, :113, :315 and :319.
- :104 `statusbar.language_bibtex: BibTeX`: holds.
- :315 `statusbar.server_texlab: texlab`: holds.
- :315 `statusbar.ls_install_texlab: brew install texlab`: holds.
- :315 `ls_tip_not_found_install: '{0} was not found for {1}. Install it with {2}, then restart the language server.'`: holds.
- :315 `cmd_latex_restart: 'LaTeX: Restart Language Server'` and `cmd_latex_output: 'LaTeX: Show Language Server Output'`: hold.
- :315 `texlab_path: The texlab program the LaTeX language server runs. Empty: texlab on the PATH oculus was started with.`: holds.
- :315 `unimath_symbols: Offer the Unicode math symbols in LaTeX completion, each with its glyph.`: holds.
- :315 `includegraphics_preview: Show the picture beside a file suggested inside \includegraphics.`: holds.
- :315 `latex.approve_title`, `latex.approve_latexmkrc`, `latex.approve_weave`, `latex.approve: 'Approve and Build'`, `latex.changed` and `latex.latexmkrc_unread`: hold.
- :315 `'Approve and Clean'`: holds as prose, but no key is named for it.
- :315 `statusbar.latex_unapproved_tip`: holds as prose. Its content is incomplete for the weave and automatic-clean cases (Implied inputs 14).
- :319 the G55 sentence and "one texlab its LaTeX and BibTeX tabs": hold.
- :113, the unimath head comment's copyright holder "copied byte for byte from LaTeX Workshop's data/README.md:48-70". This breaks the ASCII rule. `grep -n Copyright -A1` of that README shows `<U+00A9> 2011 Günter Milde <milde@users.sf.net>` at :61. The gate at spec.md:99 allows only `\xC3[\x80-\xBF]` under config/, so the ü passes and <U+00A9> (`\xC2\xA9`) fails. The line must say "Copyright 2011 Günter Milde" instead.

## Declined to judge

- texlab's capabilities, option names, trigger characters, `workspace/configuration` section and diagnostic sources at v5.26.0 (server.rs, options.rs, to_proto.rs:94-97, types.rs:46). The texlab source is not on this machine, and texlab is not installed (`command -v texlab` exits 1).
- Whether Monaco 0.57.0 draws an image in completion documentation addressed by an absolute http URL on the page's origin. Not read; the look settles it.
- Whether kpathsea works through a link folder under texlab. It needs texlab running.
- The Node behaviour that `spawn` looks a bare command up in `options.env.PATH`. It is taken from Node's documented behaviour and was not run, since running it would mean starting a process.

Usage: a87cb52c4ba0e7cc3, claude-opus-5-5, 295,723 tokens, 99 tool uses, 14.5 min (completion notice).

## Closed

Closed by the orchestrating session in `agents/briefs/D43.md`, on main at fbc434269.

Names:
1. `ServersOptions.latex` and `RelayOptions.latex` stay required; item 1 names both fixtures (`lsp-fixture.ts:176-183`, with a `latex` option for case 13, and `context-fixture.ts:53`), and the path list gains them (56, 57).
2. Item 5 adds the two refusal words to `LATEX_REFUSALS` and their sentences to `latexSentence`, under the keys `latex.refused_latex_changed` and `latex.refused_latexmkrc_unread` with O1's words; the path list gains `data/prose/latex.ts` and `answers.ts` (58, 59).
3. Item 5 sends a pressed clean's ask through `actions.ts:195-200` and `latex.svelte.ts:506`; the path list gains `actions.ts` (60).
4. The path list gives `behavior.yml` :133-178.
5. Item 5 names the parsed answer shape at `pty-io.ts:68-85`; the path list gives :25-50, :60-100.
6. "Shared with the steps in flight" names M6 (in flight, merge judged simple, hunks at different lines), and D39 and D36, which are prepared after D43 lands.
7. The plan.md citations are the current ones (:541, :1164, :1500, :1501, :1508, :1521, :1548); main's head is fbc434269 with the source unchanged.

The step line: case 21 gains the unused `.bib` entry; case 20 gains the package-name hover.

Premises: the transport head comment is :1-49; the folding precedent's code is `folding.ts:126-135`. `LatexBuilding` at :562 is the type line; the range :562-576 stands.

Cases and checks:
1. The paragraph after the cases maps each test to its entry as ruled by open item 14 (a); the "once O4 is ruled" text is gone.
2. Cases 27 to 31, 33 to 35 and 37 to 39 are under G55 as widened, 32 and 40 under G31; G35 covers none.
3. A run is defined: one command from the builder's scratchpad against the worktree's code, quoted with its output, not kept in the tree.
4. Case 15 is checked by reading.

The question: case 6 runs with an injected `RootEnv.env`; case 12's look first sees texlab ready; case 21's look first leaves a failed build's log; case 18 checks kpsewhich through package completion.

Implied inputs, each now a requirement or a case:
1. `RootEnv.env` (item 1; case 6).
2. A relative path, a folder or a file that is not executable: not found (item 1; case 8).
3. An unwritable links folder: `failed`, code `lsp_folder` (item 1; case 8a).
4. kpsewhich: case 18.
5. A changed setting: `relay.settingsChanged()` from the watcher's `built` hook, through `reconfigure` (item 1; case 16a).
6. `%DIR%/build` is `build` (decision 5; case 16).
7. `repo` is `folder.bound`, the walk stops there, the main folder is the real `dirname(main)` (item 5).
8. The full answer and action shapes (item 5).
9. Percent-encoded segments and an escaped alt text (item 4; case 25a).
10. `.pdf` and `.eps`: no preview (item 4; case 25).
11. Any non-TeX recipe tool asks (item 6, Z734; case 37).
12. The status item is drawn while an approval waits, whatever tab is active (item 5; case 36).
13. Approve from the status item runs the waiting step once (item 5; case 36).
14. The tip covers a weave approval and a clean (Z734).
15. `approveLatex` writes both entries in one `store` (item 5; case 40).
16. The Outline's no-symbols text for any missing server is named for the report's before and after (item 3).
17. The whole `detail`, every non-ASCII code point escaped, astral glyphs as `\UXXXXXXXX` (item 4; case 24a).
18. The push may grow by at most 334,627 bytes, quoted before and after (item 4).

Dictated text: `latex.approve_clean: 'Approve and Clean'` is named; the tip is Z734's; the head comment's line is `Copyright 2011 Günter Milde`.

Declined points: texlab's options, Monaco's image documentation and kpathsea through links are settled at the look (cases 18 to 25); Node's `spawn` lookup in `options.env.PATH` is why item 1 launches by an absolute path.
