# Step O139 brief check (on main at 6779731e1)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O139.md`. The brief says it was read on main at 6e3de363f. `git log --oneline 6e3de363f..HEAD` prints one commit, `6779731e1 Prepare step O137`, and `git diff --stat 6e3de363f HEAD` shows that it changes only ledger files (`.scratch/migration/...`). The tree the step reads is therefore the same at both commits.

## 1. Names

- `Findings.svelte`: `grep -rn "Findings\.svelte" src tests config docs README.md utils .scratch/migration/agents/guarded.md`. It has one hit outside the write list: `src/lib/views/system/findings/AuditSection.svelte:2` "The Audit section of the Findings view (Findings.svelte beside it, whose search it draws)". The change does not make this false. `grep -rn "system/findings" tests src docs README.md` finds no test that imports the component. Its only test hit is `tests/checks/config/config-folder.test.ts:350`, which names `'views/system/findings.yml'`, a text catalog and not this file. `docs/diagrams/channels.dot:153` names the folder node `views/system/findings`, and that file is in the write list.
- The Files row's markup and its words (the `.file` span, its tooltip, "a row names its file"):
  - `grep -n -i "findings" docs/HELP.md docs/data-map.md docs/apps.md`. The change leaves these hits true: `docs/HELP.md:250` ("Every problem found in the hub's files, with file and key"), `docs/data-map.md:78` ("every finding, with its file and line") and `docs/apps.md:119` (the Findings view names an app fault as `apps[<name>]`).
  - `AuditSection.svelte:30-31` ("Each kind is a list of rows drawn as the Files section draws its rows: one line of the tree's row height, growing by whole lines when the words wrap, with the fill of a tree row under the pointer"). This is already inexact: `Findings.svelte:174-181` gives a Files row no fill under the pointer. The change does not alter that.
  - `AuditSection.svelte:32-33` and `:40-41` are about Audit rows and stay true.
- `named`: a local function, `Findings.svelte:102-105`, read at `:91` and `:135`. `grep -rn "named(" src/lib/views/system/findings` finds no other reader. It is unchanged (item 4).
- The HELP Findings bullet: `docs/HELP.md:345`. `grep -n -i "hub's chip\|chip" docs/HELP.md` finds `:590` ("each with its hub's chip", about a record field). That line stays true.
- The head comment (`Findings.svelte:20-40`): only this file is affected. It is in the write list.
- `RootChip` with a new kind of caller: `grep -rn "<RootChip" src/lib`. Every current caller passes a hub name: `RecordCard.svelte:285`, `AccountList.svelte:113`, `AuditSection.svelte:137` (`finding.hub`), `Usage.svelte:197`, `Person.svelte:195`, `CommandCenterView.svelte:120`, `LaneCard.svelte:179`, `Tasks.svelte:119` and `Band.svelte:116`. Under item 1 and decision 4, the Files row would pass `fileUnder(...)?.root`. For C6 that root is a repository folder entry, not a hub. In the real workspace it can be `oculus`, `ordo`, `cathedra`, `oculus-state` (`~/.oculus`) or `claude` (`~/.claude`), as `grep -n "path:\|primary" /Users/axelfaes/workspace/research-hub/.oculus/workspaces/research-hub.yml` lists.
  - `src/lib/views/shared/card/RootChip.svelte:2-5` reads "The mark on a card, a row or a page that names a hub: a chip with the name of the workspace folder the hub is served under. Every record carries its hub's name in `root`". For a C6 row this becomes false, because the chip names a folder that is no hub and the row is no record.
  - The chip's tooltip is `hubs.root_tip`, which `grep -rn "root_tip" config/text` shows as `config/text/views/shared/hubs.yml:5: root_tip: 'This record is from the hub served as {0}'`. On a C6 row, and in Axel's workspace on every row of an oculus `config/` or `~/.oculus` file, the reader would be told "This record is from the hub served as oculus". That is false twice: the folder is no hub, and a finding is no record.
  - RootChip.svelte and hubs.yml are outside "Paths this step writes".

