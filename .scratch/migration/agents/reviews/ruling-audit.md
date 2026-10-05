247 rulings booked as Axel's were read, counted with `awk '/^## Rulings/{p=1;next} /^## /{p=0} p' plan.md | grep -cE '^- (Z[0-9]+|Open item).*\(the user\)\.?$|^- Z[0-9]+ \([0-9-]+, the user\)'` run in this folder; 4 of them are findings (Z466, Z532, Z143, Z488).

The count is 240 lines that end in "(the user)" plus 7 lines that carry the marker in their head, "(2026-10-05, the user)": Z466, Z467, Z468, Z472, Z473, Z532 and Z533. The second form was read as well, since Z466 itself has it. Z533 was added to `plan.md` while this audit ran and was read.

What was compared: where the plan line or `orchestrator-history.md` / `choices.md` holds Axel's words in quotation marks, the booked text was compared with them. Where his answer is recorded as an option letter or "agreed" and the options as put to him are on file (in the history entry, in `choices.md`, or for Z78 to Z88 in commit 528b3d11's `orchestrator-state.md`), the booked text was compared with the option he chose. The rest are listed at the end.

## Z466

Axel's words (`plan.md:1191`): "the fucking blame, star, all that crap is in the tab row stuff????? Like wtf?????" and "I want you to fucking fix this, send it back to a fucking builder". His own reading of them, booked as Z532 (`plan.md:1247`): "off the tab into the fucking breadcrumb".

Booked wording that departs from them: "The tab row carries only what VS Code's title actions carry for the active editor: Open Preview to the Side on a Markdown file, Split, and the `...` menu. Save and Revert leave the strip (Cmd+S and the palette, as VS Code); the star, Open in Program and Open in a browser tab go to the tab's right-click menu and the file row's menu; Blame goes to the palette and the status bar, as VS Code's Git blame; Open Source on the Markdown preview tab is removed, a file being opened by opening it."

The departure: his words ask for the actions to leave the tab row; the booked text sends them to the palette, the menus and the status bar, and also removes Open Source from the Markdown preview tab and keeps Open Preview to the Side on the tab row, none of which he said. The correction sentence added to the line disowns only "the palette, menus and status bar placement"; the removal of Open Source and the tab row's Open Preview to the Side still stand under his name, and `X3f-round3.md` still builds the status bar's blame on Z466 (see Z532).

