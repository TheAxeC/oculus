# Refuter report: U2, the look of every view against VS Code

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2`, base 86e6d8bb. The outputs are under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/U2/tools/oculus/.scratch/migration/agents/reviews/`: `U2-vscode.css`, `U2-audit.md`, `U2-shots/` and `U2-report.md`.

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
   - `git diff 86e6d8bb --stat | wc -l` prints `0`, so no source file changed.
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
