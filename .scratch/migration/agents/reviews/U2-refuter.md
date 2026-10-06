# Refuter report: U2, the look of every view against VS Code

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2`, base 26272633. The outputs are under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2/tools/oculus/.scratch/migration/agents/reviews/`: `U2-vscode.css`, `U2-audit.md`, `U2-shots/` and `U2-report.md`.

## Verification lines (re-run this turn, from `tools/oculus` in the worktree)

1. `grep -c '^## ' .scratch/migration/agents/reviews/U2-audit.md` prints `58`.
   - `grep '^## ' ... | tail -2` prints `## Common differences` and `## Proposed grouping`.
   - The first 45 headings were diffed against HELP.md's table with `files` and `repositories` removed (`grep '^| `' HELP.md | cut -d'|' -f2 | tr -d ' `' | awk 'NR<=47'`, 45 lines). The diff prints nothing, `exit 0`.
   - Headings 46 to 56 are `customization deposit doc document editor file note person project slides source`.
2. V2 (every VS Code value names a line) was not re-run as a script. I checked a sample against the source instead; see case 3.
3. `LC_ALL=C grep -c '[^ -~]'` prints `.scratch/migration/agents/reviews/U2-audit.md:0` and `.scratch/migration/agents/reviews/U2-vscode.css:0`.
4. `ls .../U2-shots | grep -cE '^(config|inbox|...|gallery)-'` prints `0`. `ls U2-shots | wc -l` prints `97`.
5. `tmux list-sessions` prints `oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)` and `oculus-d0935c-shell: 1 windows (created Thu Oct  1 00:04:02 2026)`. This matches the list the report recorded.
6. V6 (History lists no write) was not re-run by me; see case 10.
7. Worktree state:
   - `git status --short` prints only the 4 untracked outputs: `U2-audit.md`, `U2-report.md`, `U2-shots/` and `U2-vscode.css`.
   - `git diff 26272633 --stat | wc -l` prints `0`, so no source file changed.
   - `wc -l` prints 1139 for the audit, 1105 for the css and 77 for the report. These match the report.

## Verdicts on "What to build"

1. `U2-vscode.css`: **holds**. Its groups and the js-constants group (lines 1088-1105) are present. I checked 50 css lines and every js constant against VS Code 1.137.0 (sample under case 3). The minor citation faults are in finding S1.
2. `U2-audit.md`, 56 sections with the fixed set and both widths: **violated**. See findings B1 (doc), B2 (customization), B3 (agents narrow), B4 (hpc "does not exist"), B5 (History rows), P1 (icon size), P2 (file natural size), P3 (usage overflow) and B6 (the Customizations 404 defect, used and not reported).
3. The two closing sections: **violated**. The header-wrap measure holds. The theme-switch measure, and Group 8 that rests on it, fail: findings P4, P5 and B1/B2 (the views it says were not reached).
4. Shots, one pane each, none of the excluded views: **violated** on content. The excluded-name check passes and every shot shows one pane. But `search-results.png` shows Claude Code session-transcript paths and lines, which the brief keeps out of shots (finding S2). Further private content is flagged in S3.

## Verdicts on the cases

1. Each view has a section with the fixed set: **partial**. Findings B3 and B5.
2. Empty and error states where reachable, with the attempt named where not: **partial**. Findings B1, B2 and B4.
3. Every VS Code value cites a line: **met**, on a sample.
   - The sample is 50 css lines: 14, 21, 67, 73, 76, 78, 83, 84, 85, 86, 105, 111, 114, 133, 237, 241, 252, 255, 257, 272, 275, 276, 277, 292, 309, 365, 368, 372, 382, 386, 391, 403, 406, 437, 442, 493, 494, 508, 564, 757, 764, 782, 789, 793, 803, 814, 826, 1067, 1073 and 1085.
   - Each line was found verbatim, once, in VS Code's `workbench.desktop.main.css`, after normalising spacing around braces.
   - The audit's value matches the line in every case.
   - The js constants 1089-1105 were all found in `workbench.desktop.main.js`. For example, `getHeight(){return 22}` occurs 6 times, `ITEM_HEIGHT=22` occurs 5 times and `var QQt=22` is the pane header height.
   - The minor faults are in S1.
4. The 31 noted views were looked at again: **met**.
5. Config measured by computed styles only: **met**. No config shot exists (`ls U2-shots | grep -i config` is empty), and the audit's settings and config entries use computed values.
6. No local.yml before any screenshot: **not verifiable** for shots already taken. The report itself says the per-shot check is "not re-provable now". Throughout my session, no pane showed Config.
7. tmux sessions unchanged: **met** (V5).
8. A missing-data state is named with its attempt: **partial**. B1, B2 and B4 name wrong attempts or reasons.
9. No files or repositories section, and settings is `## settings`: **met**. `grep -nx` finds `## settings` at line 813 and no `## files` or `## repositories`.
10. History lists no write: **not verifiable** by me. I did not open History's full list. The report's read gives the newest entry as 09-30 18:28 and the first shot as Oct 1 07:09. The History section of the audit has its own defect (B5).
11. Common differences holds the header wrap and the theme switch, each measured: **partial**.
    - Item 1, the header wrap, covers 27 views. My re-measures of present and gallery reproduce it, and it plausibly covers every view with header tools.
    - Item 2, the theme switch, was measured only on one source tab. Doc and customization are called unreached, but both are reachable (B1, B2). Its cause is confounded (P4).

## Spec

- **B1. doc is reachable read-only, and the report's reason is wrong.**
  - Where: `U2-report.md:39`, `:48`; the audit's `## doc` section; Common differences item 2.
  - What is wrong: the report says "the Views catalogue group headings are plain `h3`, not links, so no group opens a document". In fact the catalogue lists the hub documents as buttons.
    - `src/lib/views/system/workbench/Catalogue.svelte:227-246` renders `{#each section.docs as entry}` buttons with `onclick={(event) => open(DOC_VIEW, state, event)}`, and `DOC_VIEW='doc'` is at line 79.
    - `config/layout.yml:178-181` declares three docs (Research approach, Agent approach, HPC how-to) in group help.
    - HELP.md line 70 documents the h1-h5 chords that also open hub documents.
    - `catalogue-wide.png` stops at the HELP heading under which these buttons sit.
  - Failure scenario: the populated doc view, and its theme-switch behaviour, go into the build steps unmeasured. Axel is told it cannot be reached when one click reaches it.
