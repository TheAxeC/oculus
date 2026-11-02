# O122, cases ruled before the build

The builder's first run handed back three cases and one risk. Each ruling below replaces the brief's text where they differ.

1. **A caret and a shift-click (S1).** Option (a). The function of item 8 stays as G149 says: a collapsed selection gives none. The window also keeps the row holding a collapsed caret, beside the row holding the focus, computed apart from that function. So a shift-click from a caret at the head over rows never drawn selects from the caret, and Copy gives every turn's text. The count case reads: at most the rows in view, plus the margin, plus the rows kept by a selection, a caret or the focus.

2. **A session switched away and back (S2).** Option (a). The case reads: a switch to Live and back, and a switch to another tab of the pane, keep a run's press; a tab that takes another session opens at the foot, and its other session's foot is right. A target change in one tab empties the choices, as `tab-session.svelte.ts:6-10` states and as now. That file is not written.

3. **The foot and a slow scroll up (S3).** Option (a). Item 6's first sentence is replaced: a flag `following` says the reader stands at the true foot. `toFoot`, a first draw, and a scroll reaching the true foot within 1 px set it. A scroll that moved up from where `toFoot` put it, or a press on a run, clears it. A height change goes to the foot only while `following`, and otherwise `hold` runs. `stuck`, with `SLACK`, keeps deciding what an appended turn does, as now. Following the newest turn sets `following` through `toFoot`.

4. **PageUp, PageDown and Home over unmeasured rows (R1).** Option (a). Build as ruled, and the report names this as unverified. The look at landing presses each key over unmeasured rows, and a key that falls short is fixed at landing.

5. **The fragment link (P1).** `marked` gives a Markdown heading no id, so the case is read for a heading with an `id` written as raw HTML, and the look's fixture uses one.

The builder's judgment calls J1 to J7 stand as its first run states them, each named in the final report. J4 rests on the browser's frame order, so the report lists it for the look.

`docs/glossary.md` does not exist; the report's terms part says so.