Briefs that carried it (`grep -rln 'Z466' agents/briefs/`):
- `agents/briefs/X3f-round2.md`: item 4 (the tab row), its line 30 ("Open Source leaves the Markdown preview tab"), cases 11, 14 and 17. Built, landed at 5f9640b2a and taken back out of main by Axel's reset (`plan.md:194`).
- `agents/briefs/X3f-round3.md`: line 16 ("Open Preview (a Markdown file shown as source) or Open Source is not added (Z466)"), line 18 ("The tab row keeps only what Z466 gives it: Open Preview to the Side on a Markdown file, Split and the `...` menu. The palette rows, the tab's right-click menu and the file row's menu keep the entries round 2 gave them."), item 4 (the status bar's blame, "(Z466)"). Dispatched as X3f's round 3 (the state file's dispatch block, `round: 3`); not landed.
- `agents/briefs/D23.md`: lines 55 and 733-735 copy the whole Z466 line under "The scope as ruled". D23 not landed.
- `agents/briefs/X3e.md`: line 37, through Z508 ("the tab row of Z466"). X3e not landed.

Step X3f is not ticked as landed in `plan.md` (its line, `plan.md:192`, carries no checkmark).

## Z532

Axel's words (`plan.md:1247`): "off the tab into the fucking breadcrumb" and "FIX THID FUCKING GARBASGE".

Booked wording that departs from them: "X3f is fixed in round 3 (`agents/briefs/X3f-round3.md`), Z531's blame on HEAD and index tabs and the status bar's blame folded in."

The departure: "the status bar's blame" is the Blame placement Z466 booked ("Blame goes to the palette and the status bar"), which Z466's own correction names as the orchestrator's reading and not his ruling. Z532 books it back as part of his ruling, and round 3's item 4 builds it: the status bar shows the caret line's blame whether or not the editor decoration is on, cited "(Z466)". His words say nothing about the status bar.

Briefs that carried it: no brief names Z532 by number (`grep -rln 'Z532' agents/briefs/` prints nothing). `agents/briefs/X3f-round3.md` carries its content, as "Axel's ruling" at line 7 and as item 4. Dispatched, not landed (X3f unticked, `plan.md:192`).

## Z143

Axel's words: "include terminals", recorded at `orchestrator-history.md:368` ("The per-kind limit and the landing order are the orchestrator's reading of 'include terminals', reversible"), given with option (5), which `orchestrator-history.md:367` words as: "the pane stays if that tab was a view opened for something (a file, a document, a project) and the page holds no other empty pane" and "never more than one empty pane".

Booked wording that departs from them (`plan.md:866`): "at most one empty pane of each kind per page, documents landing in the document one first".

The departure: option (5) keeps at most one empty pane on a page; the booked text allows one per kind, so a page can keep an empty document pane and an empty terminal pane, and it adds a landing order. The history says both are the orchestrator's reading; the plan line books them as his ruling with no such note.

Briefs that carried it (`grep -rln 'Z143' agents/briefs/`): `agents/briefs/L4.md:16` ("at most one empty pane of each kind per page; documents land in the document one first"). L4 is landed (`plan.md:156`, its line ticked with the checkmark).

## Z488

Axel's words (`plan.md:1213`): "This goes for literally everything".

Booked wording that departs from them: "D44's Submit is a control in the open `.slurm` file's editor title bar, as VS Code's Run, never a separate view; D11's breakpoints stay in the editor's glyph margin and its `.oculus/launch.yml` opens in the editor".

The departure: the quote names no placement; the booked text places D44's Submit in the editor title bar, and the state file's standing demand built on Z488 (`orchestrator-state.md:145`) lists "its title bar, its gutter, its marks, a tab beside it" as the places a file feature goes. In oculus a VS Code title action is drawn on the tab row (Z466's own text maps "VS Code's title actions" to the tab row), the row Axel had a file tab's actions taken off in Z532. Not settled by the files: whether his message, of which only this sentence is recorded, named the title bar. `orchestrator-history.md:52` lists the placement under "Axel" with no quote; his message would settle it.

Briefs that carried it (`grep -rln 'Z488' agents/briefs/`): `A3.md`, `E4.md`, `O30.md` and `D20.md` cite it and say it does not apply; `X3e.md` (lines 32 and 118-120) reads every item against it with the title bar among the places. D44's placement is carried by its step line, `plan.md:508` ("Submit sits in the open `.slurm` file's editor title bar (ruling Z488)"); D44 has no brief yet. None of A3, E4, O30, D20, X3e or D44 is landed (none of their lines in `plan.md` is ticked with the checkmark).

## Rulings with no quote found

No quotation of Axel and no record of the options as put to him were found for these in `plan.md`, `orchestrator-history.md` or `choices.md` (a history entry that only restates the booked text, written at the booking, is not counted as his words):

Z53, Z54, Z55, Z56, Z57, Z58, Z59, Z60, Z61, Z62, Z63, Z64, Z65, Z66, Z67, Z68, Z89, Z92, Z146, Z147, Z148, Z151 review, Z154 review, Z166, Z167, Z168, Z181, Z186, Z187, Z190, Z196, Z215, Z217, Z241, Z252, Z253, Z257, Z260, Z263, Z266, Z267, Z268, Z269, Z270, Z271, Z272, Z273, Z290, Z291, Z340, Z346, Z380, Z390, Z391, Z392, Z393, Z394, Z395, Z396, Z397, Z398, Z399, Z400, Z401, Z402, Z403, Z404, Z408, Z410, Z416, Z419, Z421, Z423, Z424, Z425, Z489, Z490, Z491, Z492, Z498, Z499, Z500, Z501, Z502.

Of these, the text contradicts a later ruling without saying so in its own line in these cases:
- Z58 (Q86c removes a pushed node's speed at a contact, with the slide case as its test) is superseded by Z60 (a); `orchestrator-history.md:514` says so, `plan.md`'s Z58 line does not.
- Z391 (about 1,500 test cases in all) is contradicted by Z409, Z413 and Z414 (one test per unit, the sweeps landing at about 18.9k lines of tests); Z391's line is not marked.
- Z396 (for each entry the one test that holds it is kept) is replaced by Z409 ("in place of one test per entry"); Z409 says so, Z396 does not.
- Z340 (the collection forms redesigned) is replaced by Z343 (M6 is the removal of the collection form); Z340 is not marked.
- Z253 says "Z251 is ruled after ten landings under these rules"; Axel ruled Z251 on 2026-10-03, the next day (`orchestrator-history.md:147`). Whether ten landings had passed was not checked.

The other supersessions in the list (Z291 by Z368, Z421 replacing Z363's 30 s, Z423 by Z472, Z416 widening Z399 to Z402, Z407's step folded by Z416) are stated by the later ruling or the state file and change nothing Axel said.

## Checked and not settled

Z367 books "while the sweeps run no other step is dispatched beyond finishing X3c and Q116" on Axel's elided words "Yes ... 4 would run the 4 sweeps and then T1a after" (`orchestrator-history.md:140`). The question he answered is not on file (not in the parent of commit 32836f901), so the pause cannot be compared with what he was asked. Axel later ruled Z370 (a) on that reading.