- **B2. customization is reachable without a write.**
  - Where: `U2-report.md:40`, `:49`; the audit's `## customization`.
  - What is wrong: the `open(item)` function in `src/lib/views/sessions/session-list/Customizations.svelte:85-100` opens a source tab only when `rootHolding(currentWorkspace(...).roots, item.path)` matches. Otherwise it calls `openView('customization', ...)`.
    - `~/.oculus/workspaces.json` has the single root `/Users/axelfaes/.claude`.
    - Picking Codex in the agent Menu sets only instance state. A `~/.codex` item (`~/.codex/AGENTS.md` exists) then falls outside every root and opens the customization view.
    - The builder tried the Claude, gmail and hub chips only.
    - I did not open it on screen. The path is read from the code.
  - Failure scenario: as for B1, one view's populated state and its theme behaviour are missing from Common differences item 2.
- **B3. agents has no populated narrow state, and no reason is given.**
  - Where: `U2-audit.md:557`; `U2-report.md:43`.
  - What is wrong: the populated state (session S2, 100 agents) was measured at wide only. The window resize to about 309 px that the builder used for every other narrow look reaches it without a write.
  - Failure scenario: the narrow row and header of the populated agents list, which the brief requires, are absent from the audit.
- **B4. The hpc empty state exists in code.**
  - Where: `U2-report.md:42`; `U2-audit.md:632` and `:642`.
  - What is wrong: the audit says "empty state does not exist (the poll always yields the table or the error)". The code has two empty states:
    - `src/lib/views/system/hpc/Hpc.svelte:68-69` shows `<Empty message={t('hpc.fetching')} />` while `status === 'starting'`;
    - `src/lib/views/system/hpc/Jobs.svelte:46` shows `<Empty message={t('hpc.no_jobs')} />` for an empty queue.
    - `Head.svelte:58` also has `hpc.queue_empty`.
  - The correct row is "exists, unreachable while the cluster is unreachable". The starting state needs a fresh server, which the rules forbid.
  - Failure scenario: a build step skips the hpc empty states because the audit says there are none.
- **B5. History's populated rows are not measured.**
  - Where: the audit's `## history` (line 777 onward).
  - What is wrong: the section was measured with the filter set to "transcript". It reports "row none reached" and the text "No writes are recorded yet." But rows exist: the report's own end-of-audit History read lists entries from 09-30 and 09-29.
    - Showing "No writes are recorded yet." while a filter hides the rows is a misleading empty text. It is not listed as a difference.
  - Failure scenario: History's row height, hover actions and filtered-empty wording never enter the grouping.
- **B6. A defect seen and used, but not reported.**
  - Where: `U2-report.md:54` (`source-error.png`, "Cannot open: HTTP 404").
  - What is wrong: the Customizations rows for `~/.claude/agents/ordo-*.md` are symlinks into `/Users/axelfaes/.local/share/ordo-stable/agents/` (`ls -la ~/.claude/agents/`). `rootHolding` accepts the path, but the server's realpath check refuses it, so the source tab shows HTTP 404.
  - The audit uses this as source's "error state" and does not report it as a bug.
  - Failure scenario: every Ordo agent definition listed in Customizations fails to open, and nothing books it.

## Proof

- **P1. Icon sizes are rounded, and a question to Axel rests on the rounding.**
  - Where: the audit's "12 x 12 px" and "14 x 14" throughout; Common differences item 19; `U2-report.md:13`.
  - What is wrong: every svg I measured is 11.5 x 11.5 px (Lucide at 1em of 11.5px), and 13.5 in places.
  - Failure scenario: the open question to Axel, Lucide at 12 px against codicons at 16 px, is given a figure that was not measured. The gap is 4.5 px, not 4.
- **P2. `file-wide.png` natural size.**
  - Where: the audit's `## file` (line 943).
  - What is wrong: the audit gives a "natural size about 890 x 120 px". The shot shows the picture drawn scaled to about 1380 px wide.
  - Failure scenario: a sizing difference is judged on a wrong figure.
- **P3. Usage overflow at narrow is missing from the list.**
  - Where: Common differences item 14 (narrow overflow).
  - What is wrong: at a 309 px pane, the Usage "Last seven days" table scrolls horizontally (scrollWidth 609 against clientWidth 285, measured by me on TEST). Usage is not in the item's list.
  - Failure scenario: Usage is left out of the overflow fix group.
- **P4. The theme-switch measure is confounded by a hidden tab.**
  - Where: Common differences item 2; `U2-report.md:70` and `:77`.
  - What is wrong: TEST's Chrome tab reads `document.visibilityState` "hidden" and ran 0 requestAnimationFrame callbacks in 1.5 s, measured by me with javascript_tool. Monaco paints in rAF, so "did not repaint on its own, only at the next captured frame" is what any rAF renderer does in a hidden tab.
  - The brief's premise (old colours kept until reload) is therefore neither confirmed nor refuted. The report's "premise not borne out" overstates the result.
  - Failure scenario: Axel rules on a defect that may not exist, or dismisses one that does.
- **P5. Group 8 of Proposed grouping proposes a build step on the cause left undetermined in P4.**
  - Failure scenario: a builder is briefed to fix a repaint that may be an artifact of measuring in a background tab.
- **Re-measures that hold.** I re-measured 11 views on TEST by computed styles. Except for P1 to P3, all agree with the audit.
  - At 479 px: Map, Help, Audit, Usage, Present, Gallery.
  - Narrow, with the window resized to 1000 and the pane at 308.7 px:
    - Present: header 69.5, title 43.7;
    - Gallery: header 69.5, tools 240 x 56.5;
    - Help: header 30.3, list 18.8;
    - Usage: header 30.3.
  - Wide, with pane 2 maximised to 1454 px:
    - Usage: rows 29.8, thead 26.3;
    - Sessions: header 35, rows 44, input 1422 x 25.3;
    - Search: header 30.3, `li.hit` 25.8, input 144 x 25.3;
    - Lit Watch: header 38.3, tools 26 x 19.6, rows 25.3 and 19.3;
    - Joint work: header 38.3, rows 19.3/25.3/29.3.

