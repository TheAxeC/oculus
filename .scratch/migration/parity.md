# Parity ledger: what each cockpit tab has that the oculus view does not

Read from the cockpit's built page on 127.0.0.1:8787 and the oculus page on 8790, on 2026-09-11, tab by tab, by extracting each tab's controls, card structure and headings. This file is the source for the parity packages; a row is struck through here when its package lands. "The cockpit does it" is not the argument for any row: each row is a fact Axel reads on the cockpit tab today and does not find on the oculus view, and the oculus design ("Layout as data", the primitives, the write path) is what each package builds it with.

## Focus (O22 landed as a shell of the tab)

- No "Command center" heading; the cockpit's ticker sits under that heading, in two CSS columns (`column-count: 2`), with the HPC pill at the right (the pill is O26's, the heading and the columns are not).
- No action buttons on any ticker line. The cockpit draws, per line: `1w`, `1mo`, `hide` (snooze a project's or entry's date), `un-snooze`, `done` and `del` on a subtask, `done` on a follow-up, the lifecycle statuses of an events entry (`planned`, `not-attending`, `completed`) and of an education entry (`ongoing`, `completed`).
- No "Needs attention" group (the inbox count) and no "Refresh live data" group (the lit watch, inbox and scout run dates) and no position-lead deadlines: the feed files are not read. A feed summary (counts and dates) is small and belongs here; the feed views themselves stay in O25.
- No quick add ("+ follow-up", "+ deadline" on a chosen project).
- The lede is the cockpit's subtitle (`working_now_sub`) drawn as the first line with its leading dash; the cockpit draws it under the lanes' cluster header as a subtitle.
- The priority flame is drawn only when set; the cockpit draws it always, faint when unset, and a click cycles it (unset, low, med, high). oculus has a menu instead.
- No drag of a card onto a lane; oculus has a menu. The cockpit has both a drop target per lane and the ideas grid as a drop target.
- The band's cards carry no note line (the cockpit draws the entry's first sentence under the title) and no date badge glyph.
- No career panel (moved to O22b; it belongs on this board as the collapsed panel at the foot, with the host status buttons `awaiting`, `warm`, `candidate`, `drafted`, `dropped`).

## Projects, Archive, Coauthor (O10 landed the board; the tab has more)

- No stats strip above the board (`51 active | 11 submit-ready | 0 blocked | 3 dated | venue counts`).
- No "+ new idea" control (creates an idea manifest).
- No "stale" and "deadline" quick filters beside the search.
- No rollup badges (`active 5 | manuscript 15 | idea 31` as filter toggles; oculus has the rollup as a facet only).
- No "expand all" and "collapse" bulk controls.
- Per card, missing: the pin control, "+ subtask" and the subtasks block with its done, del and snooze buttons, the per-project file finder ("Files (N)" with its filter box and the list of files with sizes), the `next` line on the collapsed card (`lnext`), the focus pill as a control.
- The Archive tab's category badges (`published 18 | nogo 3 | dropped 2 | disproved 1 | phd 1`) as filter toggles.

## Collections: funding, events, education, applications, collaborations, tasks, statements, code (O14d landed a generic read-only view)

- No Funding view at all: the schemes are a registry entity and `registerCollections` registers the snapshot's collections only. The cockpit's Funding tab is the collection view over `funding/funding.yml` with the statement field.
- No "+ add" control (a new entry from the file's own schema), no edit control per entry (the entry editor form over the schema), no pin, no "+ subtask" and subtasks block, no status action buttons (the entry's lifecycle statuses from `status_palette`), no drag grip for reordering.
- No cross-links from an entry to the projects that name it (the cockpit's `xlg` groups: "5 active | 1 active | 4 manuscript" with goto links), no folder links, no rendered note (Markdown).
- No intro text per collection (the file's `intro:`).
- Venues and Data views absent (O24; the cockpit's Venues tab groups journals and conferences with a theme facet and the timeline; the Data tab has the modality facet, the per-dataset recovery command and "+ add").

## Sessions

- The cockpit's static tab is a placeholder filled in served mode; oculus's six views carry what the cockpit's served Sessions tab showed and more (terminals, transcript). No parity gap found from the static build; the served cockpit tab was not compared line by line.

## Header bar and tabs

- The cockpit's top bar: Cmd-K search over everything, Chat, Update (the tasks: scout, litwatch, linkedin, inbox), Slides, Present, "+ status", the built date, the theme toggle. oculus has the theme toggle in the rail and nothing else of these; Cmd-K and Update belong with the feeds (O25), Chat and Present are not planned.
- Tab badges (counts on Projects, Archive, Coauthor, Inbox, Position Leads, Live HPC): oculus's rail carries no counts.

## Not yet ported at all (planned)

Inbox, Lit Watch, Position Leads, LinkedIn, Data, the Update action and the Cmd-K search (O25); Live HPC (O26); Map, Programs, Domains, Venues (O24; Funding is P4); Memories, Help, Audit, Config, and the three document tabs of the cockpit's More group, Research approach, Agent approach and the HPC how-to (O28; `config/layout.yml`'s bookmarks hold only the cathedra and game-engine manuals today, so none of the three is reachable from the rail). The list is the cockpit's own: `PRIMARY_TABS` at `page.py` line 631, the `more` group at `data/config/layout.yml` line 22, the document tabs at lines 122 to 124.