Findings:
- N1. `RootChip.svelte:2-5` and the words of `hubs.root_tip` (`hubs.yml:5`) become false for every Files row whose file lies under a non-hub folder entry (C6, and oculus's own config findings in the real workspace). Both files are outside the write list. Any fix (a RootChip prop for its tooltip, or a Findings-specific chip with new words) widens the step's paths and adds a catalog line. Under the standing demand "A brief check never widens a step", this is for Axel as an open item.

## 2. The step line

- "each row of the Findings view's Files list draws the chip of the hub whose root holds its file (`RootChip`, none for the primary hub; the root from `fileUnder`, as `named` at :102-105 reads it)": served by item 1.
- "its file name is a control that opens the file at the finding's line": served by item 2.
- "for every row": served by item 2 together with decision 2. Rows whose file no root holds stay as plain words. The brief names this as a reversible decision, with its reason: `openSourceFile` opens only a file of a served root.
- "as the Audit section's place does": served by item 2 (`ToolButton plain`, the title `audit.open_place_tip`). The Audit place's hover underline (`AuditSection.svelte:303-305`, `.where :global(button:hover) { text-decoration: underline; }`) is not named. See C-3 below.
- "the findings of another hub's settings file, folders, categories and vocabulary already carry that hub's absolute path ... so `configPayload` and the wire are unchanged": served by item 7.

Findings: none. Every part has an item.

## 3. Premises

- Files list at `Findings.svelte:130-144`: `grep -n "<ul>\|</ul>" src/lib/views/system/findings/Findings.svelte` prints `130` and `144`. Matches.
- 219 lines: `wc -l` prints `219 src/lib/views/system/findings/Findings.svelte`. Matches.
- The row's markup: `sed -n 134-141p` shows `<span class="file" title={finding.file}>{named(finding.file, finding.line)}</span>` (split by prettier over 134-136), then the key, the message and `KeyChoice`. Matches.
- `named` at 102-105: confirmed by `cat -n`. Matches.
- "The search reads that name (... line 88)": `grep -n "fileSearch(found" Findings.svelte` prints `91:`. Line 88 is blank. Differs: the line number is 91, not 88.
- `fileUnder` at `paths.ts:178`, re-exported at `hubs.ts:28`: confirmed by `grep -n`. Matches. Its behaviour (`sed -n 165-195p`, and a probe on a scratch copy at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o139probe/probe.mjs`):
  - a relative path gives the primary, or null with no primary;
  - an absolute path gives the innermost root, or null.
  - Matches, with one property the brief does not state: the root's folder is compared as `root.real ?? root.dir` (`paths.ts:187`). The probe prints `"/tmp/lab/.oculus/config.yml" "main" -> null` for a root `{dir: '/tmp/lab', real: '/private/tmp/lab'}`, and `"" "main" -> {"root":"main","path":""}`. See section 6.
- `readOtherHub` at `index.ts:649`: `grep -n` prints the function at `646` and `649: const sources = join(root.dir, HUB_FILE);`. Matches. It joins `root.dir`, the unresolved folder (`portfolio.ts:610`, `{ key: one.name, dir: one.dir }`).
- `configPayload` joins at `payload.ts:88-90`: `grep -n` prints `88: findings: [` and `90: ...others.flatMap(...)`. Matches.
- oculus's config findings: `grep -rn "file: join" src/lib | grep -E "catalogs.ts|schema-findings.ts|option-findings.ts|options-folder.ts"` prints `catalogs.ts:133`, `schema-findings.ts:22`, `option-findings.ts:82` and `options-folder.ts:134`. Matches. However, `options-folder.ts:134` is `file: join(dir, OPTIONS_DIR)`, which names the folder `config/options` and not a file. See section 6.
- RootChip's behaviour: `RootChip.svelte:28-32,35`. Matches: no chip when the root equals `primary() ?? ''`.
- The Audit row at `AuditSection.svelte:131-183`, with `RootChip` at 137 and the `ToolButton plain dataCardToggle` at 145-155: confirmed by `cat -n`. `audit.open_place_tip` is `Open {0}` (`grep -rn open_place_tip config/text` prints `config/text/views/system/audit.yml:27`). Matches.
- `openSourceFile(client, file)` and `SourceFile` at `place.ts:28` with an optional `line`: `grep -n "export type SourceFile"` prints `28:`. `sourceFileState` passes `file.line` (`place.ts:64`). Matches.
- `docs/HELP.md:345` is the Findings bullet and says nothing of a chip or of opening a file: `sed -n 343,347p`. Matches.
- guarded.md: `grep -n -i "findings\.svelte\|fileUnder" .scratch/migration/agents/guarded.md` prints nothing (exit 1). `grep -c "paths\.ts"` prints 1, and line 84 names `sameDiskFile` and `diskPath` only. Matches.
- Steps in flight: the "Paths this step writes" of `briefs/O135.md` include `docs/HELP.md lines 394-411` and `docs/diagrams/*`. Those of `briefs/O137.md` include `docs/HELP.md lines 148 and 279` and the diagrams. Matches. O135 "built, under review" is not verified. The dispatch block in `orchestrator-state.md:27-38` shows a builder run and report at round 0, with `landing: not-started` and no reviewer row.
- The worktree and base copy (not in "What is on the tree"):
  - `ls .agents/worktrees/` shows `migration-O135` and `O135-base`, and no O139 worktree or base copy yet.
  - `sed -n 11p briefs/O135.md` (and `briefs/O137.md:11`) shows the line the other briefs carry: the worktree path, and the base copy with `src`, `tests`, `utils`, `config`, `docs` and `unused-exports.txt`.
  - `grep -n "worktree\|base copy" briefs/O139.md` finds neither.

Findings:
- P1. The search's line is `Findings.svelte:91`, not 88.
- P2. The brief names no worktree (`.agents/worktrees/migration-O139`) and no base copy (`.agents/worktrees/O139-base/` and what it holds). spec.md "Where you work" says "In the git worktree the brief names" and "The brief names a base copy". Verify item 4 cites `../O139-base/unused-exports.txt` with nothing defining it.
- P3. `fileUnder`'s comparison against `real ?? dir` (`paths.ts:187`) is not stated, while the brief's premise that another hub's finding names "that hub's file by its absolute path" is built from `dir` (`index.ts:649`). The two meet only when a root's `dir` equals its `real`. See I1.

## 4. Cases and checks

- C1: consistent with the rules file and the standards.
- C2: consistent. Its look on landing depends on I1: a second hub under `/tmp` or `/var` on macOS (`ls -ld /tmp /var` prints `/tmp -> private/tmp`, `/var -> private/var`) gives no chip and no control.
- C3: needs a press to show the tab opens at the top. spec.md "What every package obeys" says "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing". The brief's look list is "C1, C2, C4 and C6".
- C4: consistent. Its example ("while oculus's folder is no root of the workspace") is not Axel's workspace, where `oculus` and `oculus-state` are folder entries (`research-hub.yml:7,13`). See I3.
- C5: consistent.
- C6: consistent with the rules. Its result as written ("the chip of that root's name") holds, but the chip's tooltip words are false for it (N1).
- C7: "works as before" needs a press of KeyChoice, which is a DOM behaviour. It is not in the look list.
- C8: consistent. It is checked by reading `fileSearch` and `named`, both unchanged.
- Verify list:
  - `tests/checks/tree/boundaries.test.ts` and `tests/checks/tree/duplication.test.ts` exist (`ls`).
  - `utils/unused-exports.sh` and `utils/folder-check.sh` exist.
  - `npm run test:quick` is `node tests/tiers/quick.mjs`, which prints "every command passed" (`tests/tiers/quick.mjs:304`).
  - `npm run diagrams` is `node utils/diagrams/diagrams.mjs`.
  - Item 1's "every other test file that imports a file the step changes" finds none: `grep -rn "system/findings" tests` has only the catalog-name hit.
  - `../O139-base/unused-exports.txt` does not exist yet and is not defined in the brief (P2).
  - Verify item 3's "ASCII gate of the rules file ... over the files the step changes": the rules file's perl gate runs over `src tests bin config` only, so `docs/HELP.md` and `docs/diagrams/*` need the plain `LC_ALL=C grep -n '[^ -~]'` named for them. On main, `LC_ALL=C grep -c '[^ -~]'` prints 0 for each of them.

Findings:
- C-1. C3 and C7 need a press and are left out of the look list ("C1, C2, C4 and C6 are looked at on landing"). The rules file's DOM rule makes the look their proof.
- C-2. Verify item 4 cites a base copy the brief never defines (P2).
- C-3. Verify item 3 names the perl gate "over the files the step changes", but that gate does not reach `docs/`. The brief should name the grep form for `docs/HELP.md` and `docs/diagrams/*`.

## 5. The question

- C1: no. A press at the line is seen at the look.
- C2: yes, in one setting. Read against a root whose `real` equals `dir`, the code path gives the chip. On a hub whose folder path passes a symbolic link (every scratch hub under `/tmp` or `/var` on macOS), `fileUnder` gives null (probe output above), so the row has no chip and no control.
- C3: yes. It is checked by reading only, and the press needs the look (C-1).
- C4: no.
- C5: no.
- C6: yes, for the part of the goal "a row says whose file it is". The chip is drawn, and its tooltip says "This record is from the hub served as <folder>" for a folder that is no hub (N1).
- C7: yes. It is read only, and its press is not looked at.
- C8: no. It is a non-regression case over unchanged code.
- The step line has no check of its own beyond the look. The look could pass on a second hub whose path holds no symbolic link while I1 stays.
- Item 1: yes, as C2 and C6.
- Item 2: no for the press. It names `openSourceFile` with the root, path and line.
- Item 3: yes.
  - The `.file` rule (`Findings.svelte:196-202`, `overflow: hidden; text-overflow: ellipsis`) cuts the span's own inline text.
  - A `ToolButton` is an inline-flex box (`ToolButton.svelte:139`) inside the inline-flex `.tip` of `Tooltip.svelte:301-304`. Its label is cut with an ellipsis only under the `cut` prop (`ToolButton.svelte:410-421`).
  - The tree's pattern for a plain file name cut at its end is `plain cut` inside an `inline-flex; min-width: 0` wrapper (`FolderFiles.svelte:96-101,131-135`, `Referrers.svelte:77-78,115-119`).
  - A `.file` span kept around the button with `overflow: hidden` also clips the plain button's focus ring, which sits 1 px outside its words (`ToolButton.svelte:458-460`).
  - The row is `flex-wrap: wrap` (`Findings.svelte:174-181`). By reading, a long name and the chip are likely to wrap onto two lines rather than the name being cut beside the chip, so "RootChip's `max-width: 50%` already holds it" rests on a layout the brief has not looked at. This is a judgment from reading the CSS; the look settles it.
  - Item 3 can therefore be "kept" by leaving the class while the name is not cut.
- Item 4: no.
- Item 5: no, read against the code.
- Item 6: yes. The dictated content "a press on a row's file opens it at the finding's line" would be false for the rows no root holds (C4, C5), which stay plain words. "carries that hub's chip" leaves out C6, where the chip names a repository folder.
- Item 7: no.

Findings:
- Q1. Item 3 does not name `cut` and the wrapper pattern. As written, it could pass with the name hidden or clipped rather than cut at its end, and with the focus ring clipped.
- Q2. Item 6's sentence, as dictated, is false for rows no root holds and silent on repository folders.
- Q3. C2 and item 1 can pass by reading while a hub behind a symbolic link gets no chip and no control (I1).
- Q4. C3 and C7 have no look (C-1).

## 6. Implied inputs

- I1. A root whose folder path passes a symbolic link, so `real` differs from `dir`. Missing. It has happened on any macOS scratch HOME under `/tmp` or `/var`; `realpath /Users/axelfaes/workspace/research-hub /Users/axelfaes/workspace/oculus` shows Axel's own roots are not links. `readOtherHub` writes `join(root.dir, HUB_FILE)` (`index.ts:649`), and `fileUnder` matches only `real ?? dir` (`paths.ts:187`). The probe prints `null` for such a file. Expected result: the chip of that hub and a control that opens the file. Reaching it needs `fileUnder` to match `dir` as well as `real`. That changes `src/lib/data`, which item 7 excludes, so the step would widen. This is for Axel as an open item.
- I2. A finding whose `file` is empty. Missing. The probe prints `{"root":"main","path":""}`, so under item 2 the row would draw a control that opens path `''` of the primary. `pushedBoards` builds a refused board's file as `pushed?.from[key] ?? ''` (`src/routes/views.ts:106`), which is the page's own `registry.refused()` channel. By reading, `from.boards` is set whenever `boards:` is a map, so the empty file has not been seen. Expected result: no chip and no control for an empty file.
- I3. oculus's own `config/` findings while oculus's folder is a root. Missing as its own case. It has happened: `research-hub.yml:7` (`oculus`, `~/workspace/oculus`) and `:13` (`oculus-state`, `~/.oculus`). Expected result: the chip `oculus` (or `oculus-state` for an apps state or local finding), and a control opening `config/...` under that root. The chip's tooltip words are wrong (N1).
- I4. A finding whose `file` is a folder: `options-folder.ts:134`, `join(dir, OPTIONS_DIR)`, the `defined_twice` finding of `options`, `option_groups` or `option_descriptions`. Missing. With oculus's folder a root (I3), item 2 would draw a control that opens a source tab on the folder `config/options`. Expected result: unstated. Either no control for a folder, or the control opens the folder in Files. The brief should name which. `config/text/server.yml:414` `is_a_folder: The path {0} is a folder` is the refusal a source tab would likely meet; this is not verified by a run.
- I5. Two roots nested: `theaxec.github.io` at `~/workspace/research-hub/side-projects/theaxec.github.io` under the primary `research-hub` (`research-hub.yml:3,8`). Missing as a case; decision 4 states the rule. The probe prints `"/w/repo/x.yml" -> {"root":"inner",...}`. Expected result: the inner folder's chip, and a press that opens the file under the inner root.
- I6. A workspace with no primary and an absolute file under a hub root. Missing; C5 covers only a relative file. Expected result: every row whose file a root holds draws that root's chip (`RootChip.svelte:31`, `primary() ?? ''`) and a control.
- I7. A finding of the apps channel. Missing. `scan.ts:136,159` names `join(folder, 'app.yml')` or the apps state file. Expected result: a machine app under `~/.oculus` gets the chip `oculus-state` when that folder is a root and is plain otherwise; a root's app gets that root's chip and a control.
- I8. A finding of the page's own `registry.refused()`. Missing. Its files are the file of `boards:` (`views.ts:106`) or of `collections:` (`listFileOf`, `index.ts:405-409`: oculus's `sources.yml` or the hub's `.oculus/config.yml`). Expected result: as I3 for oculus's file, as C1 for the primary's.
- I9. A row's keyboard reach. Missing, and the report's before/after section does not name it, although spec.md counts "focus and tab stops, keys" as visible.
  - The Files rows carry no `data-card` (`Findings.svelte:133`), so the shell's arrow keys and Enter (`key-dom.ts:61-73`) step only through Audit rows.
  - Expected result: each Files row's control is one tab stop, Enter or Space opens the file, the focus ring is visible (Q1), and the arrow keys behave as today. The look should check this.
- I10. A root whose `real` is empty (a folder entry that does not exist, `fs.ts:419`). Missing. `fileUnder` skips it (`paths.ts:188`; probe `"/x/y.yml" -> null`). Expected result: plain words as C4.

Findings: I1, I2, I3, I4, I5, I6, I7, I8, I9 and I10 are missing from "Cases". I1, and N1 behind I3, need a widening, which is an open item for Axel. The others are cases with the expected results above.

## 7. ADRs

- `ls docs/adr` prints "ls: docs/adr: No such file or directory". There are no records, and `.agents/plan.yaml` names no `adr` key.

Findings: none.

## 8. Dictated text

- The brief dictates no line of user-facing text or comment verbatim. Items 5 and 6 describe what the head comment and the HELP sentence say, without giving their words.
- The brief reuses two catalog lines:
  - `audit.open_place_tip`, `Open {0}`. It is item 2 in the brief (`grep -n "open_place_tip" .scratch/migration/agents/briefs/O139.md` prints its lines in "What is on the tree", "What to build" item 2 and Decisions 3), and its text is at `config/text/views/system/audit.yml:27`. Holds.
  - `hubs.root_tip`, `This record is from the hub served as {0}`, reused through RootChip by item 1 (`grep -n "RootChip" .scratch/migration/agents/briefs/O139.md`). For a C6 row and for an I3 row it states a falsehood, which breaks the rule in CLAUDE.md "Plain prose" (state the fact) and the rule in spec.md "What every package obeys" that a sentence the change makes false is a defect (N1).
- The content item 6 dictates for `docs/HELP.md:345` is false for rows no root holds (Q2).

Findings: the reuse of `hubs.root_tip` on non-hub rows (N1), and item 6's content (Q2).

## Declined to judge

- Whether the press should keep a tab (`openSourceFile`, as the Audit place does, `AuditSection.svelte:150-154`) or show the preview tab as the Problems panel does (`openPlace`, `context.ts:631`, `place.ts:76-80`). Ruling 658 says "as the Audit section's place does", and the brief follows it.
- The exact rendering of a long name beside a chip in the wrapping row (Q1). I judged it by reading the CSS and did not render it, since a builder runs no page and this check runs none; the look settles it.
- O135's "under review" state. The state file's dispatch block shows no review row, and I did not open the O135 review files.
- Open item 661 (the rules file's ban on editing under `.scratch/` against the report path `.scratch/migration/agents/reviews/O139-report.md`). It is already booked in `orchestrator-state.md:186` for every step.

Agent usage: ad33f715e7392d653, claude-opus-5-5, 193285 tokens, 80 tool uses, 9 min 13 s.

## Closed

Each finding closed in `agents/briefs/O139.md`, with Axel's ruling 662 for the three the stop raised:

- N1: ruling 662 1 (a): item 2, decision 5, C2, C6, C11; RootChip.svelte and findings.yml added to the paths.
- I1: ruling 662 2 (a): item 7, C9, C16, C19; `paths.ts` lines 170-195 added to the paths; the premise names `real ?? dir` (P3).
- I4: ruling 662 3 (a): items 3 and 8, C12; `options-folder.ts` lines 125-140 added to the paths.
- P1: the search's line is 91.
- P2, C-2: the worktree and the base copy are named at the top.
- C-1, Q4: C3 and C7 are in the look list.
- C-3: verify 3 gives the perl form over src and config and the grep form over docs.
- Q1: item 3 names `plain cut` and the wrapper that keeps the focus ring; item 4 says the name gives way first; C18.
- Q2: item 10's sentence covers a root that is no hub, a folder, and a file no root serves.
- Q3: C9 and the case-run program.
- I2: item 1 and item 3 leave an empty file plain; C10.
- I3: C11. I5: C13. I6: C14. I7: C11's apps state finding. I8: C15. I9: item 5 and C17. I10: C16.
- Section 1's note on `AuditSection.svelte:30-31` (no fill under the pointer on a Files row) is a sentence the step does not change; left as it stands.
- The case-run program replaces "No script is written to run the cases", as the rules file allows.