## Standards

- **S1. Citation faults (minor).**
  - `U2-vscode.css:1091` is labelled as the explorer's constant, but the first match of its grep is in `chatListTreeTemplate`.
  - `css:1073` is the agentSessionsWelcome grid hover, cited as a generic row hover.
  - `css:946`, `css:1006` and `css:1054` are group comment lines cited as counterparts, which are not values.
  - Failure scenario: a builder copies a value from the wrong component.
- **S2. A shot shows transcript content.**
  - `search-results.png` shows hit paths and lines under `~/.claude/projects/-Users-axelfaes-workspace-ordo--agents-worktrees-2b-7/...`, which are Claude Code session transcripts, and `paste-cache/e21b7ddddc325b2a.txt`.
  - The brief keeps transcript content out of shots. The visible lines are rule text, with no secret seen.
  - `timeline-narrow.png` also shows the first prompt line of another session ("In oculus, scratch, Z103 (the 42 shap...").
  - Failure scenario: transcript content is committed into the repository when U2-shots lands.
- **S3. Private content in shots beyond the brief's list, flagged for the landing.** The report names only Usage.
  - `usage-narrow.png` and `usage-wide.png`: confirmed to show two account email addresses (<REDACTED>, <REDACTED>), plus this session's id and a running cost.
  - `applications-narrow/-wide`: private job applications with employer names, despite the crop.
  - `leads-narrow/-wide`: position leads with "applied" controls.
  - `focus-narrow/-wide`: the positions list with deadlines, and an email-reply count.
  - `funding-narrow/-wide`: grant applications and rejections.
  - `education-narrow/-wide`: MSc students' names and thesis topics.
  - `events-wide`: a host name for a research visit.
  - `project-wide`: a group-leader application mentioned in a card.
  - `joint-work-narrow`: collaborator names (no email seen).
  - `changes-wide`: a `/Users/axelfaes` path.
  - A person-view tab label naming a third party in `editor-wide`, `note-wide`, `file-wide`, `slides-wide`, `source-wide` and `project-wide`.
  - No token, key, secret or local.yml content was seen in any of the 97 shots. `account-setup` shows empty client ID and secret fields.
- **S4. Report table rows.**
  - Row "Config measured by computed styles only" is marked DONE while its own text says the per-screenshot check is "not re-provable now".
  - Row "Header wrap measured per view" counts 27 views without saying which views have no header tools.

## Behaviour

- **State left on TEST, read from the DOM with javascript_tool:**
  - Pane 0 has 9 tabs: Status, Files, Repositories (current), Map, Help, Present, Memories, Transcript, Live HPC.
  - Pane 1 has git-parse.ts (X3d's diff view) and Staged Changes (current).
  - Pane 2 has 49 tabs. In order: Deposit, History, Hub document, Focus, Projects, Pillars, Domains, Coauthor, Archive, Venues, Data, Code, Statements, Funding, Talks & Events, Education & Service, Applications, Joint work, Tasks & Service, Search, Lit Watch, Position Leads, Inbox, Sessions, Findings, Gallery, Usage, Audit, Calendar, Settings (current), Config, Account setup, Views, Pages, LinkedIn, Timeline, Session, Changes, Agents, Customization, Status, Map, Help, Present, Live HPC, Memories, Transcript, CLAUDE.md (Source), ordo-high.md (Source).
  - Seven views are duplicated between panes 0 and 2. The report's "about 18 extra" cannot be checked, since no before-list was kept.
  - The Search view still holds its results. The Config tab is present but not current, and not mounted as visible.
- **Every shot shows one pane** with its tab strip and the named view. Exceptions:
  - `deposit-populated.png` is a 479 px pane, not narrow or wide.
  - `file-theme-switch.png` is a source tab of `idea.md`, as the report says.
  - `tasks-wide.png` carries a session toast, and `search-narrow.png` a shell toast, both disclosed.
- **My own actions on TEST, all restored:**
  - tab switches;
  - one window resize to 1000 and back to 1512 x 944;
  - one Maximise pane and Restore panes on pane 2;
  - keyboard focus moves on the tab strip, with `document.activeElement` confirmed by JS, and one Enter on the Settings tab.
  - Final `.tab.current` per strip: Repositories, Staged Changes, Settings. I did not write to storage, call fetch, change Appearance, or click Config.

## Declined to judge

- Whether History contains a write made during the audit (case 10): I did not read its full list.
- Whether the past per-shot local.yml checks were made (case 6).
- The token names that Proposed grouping Groups 2 and 3 cite (`--button-font`, `--input-radius`): not verified against `themes/`.
- How many of the pane 2 tabs the audit opened: no before-list exists.
- Group 6, which defers to a ruling on one view: buildable once ruled. I make no judgment on the ruling itself.
- The other 6 groups of Proposed grouping each name their differences, views and reason, and read as buildable. I did not trace each group's views back to every audit line.

## Usage

- All 97 PNGs were read.
- 11 views were re-measured by computed styles on TEST.
- 50 css lines and the js-constants group were checked against VS Code 1.137.0.
- The code was read for doc, customization, hpc and the Customizations open path.
- Context used: about 440k tokens of the budget in this session's current window. The total across the compacted earlier window was not counted. The number of tool calls was not counted.

Usage (the completion notice): claude-opus-5-5, 89,273 tokens, 212 tool uses, 18.3 min.


## Repair round 1, refuted

Reviewer of `refute` over U2's repair round 1. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2`, base 26272633. Outputs read under `.../U2/tools/oculus/.scratch/migration/agents/reviews/`: `U2-audit.md` (1139 lines), `U2-vscode.css` (1105), `U2-report.md` (112, written 09:39:06), `U2-shots/` (100 PNGs). I changed no file. On TEST I only switched tabs, opened two views and closed them again, and cleared one filter and typed it back (listed under Behaviour).

### Verification (rerun from `tools/oculus` in the worktree)

```
git status --short        -> ?? .../U2-audit.md, ?? .../U2-report.md, ?? .../U2-shots/, ?? .../U2-vscode.css
git diff 26272633 --stat | wc -l   -> 0
V1 grep -c '^## ' U2-audit.md      -> 58
   grep '^## ' ... | head -56 | cut -c4- | diff - ids.txt  (ids.txt: HELP.md 98-146 ids minus files, repositories, then the 11; 56 lines) -> no output, exit 0
   tail -2 -> "## Common differences", "## Proposed grouping"
V2 every cite: grep -o 'css:[0-9]*' U2-audit.md | wc -l -> 537 numbered (plus one bare "css:N" in line 3's legend)
   each of the 69 distinct cited lines below 1086, braces normalised, counted in VS Code 1.137.0 workbench.desktop.main.css (python str.count):
   "69 lines; found once: 68 more: 1 missing: 0"; control string with 23px -> 0
   js constants in workbench.desktop.main.js: getHeight(){return 22} 6, ITEM_HEIGHT=22 5, chatListTreeTemplate 1, var QQt=22 1, [Ust] default:8 1, minimumWidth=170 2, qmo=dt?12:14 1, editor fontSize dt?12:14 1, rTi=dt?1.5:1.35 1
   no cite points at a blank or /* line below 1086
V3 LC_ALL=C grep -c '[^ -~]' -> U2-audit.md:0, U2-report.md:0, U2-vscode.css:0
V4 ls U2-shots | grep -cE '^(config|inbox|calendar|memories|transcript|terminal|session-detail|linkedin|person|gallery)-' -> 0
V5 tmux list-sessions (09:40:54 and 09:52:08) -> oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)
   (the report's line 37 also lists oculus-d0935c-shell; it is gone)
V6 wc -l < ~/.oculus/changes.jsonl -> 27; last entry "at":"2026-09-30T16:28:35.611Z"; file mtime Sep 30 18:28
   ls -lT ~/.oculus/bookmarks.yml -> Sep 25 05:05:32 2026
Shot fates: kept list 54 + cropped list 44 + new 2 -> diff against ls U2-shots: no output (all 100 accounted, no overlap)
sips eq_btfno.png -> 1628 x 235 (matches P2)
TEST (javascript_tool, tab 812136282, before my first action): vis "visible", hasFocus true, rAF 98 in ~1 s, window 1512x944 at screenY 38; again later: vis "visible", rAF 103
```

### Verdicts (whole diff since the base)

Items of "What to build":
- 1, `U2-vscode.css`: holds. Every cited stylesheet line is in VS Code 1.137.0 and every js constant is there. It does not contain VS Code's generic list-row hover (finding Standards 2).
- 2, `U2-audit.md`: violated. Rulings B1 to B5 and P1 to P3 reproduce: I re-measured doc, customization and History myself. Three things still fail: two sections state crops their shots do not have (Spec 1, Spec 2), the search error state names no attempt (Spec 3), and three cites name the wrong line (Standards 1 to 3).
- 3, closing sections: violated. Item 2 (the theme switch) is still unmeasured, and a visible tab with animation frames running was available at my reads (Proof 1). Group 8 rests on that measure.
- 4, shots: violated. Shots show content that may not be committed (Standards 4), and two shots hold more than one pane (Spec 4).

Cases:
- 1: met. History's populated rows reproduce on TEST: 27 `li`, at 479 px 58 to 122 px high, padding 4px 0, line-height 22.5px, row background transparent while hovered, Undo 65x25.3 and pill 80x21.3 at opacity 1. I did not re-measure agents at narrow (see Declined).
- 2: partial. The hpc empty states are now written correctly. The search error state is written as unreachable with no attempt named (Spec 3).
- 3: partial. See Standards 1 to 3.
- 4: met.
- 5: met. V4 prints 0, and `ls U2-shots | grep -ic config` printed 0 in the report. No shot shows the Config view; Config appears only as a tab label in settings, account-setup and pages shots.
- 6: not verifiable for the first pass's shots. For this round's shots the report says the check was made before each, and I cannot re-prove that. In my session no pane had Config as its current tab before my screenshot or zooms.
- 7: not verifiable. `oculus-d0935c-shell` (created Oct 1 00:04, before the audit) was gone by 09:40:54, 2 minutes after the report listed it as present (Proof 2).
- 8: met.
- 9: met. V1 holds, and `## settings` is present.
- 10: met. The change log has 27 entries, the newest 2026-09-30 18:28 local. `bookmarks.yml` is unchanged since Sep 25, so the audit created neither bookmark. That settles the report's "not verified" line 104.
- 11: partial. The header wrap is measured. The theme switch is not (Proof 1).

### Findings

**Spec**

1. `U2-audit.md:853` ("customization-narrow.png, customization-wide.png (the populated state, cropped to the header and tab strip, because the body is a rule file ...)"), `U2-report.md:56` ("customization-narrow.png (header crop)") and `:84` (lists customization-narrow as "Kept whole").
   - What is wrong: `customization-narrow.png` is 494x261 and shows the first lines of the body of `~/.codex/AGENTS.md` ("# Global rules (apply in every project and session)", "## ABSOLUTE RULE ... never publish negative/null results"). The section's reason for the crop is not met, and the report contradicts itself about this shot.
   - Failure scenario: Axel's private global rule file text is committed with U2-shots, while the audit tells the lander it was cropped out.
   - Verdict: item 2 and item 4 violated.
2. `U2-audit.md:183` ("`code-wide.png` to the header, intro and chips; the other cards list repository names and addresses, so their measures are by computed styles only").
   - What is wrong: `code-wide.png` (931x305) shows four repository cards, with names, GitHub addresses and "Visibility: private" on `research-hub` and `game-engine`.
   - Failure scenario: private repository names and addresses are committed while the section says they were cropped out.
   - Verdict: item 2 and item 4 violated.
3. `U2-audit.md:233` ("Error state: none reached") and `U2-report.md:50` ("not produced by any query that can be run without a write").
   - What is wrong: case 2 requires the attempt to be named. A read-only attempt exists and is not named: the regex toggle with an invalid pattern. Whether it produces an error state is not verified.
   - Failure scenario: the search error state stays out of Group 7 on an untested "unreachable".
   - Verdict: case 2 partial.
4. `U2-shots/doc-wide.png` (928x345) and `file-wide.png` (928x200).
   - What is wrong: both include the left rail with its badge counts as well as the pane. Brief item 4 says "A shot is of one pane only".
   - Failure scenario: a reader compares chrome outside the view as if it were the view's.
   - Verdict: item 4 violated.

**Proof**

1. `U2-report.md:3`, `:42`, `U2-audit.md:1090` ("the window is occluded and a visible tab could not be had") and Group 8 at `:1137`.
   - What is wrong: at my reads the TEST tab was visible, with focus, at 1512x944, running 98 and then 103 animation frames per second. The round's third branch ("if a visible tab cannot be had") therefore no longer applies. The measure can be taken now through Settings' Theme control. I did not switch the theme.
   - Failure scenario: Group 8 stays "waiting" and Axel rules on the grouping without the one measure that decides whether Group 8 exists.
   - Verdict: item 3 violated, case 11 partial.
2. `U2-report.md:37` ("tmux list-sessions prints ... oculus-d0935c-shell ...").
   - What is wrong: at 09:40:54 and 09:52:08 only `oculus-a5f844-shell` is listed. d0935c predates the audit. Who ended it, and whether it was still alive at 09:39, is not known. Case 7's claim that the audit left other terminals alone rests on this line.
   - Failure scenario: the lander books case 7 as met on a list that no longer holds.
   - Verdict: case 7 not verifiable.

**Standards**

1. `U2-audit.md:424` ("the agent sessions list (css:812, css:1055)") and `:462` ("css:1055 to css:1074").
   - What is wrong: ruling S1 replaced the comment-line cite css:1054 with the next line. css:1055 is `.monaco-workbench:not(.agent-sessions-workbench) .interactive-item-container.interactive-request.editing .chat-request-timestamp-container { ... padding-inline-end ... }`. That is a chat-request timestamp rule outside the agent sessions workbench, and it holds no row value. The first agent-sessions list rule in the group is css:1066 or css:1067.
   - Failure scenario: a builder reads padding from a chat edit timestamp as the session row.
   - Verdict: case 3 partial.
2. `U2-audit.md:22` and `:530` (css:1073 kept, relabelled as "the welcome grid row hover tint of the agent sessions list").
   - What is wrong: ruling S1 said to cite the line that holds the value for the element compared. The focus and timeline rows are still compared against the agent-sessions welcome grid. VS Code's generic `.monaco-list .monaco-list-row:hover{background-color:var(--vscode-list-hoverBackground)!important}` is in `workbench.desktop.main.css` (found by grep) and not in `U2-vscode.css`, which the builder could have extended. The closure is a relabel, not a correction.
   - Verdict: item 1 holds with this gap, case 3 partial.
3. `U2-audit.md:790` ("VS Code names the filter in its filtered-empty message and centres it with 40px top padding at 70% opacity (css:14)").
   - What is wrong: css:14 holds the centring, the padding and the opacity. Nothing in `U2-vscode.css` holds "names the filter". The wording came from the round's ruling, but case 3 forbids writing it as VS Code's without a line.
   - Verdict: case 3 partial.
4. Shots with content ruling 12 excludes, all looked at with Read:
   - `events-narrow.png` (kept whole): the AAAI 2027 card "BT-FNO target ... attend". It ties Axel to a submission under double-blind review.
   - `customization-narrow.png` and `code-wide.png`: see Spec 1 and Spec 2.
   - Lower weight, and inconsistent with the session-list section's own rule of cropping out titles that come from prompts:
     - session titles "Z103 shapes options" in `agents-narrow.png` and `changes-narrow.png`;
     - "S2 status" in `timeline-wide.png`, `agents-wide.png` and `doc-wide.png`;
     - the agent task "Build Q85a4, zod in five folders" in `agents-wide.png`;
     - account labels "gmail + uhasselt" in `usage-wide.png` (no email address is visible).
   - No email address, token, home path, Config body or `local.yml` was seen in any of the 100 shots. The session-list shots show the Customizations block collapsed, with no home paths.
   - Failure scenario: these are committed when U2-shots lands.
   - Verdict: item 4 violated.
5. `U2-report.md:55` and `:109`.
   - What is wrong: ruling B1 said to replace the old reason. Line 109 restates the first pass's wrong reasons for doc and customization, and misstates the round brief as saying "only". This is narration of a wrong turn, which spec.md "Report" excludes.
   - Failure scenario: a reader takes the first pass's reasoning as part of the end state.

**Behaviour**

1. The Archive tab (`U2-report.md:3`, `:78`).
   - Read from the DOM: pane 2 of TEST holds 30 tabs (Deposit ... Calendar, *Settings, Config) with no Archive tab. Panes 0 and 1 are as the report gives them.
   - In `oculus.layout.v1` (read only), the TEST page holds no `archive` instance. The one `archive` instance in storage (id 846b227c...) is on the page labelled "Page 1". Whether it is the tab TEST lost cannot be told without the earlier id.
   - The first-pass shots `history-wide.png`, `deposit-wide.png` and `doc-empty-wide.png` (07:40) show the pointer resting on the Archive tab, with its tooltip and close control drawn. That shows the pointer was there; it does not show a click.
   - `U2-audit-notes.md` line 7 shows the orchestrator looked at archive before the audit. So a tab the audit did not open is gone, which ruling 14 said to keep, and it is not reopened.
   - Cause not established.
2. My own actions on TEST, all restored. At the end, `.tab.current` per strip was Repositories, Staged Changes and Settings, and `document.activeElement` was BODY. The actions:
   - h then 5 with BODY focused. This opened "HPC how-to" in pane 1, which I measured and closed with its close control.
   - Sessions selected by a JS click. Customizations set to Codex, `~/.codex/AGENTS.md` opened (it appeared after Config in pane 2), Settings reselected, AGENTS.md closed while not current, the agent set back to Claude.
   - Audit tab selected once by a misclick.
   - History selected. Its filter, with focus confirmed, cleared by Backspace over the selected text and "transcript" typed back.
   - Config was never selected. I wrote no storage, made no fetch and changed no Appearance value.
   - Re-measures that agree with the audit:
     - doc at 481 px: header 30.25, `h1` 24px/700/36 px, links 12.5px/14.5 px, `div.doc` max-width none, padding 0, 0 svg, 0 Monaco.
     - customization at 479 px: header 30.25, title 106 px, no tools; `pre` 11.5px monospace, line-height 17.25px, padding 0, pre-wrap; 0 Monaco.
     - Settings: 72 svg at 11.5 px.

### Declined to judge

- B3 (agents at narrow) and P3 (usage overflow at 309 px): not re-measured, since both need the window resized.
- Whether `project-wide`/`project-narrow`, `editor-*`, `map-wide`, `slides-*`, `file-*` (the BT-FNO equation) and `leads-wide`'s intro ("9 live | 2 expired") may be committed. They show unpublished research plans, dataset details and lead counts, none of which is in ruling 12's list. This is Axel's call.
- Whether the audit opened the LinkedIn tab it closed: no record of its origin.
- The report's open items quote Z138 from the base state file. On main the open-items list is now empty, since Z138 has been ruled. This is a fact about timing, not a builder defect.
- The first pass's per-shot `local.yml` checks (case 6).

Reviewer usage: tokens not counted; about 130 tool uses; about 15 minutes (09:38 to 09:53).


## Repair round 2, refuted

Reviewer of `refute` over U2's repair round 2. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2`, base 26272633. I changed no file. On TEST I ran read-only `javascript_tool` reads in tab 812136282 and clicked and typed nothing. I did not switch the theme.

### Verification (rerun from `tools/oculus/.scratch/migration/agents/reviews` in the worktree)

```
git status --short                      -> ?? U2-audit.md, ?? U2-report.md, ?? U2-shots/, ?? U2-vscode.css
git diff 26272633 --stat | wc -l        -> 0
wc -l                                   -> U2-audit.md 1138, U2-report.md 118, U2-vscode.css 1106
ls U2-shots | wc -l                     -> 88
V1 grep -c '^## ' U2-audit.md           -> 58
   the 56 ids in order compared with the brief's list -> equal; the last two headings are "Common differences" and "Proposed grouping"
   grep -c '^Fixed set:' / '^Better and kept:' / '^Counterpart:' / '^Error state:' -> 56 each; '^Re-measure against the notes' -> 32
V2 css:N tokens in U2-audit.md          -> 539 tokens, 78 distinct lines, 0 out of range
   lines below 1087 (before the js block), whitespace normalised: every cited line is present in VS Code 1.137.0 workbench.desktop.main.css; none is blank or a comment
   lines 1089 to 1106: each "first match" string occurs in workbench.desktop.main.js (count 1; 'ITEM_HEIGHT' and 'getHeight' lines are counts, 'minimumWidth=170' occurs 2 times)
   css:1106 text: grep -oF of its own quoted string in the js -> 1 match
V3 LC_ALL=C grep -c '[^ -~]'            -> U2-audit.md:0, U2-report.md:0, U2-vscode.css:0
V4 ls U2-shots | grep -cE '^(config|inbox|calendar|memories|transcript|terminal|session-detail|linkedin|person|gallery)-' -> 0
   ls U2-shots | grep -ic config        -> 0
   ls U2-shots | grep -vc '\.png$'      -> 0 ; ls -d U2-shots/originals -> No such file or directory
Shot sets: the report's "cropped or new" 35 + "unchanged" 53 vs ls U2-shots (88): no overlap, none missing, none extra
sips: the 35 sizes in the report's "Cropped or new" list -> 0 mismatches against pixelWidth x pixelHeight
15 removed shots + search-results: each absent from U2-shots; the audit names usage-wide, map-wide and search-results only as removed
audit png names vs disk: no png cited that is absent, except the removed ones above; no png on disk is uncited
tmux list-sessions (10:31:45)           -> oculus-a5f844-shell: 1 windows (created Wed Sep 30 14:19:19 2026)
wc -l < ~/.oculus/changes.jsonl         -> 27 ; newest "at":"2026-09-30T16:28:35.611Z" ; ls -lT ~/.oculus/bookmarks.yml -> Sep 25 05:05:32 2026
TEST (javascript_tool, tab 812136282): visibilityState "visible", hasFocus false, activeElement BODY
   body rgb(241, 245, 249); localStorage oculus.ui.v1 theme "light", codeTheme "tokens"; no .monaco-editor in the DOM at the read
   pane 0, 9 tabs, current Repositories: Status, Repositories, Map, Help, Present, Memories, Transcript, Live HPC, Files
   pane 1, 2 tabs, current Staged Changes: tools/oculus/src/lib/server/core/git-parse.ts, Staged Changes
   pane 2, 31 tabs, current Settings: Deposit ... Calendar, Settings, Config, Archive (last)
Premise 2.1: grep of workbench.desktop.main.css for '.monaco-list .monaco-list-row:hover{background-color:var(--vscode-list-hoverBackground)!important}' -> 2 hits, each after a parent selector (.chat-artifacts-widget .chat-artifacts-list ..., .interactive-session .chat-summary-list ...); no unscoped form
   the same rule is generated in workbench.desktop.main.js: .monaco-list${e}:not(.drop-target):not(.dragging) .monaco-list-row:hover:not(.selected):not(.focused) { background-color: ${o.listHoverBackground}; } (1 occurrence)
```

### Verdicts (whole diff since the base)

Items of "What to build":
- 1, `U2-vscode.css`: holds. Every cited stylesheet line is in VS Code 1.137.0 and every js constant is there. `css:1106` holds the generic list row hover (Premise 1 below). Standards 3 names the row-action reveal rules the file lacks.
- 2, `U2-audit.md`: violated. The 56 sections, the fixed set and the Z144 crops are in place. The cites still name rules of the wrong element (Standards 3), and `source` calls a home-folder file a hub file (Standards 1).
- 3, closing sections: holds. Common differences item 2 and Proposed grouping agree: "No difference", 7 groups, no Group 8, and no stale "waiting" text remains (`grep -n -i 'group 8\|occluded\|waiting on'` finds nothing). Item 2 carries one scope gap (Proof 1).
- 4, shots: violated. `source-narrow.png`, `source-wide.png`, `present-narrow.png` and `present-wide.png` still show content of the kind Z144 and ruling 12 exclude (Standards 1 and 2).

Cases of "Cases":
- 1: met. 56 `Fixed set:` lines, one per section; I did not re-measure each value.
- 2: met. The search error state is reached (regex toggle on, `(`, Return) and measured: `error: unclosed group`, `.empty` 455 x 39 px. `search-error.png` shows the toggle row, the hint and the message. Findings and Deposit errors are written as unreached with reasons; hpc's empty states exist in code and are unreachable here.
- 3: partial. Every cite resolves to a line that exists. Many name a rule of another element (Standards 3).
- 4: met by the 32 "Re-measure against the notes" lines; not re-measured by me.
- 5: met. No Config shot; V4 prints 0.
- 6: not verifiable for the first pass's shots, as the report says. In my session no pane had Config current; pane 2's current tab is Settings.
- 7: not verifiable. The list now holds only `oculus-a5f844-shell`. The report states that `oculus-d0935c-shell` (created 2026-10-01 00:04) was listed earlier and is gone, and claims nothing about the cause.
- 8: met.
- 9: met. V1 holds and `## settings` is present with S3 as its first line.
- 10: met. The change log has 27 entries, the newest 2026-09-30 16:28 UTC. `bookmarks.yml` is unchanged since Sep 25.
- 11: met on the audited views, with Proof 1. The switch back to light holds: body rgb(241, 245, 249) and `oculus.ui.v1` theme "light".

### 1. Spec

- Premise departure 1, the generic row hover: confirmed. The rule is not unscoped in the css file; it is generated in the js (see the last verification line). `css:1106` quotes that source with a grep that matches once. `U2-audit.md:22` and `:530` cite it for the focus and timeline row hovers. The generated rule excludes `.selected` and `.focused` rows, and the comment line quotes that. This departure is sound. The report's first line calls it "Brief item 8", which is the round brief's Standards 2; wording only.
- Premise departure 2, the tmux list: `U2-report.md:3`, the first-read item 3 and the DONE row state only the list at 10:23:21 (I read the same list at 10:31:45), that `d0935c` was listed earlier and is gone, and that the cause is not known. This is the end state, not a defect.
- `U2-shots/customization-wide.png` (928 x 16): a 16 px strip holding a clipped icon and the word CUSTOMIZATION. The brief asks for one shot per view state looked at, and this one supports no measure. Low weight. Failure scenario: a reader opens it expecting the populated wide state and finds nothing to compare. No verdict.
- Otherwise: none.

### 2. Proof

- `U2-audit.md:1090` (Common differences item 2): "No difference: switching the theme in Settings repaints the application and an open Monaco editor on its own".
  - What is wrong: the measure is on one Monaco instance, the `build.py` source tab. Brief What to build 3 and Z142 (2) name an open code or diff editor. The diff editor was not measured (X3d owns `repositories` and its diff, and the audit's own line says "Views that hold Monaco: source only"). The claim is stated for every editor.
  - Failure scenario: Axel rules on the grouping with Group 8 gone. If the diff editor still keeps the old colours after a live switch, as Z142 saw at X3d's landing, the difference has no build step. At my read no `.monaco-editor` was in the DOM, so I could not reread it, and I did not switch the theme.
  - Verdict: none. Item 3 holds for the audited views. The text should say "on the source tab" or measure the diff.
- The rest of the round's claims reproduce:
  - theme light in `oculus.ui.v1`;
  - 539 cites and 78 distinct lines;
  - the 35 sizes;
  - pane tab lists, 9 / 2 / 31.

### 3. Standards

- Standards 1, `U2-shots/source-narrow.png` and `U2-shots/source-wide.png` (verdict: item 4 violated):
  - Both show the open file `NEVER-TAKE-THE-LAZY-OPTION.MD` in full: the editor and the rendered preview of its 11 lines.
  - `ls ~/.claude/rules/never-take-the-lazy-option.md` exists, and `grep -rl '^# Never take the lazy option'` over the hub finds no copy. So this is Axel's global rule file under the home folder.
  - `U2-audit.md` source section (State line) calls it "a hub `.md` rule file". That claim is false by those two commands.
  - Round 1 treated `customization-narrow.png`, which showed the body of `~/.codex/AGENTS.md`, as private rule text to crop. The same standard applies here.
  - Failure scenario: the file's text is committed with U2-shots while the audit calls it a hub file.
  - Axel can rule that rule-file text is committable. Z144 lists no such class, but the round 2 crop of `customization-narrow.png` set the precedent.
- Standards 2, `U2-shots/present-narrow.png` (618 x 1468) and `present-wide.png` (931 x 470) (verdict: item 4 violated, borderline):
  - Both show the title slide of Axel's research-portfolio briefing: "A dozen active projects spanning brain, heart, liver and immunity", the thesis on block-term tensor structure, and the lane labels.
  - The `present` State line says only "slide 1 of 23". It does not say the shot was kept as a decision, and the shots are uncropped.
  - Failure scenario: the portfolio thesis of an unpublished briefing is committed. Ruling Z144 lists "project plans" and "unpublished research". Whether a thesis slide counts is Axel's call, but the report's claim that all 88 were checked against the whole list does not mention it.
- Standards 2, lower weight (a call for Axel, not a verdict). These shots show counts and descriptions from the portfolio:
  - `status-narrow.png`, `status-wide.png`: Projects 94, Venues 71, Datasets 54, Funding schemes 11.
  - `code-narrow.png`, `code-wide.png`: "deposited 13 | review-anon 1 | no deposit 40".
  - `radar-narrow.png`, `radar-wide.png`: "561 tracked".
  - `archive-*`, `coauthor-*`, `projects-*`, `joint-work-*`, `tasks-*`: status counts.
  - `education-*`: the intro naming institutions and evaluation roles.
  - Z144 lists "lead counts" and "dataset details" but no portfolio counts. I checked each shot and found no names, emails, home paths, session titles, task names, account labels, AAAI card or equation. Those Z144 items are clean.
- Standards 3, cites that resolve to a line but not to the element compared (case 3 partial, item 2 violated):
  - `css:86` is the pane header's action reveal (`.monaco-pane-view .pane:hover>.pane-header.expanded>.actions`). It is cited 31 times as VS Code's reveal of row and card actions, for example `U2-audit.md:349` ("the hover actions of tree rows (css:86)"), `:788` (History rows, "VS Code reveals row actions on hover"), `:1098` (item 6, every collection view).
    - VS Code's stylesheet has the row rules, for example `.customview-tree .monaco-list .monaco-list-row:hover .custom-view-tree-node-item .actions{display:block}` and `.open-editors ... .monaco-list-row:hover>.monaco-action-bar{visibility:visible}`. They are not in `U2-vscode.css`.
    - This is the same class as the generic row hover that round 2 Standards 2 closed for two cites.
    - Failure scenario: a builder of Group 5 copies the header reveal rule onto card actions.
  - `css:826` is `.message-box-container{line-height:22px;padding-left:20px}`, the Problems panel's message box. `:349` and `:386` cite it for "Problems list rows with 22 px lines". `css:824` (`height:100%`) and `css:812` (a 16px icon background) are cited as counterparts at `:27`, `:386`, `:424` and `:517` with no value in them.
  - `U2-audit.md:233` compares the search error to a notification item (`css:403`, `css:406`).
    - `css:286` in the same file is `.monaco-inputbox-container .monaco-inputbox-message`, the inline validation message of an input, which is the nearer element for an invalid pattern. The claim about what VS Code shows for an invalid regex has no cited evidence.
    - Failure scenario: Group 7's "error state a notification-shaped item" is built from a comparison nobody verified.
- Standards 4: the round 2 fixes read correctly:
  - the `css:1067` row cite;
  - History `:790` keeps only `css:14`;
  - the report no longer restates the first pass's reasons;
  - 0 non-ASCII bytes.

### 4. Behaviour

- Pane 0 of TEST holds Files last; before the audit it stood second. The cause of its disappearance is not established, the report says so, and I cannot establish it from the DOM. Pane 2 holds Archive last of 31 tabs; its earlier position is not known. Settings, Repositories and Staged Changes are current. Config was not selected by me. Failure scenario: a Files tab reopened as a new instance loses the filter text the orchestrator's looks saw on it ("Deposit"). That is a state change on Axel's TEST page the report names but cannot explain.
- The TEST page keeps the audit's footprint, which the report's "Things to know" lists: the History filter `transcript`, the Search view showing `error: unclosed group` in place of earlier results, and the Customizations block expanded. `oculus-d0935c-shell` is gone, with the cause unknown. None of these is a hub write: the change log and `bookmarks.yml` are unchanged.

### Declined to judge

- Whether any first-pass shot's `local.yml` check was made before the shot (case 6): it cannot be re-proved.
- Whether the audit ended `oculus-d0935c-shell` or something else did: no record to read.
- The Monaco repaint timings (183, 168, 394 ms) and the three theme switches: I did not switch the theme, and no Monaco was open at my read. I confirmed only the end state (light) and the stored colours' consistency.
- Whether portfolio counts and rule-file text may be committed: Axel's call (Standards 1 and 2).
- Each of the 56 sections' individual values (rows, paddings, counts): I rechecked cites and structure, not the measures, except those the report names. My own re-measures were not repeated this round.
- The pre-audit position of the Archive and Files tabs: no earlier read exists.

Reviewer usage: tokens not counted; about 60 tool uses; about 30 minutes (10:27 to 10:35).

## Closed

The findings of the run over repair round 2, each fixed at landing on main (2026-10-01) or stated:

- Spec, `customization-wide.png` (a 16 px strip): not committed; the customization State line (`U2-audit.md:853`) says no wide shot of the populated state is committed and why.
- Proof, Common differences item 2 measured one Monaco instance: the diff editor was measured at the landing on TEST (a side-by-side diff of `U2-audit.md` from the Repositories view; both sides `vs` to `vs-dark` and back in the same frame as the page body); `U2-audit.md:1090` states it. No difference, so Group 8 stays out of the grouping.
- Standards 1, `source-narrow.png` and `source-wide.png` show the text of a rule file in the home folder: not committed; the source State line (`U2-audit.md:1035`) names the file as `~/.claude/rules/` and says those measures are by computed styles.
- Standards 2, `present-narrow.png` and `present-wide.png` show the portfolio thesis slide: not committed; the present State line (`U2-audit.md:354`) says why.
- Standards 2, lower weight: `education-narrow.png` and `education-wide.png` not committed (the intro names institutions and evaluation roles); the education State line (`U2-audit.md:278`) says so. The portfolio counts in the status, code, radar, archive, coauthor, projects, joint-work and tasks shots are committed: Z144's classes are session or agent titles, task names, account labels and unpublished research, and a count is none of them; the shots were looked at with the Read tool at landing and show no title, name or path.
- Standards 3: `U2-vscode.css:1107-1115` adds VS Code's own row-action reveal rules (a tree view row, Open Editors, the terminal tabs list, the Problems list), copied from the installed 1.137.0 stylesheet; the 29 cites of `css:86` for row and card actions now cite `css:1109, css:1110`, and `css:86` stays only at `:9` and `:1056`, the header actions; the Problems row cites `css:832` (its 22 px `line-height`) at `:27`, `:349`, `:386`; the Timeline cites at `:424`, `:517` name the tree row `css:1089` and the Timeline section as setting no row height; the search error (`:233`) and difference 13 (`:1112`) cite the input message `css:286` as the nearest element and say VS Code's display of an invalid regex was not measured; group 7's error state names `css:286` and `css:826`.
- Behaviour 1, the Files tab of TEST's pane 0 reopened last: the cause is not established; stated in the landing report.
- Behaviour 2, the audit's footprint on TEST (the History filter `transcript`, the Search view's `error: unclosed group`, Customizations expanded): left on TEST, a workbench page; the landing added a diff tab of `U2-audit.md` in pane 1. Stated in the landing report.
