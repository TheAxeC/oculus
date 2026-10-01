# U2 audit of the look of every view against VS Code

Every VS Code value in this file is followed by `css:N`, the line N of `U2-vscode.css` (a stylesheet rule or a js-constant comment line) that holds it. Every oculus value is a computed style or a size read in Axel's Chrome on the TEST page of `http://localhost:8790/`, written as element, property and value with units.

State of every look unless a section says otherwise: theme light, text size 1. Narrow is a pane of 309 px (window 1000 px wide, three panes). Wide is a pane of 1454 px (window 1512 px, one pane maximised). Hover and focus were read at the wide width, plus a 479 px pane for the Deposit, project card and Search results states. A shot named `<id>-narrow.png` or `<id>-wide.png` is one pane in `U2-shots/`. A shot shows the view's header, controls and empty or error text only; where a view's body shows session or agent titles, account labels, unpublished research or lead counts, the section says the shot is cropped or removed and its measures are by computed styles only.

Shared oculus measures used throughout, each measured on `ui/frame/Pane.svelte` and the primitives: pane header `.header` height 30.3 px without tools and 38.3 px with a 25.3 px tool (padding 6px 12px, `h2` 11.5px weight 700 uppercase letter-spacing 0.46px line-height 17.25px); text tool `.tool` 25.3 px high (11.5px, padding 3px 8px, radius 6px, border 1px); icon tool `.tool` 26 x 19.6 px (padding 3px 5px, radius 6px, border 1px, 11.5 x 11.5 px svg); `.opener` 27.3 px high (padding 4px 6px, radius 6px); `.disclosure` pill 21.3 px high (padding 1px 8px, radius 999px); text input 25.3 px high, 144 px wide in a header (11.5px, padding 3px 8px, radius 6px); select 23.5 px high; focus ring outline 2px solid rgb(189,93,56) offset -2px; card radius 10px with a 3px coloured left rule; body text 11.5px and 12.5px, card title 15px weight 700, micro labels 8.5px, 9.5px and 10.5px.

Shared VS Code values: pane header height 22 px, 11px, weight 700, uppercase, title on one line cut with an ellipsis (css:73, css:76, css:78, css:67); header actions 16 x 16 px codicons in a 2px label padding, 4px apart, shown on hover or focus-within (css:133, css:85, css:84, css:86); part title 35 px (css:105); list and tree row 22 px (css:1089, css:1090, css:1091); tree indent 8 px and twistie 16 px (css:1095, css:21); text button 12px, line-height 16px, padding 4px 8px, radius 4px, border 1px (css:255); small text button 11px, padding 3px 6px (css:257); input box radius 4px with 4px 6px padding (css:276, css:277); count badge 11px, padding 3px 5px, radius 11px, min 18 px (css:309); focus outline 1px solid, offset -1px (css:368); body text in the content area 13px (css:114, css:1085); welcome view content padded 0 20px 1em, items centred (css:372); notification message line-height 22 px (css:406).

## focus

State: narrow 309 px and wide 1454 px, shots `focus-narrow.png`, `focus-wide.png`; the view held its populated lanes (papers, funding, other sections). Both shots are cropped to the header and the top of the Command center card; the lanes list deadlines, positions and funding, so the lane measures are by computed styles only.
Fixed set: row `li` 17.3 px (34.5 px for two-line items); indent none measured, group labels flush left; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none in the header, `.tool` 11 x 9.8 px chevrons x55 in the body; text button `.tool` 63 x 25.3 px and 58 x 25.3 px (11.5px, radius 6px); input none; badge `.act` 39 x 14.8 px (8.5px, radius 4px, border 1px, the DONE controls) x18; empty state `none` 12.5px, 39 px high, one line top left; error state none reached; hover actions none revealed, the controls are always drawn; focus ring 2px rgb(189,93,56) offset -2px on tools, and the item-name buttons take the browser ring outline auto 1px rgb(0,95,204) offset 0.
Rows: `li` 17.3 px against 22 px (css:1089); the lane card is a 39-instance `card` 74.8 px high with a 3px coloured left rule, radius 6px, padding 6px 8px, where VS Code has rows.
Indents: none measured against a tree indent of 8 px (css:1095) and a 16 px twistie (css:21); the lanes do not expand with a twistie.
Headers: 30.3 px, 11.5px against 22 px, 11px (css:76); section headings are accent coloured uppercase 9.5px weight 700 with a leading icon, where VS Code headers are one weight and one colour role (css:76).
Toolbars and actions: 11 x 9.8 px chevron `.tool` x55 against 16 x 16 px codicons with 2px padding (css:133, css:85); `.act` DONE controls 39 x 14.8 px at 8.5px against a text button at 12px and 26 px (css:255).
Spacing: no row padding; cards padded 6px 8px against row height 22 px (css:1089).
Type sizes: 11.5px x330, 10.5px x109, 12.5px weight 700 x68 (item titles), 9.5px weight 700 x25 (section labels), 8.5px weight 700 x21 against 13px (css:114, css:1085).
Icons: svg 11.5 x 11.5 px x121 and 9.5 x 9.5 px x55 against 16 px (css:241, css:252); placed before section headings, colour role accent.
Hover actions: row hover background transparent, the 57 to 92 px wide status buttons are always drawn at 15 px high, against actions revealed on hover (css:86) and the hover tint a VS Code list gives every row (css:1106).
Focus: ring 2px offset -2px against 1px offset -1px (css:368); the item-name buttons show the browser default ring 1px rgb(0,95,204), a second ring style in the same view.
Empty state: one 12.5px sentence, 39 px high, top left, with a 12.5 x 12.5 px glyph, against centred content with 20px side padding (css:372).
Error state: none.
Better and kept: the due-date grouping into lanes with a coloured rule carries status that a 22 px row cannot; the status buttons act in place.
Counterpart: VS Code has no due-date board. The nearest parts are the Explorer tree and the Problems list (css:949, css:824); the audit measures rows against the tree row (css:1089) and the section labels against the pane header (css:76).
Re-measure against the notes: note line 3 reads 46 text nodes at 11.5px, the measure is 330 text nodes at 11.5px (narrow and wide), and the DONE buttons are 14.8 px high where the note reads 15 px.

## projects

State: narrow 309 px and wide 1454 px, shots `projects-narrow.png`, `projects-wide.png`; 53 project cards listed, four columns at wide. Both shots are cropped to the toolbar and counts; the cards name co-authors, so the card measures are by computed styles only.
Fixed set: row `div.row` 21.3 px at wide; indent none; header 165.3 px at narrow (title cut to 16 px of 67 px), 40.3 px at wide, 11.5px weight 700 uppercase; toolbar action `.tool` 26 x 19.6 px x191 and `.opener` 26 x 19.6 px x53 (card controls), `.tool` 79 x 25.3 px x44; text button `.tool` 79 x 25.3 px; input search 144 x 25.3 px (11.5px, radius 6px); badge chip 86 x 21.3 px (radius 999px, filled, statuses) and 39 x 19.8 px (10.5px, radius 999px), the tab carries three count badges; empty state none reached (53 cards); error state none; hover actions none revealed, five card controls always drawn (26 x 20 px, radius 6px, border 1px, opacity 1 with the mouse away); focus ring 2px offset -2px on the search input.
Rows: no row list, cards 350 px wide in four columns (card radius 10px, 3px left rule) against 22 px rows (css:1089).
Indents: none against a tree indent of 8 px (css:1095).
Headers: the header holds 14 controls and wraps to 6 rows at narrow (165.3 px, title `P..`) and to 2 rows at wide (40.3 px, tools 1072 x 27 px); VS Code keeps the 22 px header on one line and cuts the title (css:76, css:67). See Common differences.
Toolbars and actions: header buttons 25.3 px high, radius 6px, padding 3px 8px against a text button of 26 px with radius 4px (css:255); toggle chips (active 5, manuscript 15, idea 33, Cards, Short) filled accent, 25.3 px high, radius 6px, where VS Code has toggles of 20 x 20 px with radius 3px (css:272).
Spacing: the path line in each card is 10.5px monospace and wraps mid-word x53.
Type sizes: card title 15px weight 700 x53, 11.5px x504, 9.5px weight 700 x141 (PILLAR, ELI5 labels), 10.5px x110 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x541 against 16 px (css:252).
Hover actions: a card hover changes background to rgb(248,250,252) only when hovered and is the same value when not hovered; actions are drawn at rest, against actions revealed on hover or focus (css:86).
Focus: ring 2px offset -2px against 1px offset -1px (css:368); the title button 92 x 23 px at 15px has no ring change.
Empty state: none reached.
Error state: none reached.
Better and kept: the card carries status, pillar, ELI5 and links in one place; the filter chips show live counts.
Counterpart: VS Code has no project board; the nearest is the Explorer tree (css:949) for rows and the Search view's result tree for counts (css:789, css:803).
Re-measure against the notes: note line 4 reads chips radius 6px at 20 px; the measure is radius 999px at 21.3 px for status chips and the 25 px filled toggles are radius 6px. Note line 4 reads a two-row toolbar with "collapse" alone on row 2; the measure at wide is 2 rows with 14 controls and at narrow 6 rows.

## coauthor

State: narrow 309 px and wide 1454 px, shots `coauthor-narrow.png`, `coauthor-wide.png`; 16 cards. Both shots are cropped to the tab and the header tools; the cards name co-authors, so the card measures are by computed styles only.
Fixed set: row `div.row` 85, 67.8, 21.3 and 79 px high; indent none; header 196.5 px at narrow (title `C..`, 17 px of 72 px), 40.3 px at wide; toolbar action `.tool` 26 x 19.6 px x48 and `.opener` 26 x 19.6 px x16; text button `.tool` 79 x 25.3 px x11 and link-style `.tool` 100 x 19.3 px (12.5px, radius 0, border 0); input search 144 x 25.3 px; badge chip 90 x 21.3 px (radius 999px) and 67 x 19.8 px (10.5px), the tab carries four count badges (2, 6, 7, 1); empty state none reached; error state none; hover actions none revealed, pin to top, copy context, Ask and More 26 x 20 px always drawn; focus ring 2px offset -2px.
Rows: cards 350 px wide, 320 px wide at narrow in a 309 px pane (clipped on the right by 11 px), against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 196.5 px at narrow with 14 controls on 7 rows against 22 px (css:73); the title is cut to 17 px.
Toolbars and actions: as projects, 26 x 19.6 px icon controls with border 1px and radius 6px against 16 px borderless codicons (css:133, css:85).
Spacing: path lines 10.5px monospace x16 wrap mid-word.
Type sizes: card title 15px weight 700 x16, 11.5px x121, 9.5px weight 700 x46, 10.5px x33 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x132 at narrow, x149 at wide against 16 px (css:252).
Hover actions: the card hover background rgb(248,250,252) with cursor auto and no outline; the card tools are drawn at rest (opacity 1), against reveal on hover (css:86).
Focus: ring 2px offset -2px against 1px offset -1px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the tab strip shows status counts as coloured badges (2, 6, 7, 1).
Counterpart: as projects.
Re-measure against the notes: note line 7 reads that a card hover shows five icon buttons of 20 px; the measure is that the card tools are drawn at rest (opacity 1 with the mouse away), 4 controls of 26 x 20 px plus Show more 79 x 25 px. The note's title cut `COAUTH...` is `C..` in the measure at 309 px (17 px of 72 px).

## archive

State: narrow 309 px and wide 1454 px, shots `archive-narrow.png`, `archive-wide.png`; 25 cards. Both shots are cropped to the tab and the header tools; the cards show manuscript titles and co-author names, so the card measures are by computed styles only.
Fixed set: row `div.row` 85, 67.8, 21.3, 44.5 and 61.8 px high; indent none; header 165.3 px at narrow (title `A..`, 14 px of 57 px), 40.3 px at wide (tools 1058 x 27 px on 2 rows); toolbar action `.tool` 26 x 19.6 px x71 and `.opener` x25; text button `.tool` 79 x 25.3 px x21 and link `.tool` 72 and 100 x 19.3 px; input search 144 x 25.3 px; badge chip 96 x 21.3 px x25 (radius 999px) and 67 x 19.8 px x18, the tab carries three count badges (10, 9, 6); empty state none reached; error state none; hover actions none revealed, tools drawn at rest; focus ring 2px offset -2px.
Rows: cards 350 px wide, 320 px at narrow in a 309 px pane (clipped), against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 165.3 px at narrow with 14 controls on 6 rows, 40.3 px at wide, against 22 px (css:73).
Toolbars and actions: as coauthor (css:133, css:85, css:255).
Spacing: as coauthor.
Type sizes: 11.5px x197, 9.5px weight 700 x80, 10.5px x54, 15px weight 700 x25 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x243 against 16 px (css:252).
Hover actions: as coauthor (css:86).
Focus: as coauthor (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: as coauthor.
Counterpart: as projects.
Re-measure against the notes: note line 7 reads that archive fits on one toolbar row; the measure at 309 px is 6 rows and at 1454 px it is 2 rows (header 40.3 px).

## pillars

State: narrow 309 px and wide 1454 px, shots `pillars-narrow.png`, `pillars-wide.png`; 9 pillar cards. `pillars-wide.png` is cropped to the header and the intro box, because a pillar text states a funding application outcome; the wide card measures are by computed styles only.
Fixed set: row none (cards); indent none; header 38.3 px (title and `Open file` 85 x 25 px on one row), 11.5px weight 700 uppercase; toolbar action `.tool` 26 x 19.6 px x9 (Edit entry); text button `.tool` 85 x 25.3 px (Open file) and 49 x 25.3 px (+ add); input none; badge `.disclosure` 101, 80, 77 and 99 x 21.3 px (radius 999px, "13 active" pills), count 8 x 17.3 px plain; empty state none reached; error state none; hover actions none revealed, Edit entry and the disclosure pills drawn at rest; focus ring 2px offset -2px on Open file.
Rows: cards 350 px wide (710 px for two), card radius 10px, hover background rgb(248,250,252), against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 38.3 px against 22 px (css:73); the title `PILLARS` is not cut at either width.
Toolbars and actions: Open file 85 x 25.3 px at 11.5px, radius 6px against a text button of 26 px, radius 4px (css:255).
Spacing: the intro box is 285 px wide at narrow, radius 6px, 3px orange left rule, padding 8px 10px; at narrow its inline fragments (bold, code) each sit on their own line.
Type sizes: card title 15px weight 700 x11, 12.5px x40, 11.5px x40, 11.5px weight 700 x21 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x30, 12.5 x 12.5 px x21 against 16 px (css:252).
Hover actions: Edit entry 26 x 20 px and three pills drawn at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the disclosure pills open a card's members in place with a live count.
Counterpart: VS Code has no card board; the nearest is a Settings editor group of items (css:508, css:564), where a group title is 600 weight at padding 10px 10px 10px 15px (css:564).
Re-measure against the notes: note line 5 reads the pill buttons as radius 999px 21 px; the measure is the same (radius 999px, 21.3 px).

## domains

State: narrow 309 px and wide 1454 px, shots `domains-narrow.png`, `domains-wide.png`; 9 cards. `domains-narrow.png` is cropped to the tab strip, the header and the intro box, and `domains-wide.png` to the header and the intro box, because each card states a research domain with its project counts and descriptions of unpublished work; the card measures are by computed styles only.
Fixed set: row none; indent none; header 38.3 px, 11.5px weight 700 uppercase; toolbar action `.tool` 26 x 19.6 px x9; text button `.tool` 85 x 25.3 px (Open file); input none; badge `.disclosure` 101, 80, 77 and 69 x 21.3 px, count 8 x 17.3 px, tag 51 x 17.8 px (10.5px); empty state none reached; error state none; hover actions none revealed (drawn at rest); focus ring 2px offset -2px.
Rows: cards 350 px wide with a per-domain coloured left rule against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: as pillars (css:255, css:133).
Spacing: intro 285 px, radius 6px, 3px left rule, padding 8px 10px.
Type sizes: card title 15px weight 700 x9, 12.5px x12, 11.5px x22, 11.5px weight 700 x21 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x30, 12.5 x 12.5 px x20 against 16 px (css:252).
Hover actions: as pillars (css:86).
Focus: as pillars (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the coloured per-domain rule identifies a domain at a glance.
Counterpart: as pillars.
Re-measure against the notes: note line 6 reads the same grid as pillars; the measure agrees.

## map

State: narrow 309 px and wide 1454 px, shot `map-narrow.png`; the graph with its legend. `map-narrow.png` is cropped to the header, the intro and the first type chips, because the line chips below them name research lines and the graph nodes name projects; `map-wide.png` is removed for the same reason. The legend, graph and chip measures are by computed styles only.
Fixed set: row legend row 17.5 px; indent none; header 30.3 px, 11.5px weight 700 uppercase; toolbar action `.tool` 30 x 25.3 px x2 (icon) and 110 x 25.3 px x2 (link, re-tune); text button `.tool` 110 x 25.3 px; input none (checkboxes 13 x 13 px x10, native); badge chip 17.5 to 21.3 px high (radius 999px, filled); empty state none; error state none; hover actions none; focus ring on the chip `active (5)` 70 x 18 px with outline 2px offset 1px.
Rows: legend entries 17.5 px against 22 px (css:1089).
Indents: none.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: the controls sit in the body (wide) as filled toggle chips, 17.5 to 21.3 px, where VS Code puts toggles in the widget as 20 x 20 px (css:272).
Spacing: the narrow SVG canvas is 283 x 578 px and draws nothing visible below the legend.
Type sizes: 10.5px x53, 11.5px x40 against 13px (css:1085).
Icons: nodes 15 to 25 px; checkboxes native 13 x 13 px against a 18 x 18 px custom checkbox (css:275).
Hover actions: none.
Focus: the chip focus is outline 2px offset 1px, a third ring style (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the graph shows relations between projects, which has no VS Code equivalent.
Counterpart: VS Code has no graph view; the legend checkboxes are measured against the custom checkbox (css:275) and the chips against the toggle (css:272).

## venues

State: narrow 309 px and wide 1454 px, shots `venues-narrow.png`, `venues-wide.png`; 68 venue cards (41 journals). `venues-narrow.png` and `venues-wide.png` are cropped to the header, intro and theme chips, because a venue card names guest editors and shows submission details; the card measures are by computed styles only.
Fixed set: row `li.nextitem` 17.3 px (34.5 px for two lines); indent 6 px left padding; header 69.6 px at narrow (title cut `VEN...`, 41 px of 51 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x68; text button `.tool` + add, Open file; input search 144 x 25.3 px; badge `.disclosure` 99 and 78 x 21.3 px, tags 46 x 19.3 px and 13 x 17.8 px; empty state none reached; error state none; hover actions none revealed; focus ring 2px offset -2px on + add.
Rows: `li` 17.3 px against 22 px (css:1089); cards 350 px wide at wide (320 px at narrow in a 309 px pane, clipped by 11 px).
Indents: 6 px left padding against 8 px tree indent (css:1095).
Headers: 69.6 px at narrow, 38.3 px at wide against 22 px (css:73).
Toolbars and actions: THEMES row of 13 filled accent chips 25 px high; the section fold `Journals (41)` is a filled chip; site links `A` 37 x 17.3 px x63 accent underlined, where VS Code links have no underline in the workbench (css:365).
Spacing: intro 285 px, radius 6px, left rule 3px, padding 8px 10px.
Type sizes: 11.5px x753, 11.5px weight 700 x137, 10.5px x124, 12.5px x70, 15px x68 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x371 against 16 px (css:252).
Hover actions: Edit entry 26 x 20 px drawn at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: tier colouring (Q1, gold OA) in one card line.
Counterpart: as pillars.
Re-measure against the notes: note line 8 reads 13 filled chips of 25 px, radius 6px; the measure is the same. Note line 8 reads the violet 2px outline on the concentrated card; not re-measured as a separate value.

## data

State: narrow 309 px and wide 1454 px, shots `data-narrow.png`, `data-wide.png`; 54 dataset cards. `data-narrow.png` is cropped to the tab strip and the header, `data-wide.png` to the header; the intro, the modality chips and the dataset cards state dataset details (credentialed sets, registration-gated sets, recovery commands), so every measure below the header is by computed styles only.
Fixed set: row none (cards); indent none; header 38.3 px (Open file 85 x 25.3 px), 11.5px weight 700 uppercase; toolbar action `.tool` 26 x 19.6 px x54; text button `.tool` Recover 80 x 25.3 px x54; input search 230 x 25.3 px at narrow, 1375 x 25.3 px at wide (11.5px, radius 6px); badge `.disclosure` 78 x 21.3 px, tags 326 x 19.3 px; empty state none; error state none; hover actions none revealed (drawn at rest); focus ring 2px offset -2px on Open file.
Rows: cards 352 px wide against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: the modality filter is a row of filled accent chips about 28 px high, radius 6px, wrapping to two lines at narrow.
Spacing: the search input fills the pane at wide (1375 px) and 144 px elsewhere, so the same control has two widths across views.
Type sizes: 11.5px x352, 12.5px x234, 12.5px monospace x106, 15px weight 700 x54 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x210, 12.5 x 12.5 px x101 against 16 px (css:252).
Hover actions: Edit entry 26 x 20 px and Recover drawn at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the Recover action shows next to the status.
Counterpart: as pillars.
Re-measure against the notes: note line 9 reads card titles wrapped to three lines at 15px; the measure at 309 px is two lines. Note line 9 reads a bare arrow glyph line in each card; the measure is a link `A` 54 x 13.5 px x54.

## code

State: narrow 309 px and wide 1454 px, shots `code-narrow.png`, `code-wide.png`; 20 cards. `code-narrow.png` is cropped to the header, intro and status chips; `code-wide.png` to the header, intro, status chips, coverage chips and the software line; the coverage counts and the cards state which projects hold a code deposit and list repository names and addresses, so those measures are by computed styles only.
Fixed set: row `div.row` 19.3 px (29.3 px for two lines); indent none; header 69.6 px at narrow (title cut `CO...`, 30 px of 35 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x60; text button `.tool` 85 x 25.3 px and 75 x 25.3 px; input search 144 x 25.3 px; badge `.disclosure` 99 x 21.3 px, chip 58 x 19.8 px (10.5px, radius 999px), tag 47 x 19.3 px; empty state `none` 10.5px, 16 px high, no icon (the SOFTWARE line); error state none; hover actions none revealed (drawn at rest); focus ring 2px offset -2px on the search input.
Rows: 19.3 px against 22 px (css:1089); cards 350 px (320 px at narrow in a 309 px pane, clipped).
Indents: none; the drag handle glyph sits before the status chip (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: STATUS chips filled in three colours (green, blue, grey), about 28 px high, radius 8px; CODE COVERAGE mixes outlined chips and bare counts.
Spacing: a link `A` 264 x 14.5 px accent underlined (css:365).
Type sizes: 11.5px x110, 12.5px x43, 10.5px x21, 15px weight 700 x20, 9.5px weight 700 x7 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x65, 12.5 x 12.5 px x24, 13.5 x 13.5 px x20 against 16 px (css:252).
Hover actions: 4 tools (pin to top, edit, delete, + subtask) 26 x 20 px at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: the SOFTWARE empty sentence is 10.5px with no glyph, where every other empty state is 12.5px with a 12.5 x 12.5 px glyph; VS Code's is centred with 20px padding (css:372).
Error state: none reached.
Better and kept: coverage chips summarise code state per project at a glance.
Counterpart: as pillars.
Re-measure against the notes: note line 10 reads the STATUS chips in three fill colours, the CODE COVERAGE row of outlined chips and bare numbers and the empty SOFTWARE sentence; the measure agrees.

## statements

State: narrow 309 px and wide 1454 px, shots `statements-narrow.png`, `statements-wide.png`; 2 cards.
Fixed set: row `div.row` 19.3 px; indent none; header 69.6 px at narrow (title cut `STATEM...`, 62 px of 84 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x6; text button `.tool` 79, 49, 85 and 59 x 25.3 px; input search 144 x 25.3 px; badge chip 46 x 19.8 px (10.5px, radius 999px, filled green "ready"), tags 34 and 99 x 19.3 px; empty state none reached; error state none; hover actions none revealed; focus ring 2px offset -2px on the search input.
Rows: cards 350 px (320 px at narrow in a 309 px pane, clipped) against 22 px rows (css:1089).
Indents: none; the quoted block has a 3px left rule (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: `Show more` 79 x 25 px text button (css:255).
Spacing: quote block padded inside a card.
Type sizes: 11.5px x9, 12.5px x5, 15px x2 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x7, 13.5 x 13.5 px x2 against 16 px (css:252).
Hover actions: three 26 x 20 px tools at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the funding statement is shown verbatim with a ready flag.
Counterpart: as pillars.
Re-measure against the notes: note line 11 reads two cards with a quoted block and Show more; the measure agrees.

## search

State: narrow 309 px and wide 1454 px, shots `search-narrow.png`, `search-wide.png`; a results state in a 479 px pane (typed "lazy option" into the guarded field, Return, 500 hits in 102 files, cut at 500, after 12.7 s). `search-narrow.png` and `search-wide.png` are cropped to the form and the hint, above a shell toast. `search-results.png` is removed: its 500 hits show transcript lines and paths under the home folder, so the results state is measured by computed styles only. The error state was reached in a 479 px pane (shot `search-error.png`, cropped to the header, the form, the hint and the message): the regex toggle was set on, `(` was typed into the guarded field `What to find` (focus confirmed on that input before the key), Return; the search ended at once with the message `error: unclosed group`. The regex toggle was set back off and the field cleared afterwards.
Fixed set: row `LI.hit` 25.8 px; indent none beyond the file group; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none in the header, the first Tab lands on the pane `opener` 22 x 22 px (border 0, transparent); text button `.tool` Search 74 x 25.3 px with icon, toggles word 45, case 44 and regex 48 x 25.3 px (bordered); input `What to find` 144 x 25.3 px (11.5px, radius 6px, padding 3px 8px) and select 107 x 23.5 px; badge none; empty state 12.5px sentence with a 12.5 x 12.5 px glyph, 39 px high, top left; error state `.empty` 455 x 39 px (flex, gap 6px, padding 10px 0, no background, no border) holding a 12.5 x 12.5 px glyph and the message 127 x 19 px (12.5px, rgb(95,111,133)), no retry control; hover actions none; focus ring 2px offset -2px.
Rows: result hit `LI.hit` 25.8 px and file group buttons 25.3 px against 22 px rows (css:789, css:793).
Indents: hits sit under file groups with no twistie; VS Code rows have a twistie 16 px and indent 8 px (css:21, css:1095).
Headers: 30.3 px against 22 px (css:73); the controls sit in a row below the header, not in a widget with the toggles inside the input.
Toolbars and actions: word, case and regex are bordered 25.3 px text buttons and Search is a button; VS Code puts the toggles inside the input at the right (css:292) as 20 x 20 px (css:272) and has no Search button.
Spacing: the query row is one row of five controls; VS Code's widget container has 6px top and bottom padding and the input height is 26 px (css:757, css:764); the input is 25.3 px, the select 23.5 px, the toggles 25.3 px.
Type sizes: the hit line is 10.5px monospace with a bold accent match; VS Code results use 13px with 22 px lines (css:793, css:1085).
Icons: 11.5 x 11.5 px against 16 px (css:252).
Hover actions: none.
Focus: first Tab lands on the pane opener with a 2px ring offset -2px (css:368).
Empty state: "Type a pattern and press Enter." 12.5px, top left, glyph 12.5 x 12.5 px; VS Code's message is padded 0 22px 8px (css:782) in a tree view.
Error state: `error: unclosed group` is a muted 12.5px line with a glyph, top left, in the same `.empty` row as the empty state, replacing the earlier results; there is no retry control. VS Code shows a failed action as a notification item padded 10px 5px with a 22 px message line (css:403, css:406). The message states the cause in the regex engine's words and does not say that the regex toggle is on.
Better and kept: the count line states "500 hits in 102 files, 12693 ms cut at 500" with an accent "cut at 500", which names the cut.
Counterpart: the VS Code Search view (css:755 to css:809).
Re-measure against the notes: note line 17 reads the input as 24 px; the measure is 144 x 25.3 px.

## funding

State: narrow 309 px and wide 1454 px, shots `funding-narrow.png`, `funding-wide.png`; 12 scheme cards. Both shots are cropped to the header; the intro and the cards state funding outcomes, so every measure below the header is by computed styles only.
Fixed set: row `div.row` 19.3 px (29.3 px and 76.8 px for multi-line rows); indent none; header 69.6 px at narrow (title cut `FUN...`, 46 px of 58 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x39; text button `.tool` 79 x 25.3 px x8 and 73 x 25.3 px x2; input search 144 x 25.3 px; badge status chips filled in seven colours about 28 px high, radius 6px; status pill 19.8 px (10.5px, radius 999px); tab badge violet "3"; empty state none reached; error state none; hover actions none revealed (four 26 x 20 px tools at rest); focus ring 2px offset -2px.
Rows: cards 350 px against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: DATE and DEADLINE labels are accent uppercase 9.5px weight 700 over 12.5px values.
Spacing: card title 15px wraps to 2 lines at narrow.
Type sizes: 11.5px x103, 12.5px x53, 9.5px weight 700 x20, 15px weight 700 x12 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x46, 12.5 x 12.5 px x15, 13.5 x 13.5 px x11 against 16 px (css:252).
Hover actions: four 26 x 20 px tools at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the seven status colours are distinct and legible.
Counterpart: as pillars.
Re-measure against the notes: note line 12 reads status chips in seven fill colours and a violet tab badge "3"; the measure agrees.

## events

State: narrow 309 px and wide 1454 px, shots `events-narrow.png`, `events-wide.png`; 7 cards. `events-narrow.png` and `events-wide.png` are cropped to the header, intro and status chips; the cards name hosts, so the card measures are by computed styles only.
Fixed set: row `div.row` 19.3 px (29.3 px for two lines); indent none; header 69.6 px at narrow (title cut `TALKS & ...`, 74 px of 106 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x24; text button `.tool` 49 and 85 x 25.3 px; input search 144 x 25.3 px; badge `.disclosure` 99 x 21.3 px, chips 71 and 68 x 19.8 px (10.5px, radius 999px), tags 53 and 61 x 19.3 px; empty state none reached; error state none; hover actions none revealed (three 26 x 20 px tools at rest); focus ring 2px offset -2px.
Rows: cards 350 px against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: status chips in four colours; the `Named by` pill is a disclosure 21.3 px.
Spacing: ROLE, DATE and SNOOZE labels 9.5px weight 700.
Type sizes: 11.5px x50, 12.5px x33, 9.5px weight 700 x23, 15px weight 700 x7 against 13px (css:1085).
Icons: link `A` 125 x 14.5 px accent underlined; svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the snooze label keeps a talk's follow-up date next to its status.
Counterpart: as pillars.
Re-measure against the notes: note line 13 reads as funding; the measure agrees.

## education

State: narrow 309 px and wide 1454 px, shots `education-narrow.png`, `education-wide.png`; 21 cards. `education-narrow.png` and `education-wide.png` are cropped to the header, intro and status chips; the cards name students, so their measures are by computed styles only.
Fixed set: row `div.row` 19.3 px (29.3 px and 69.8 px for taller rows); indent none; header 69.6 px at narrow (title cut `EDUCATION ...`, 92 px of 144 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x68; text button `.tool` 79, 49 and 85 x 25.3 px; input search 144 x 25.3 px; badge chips 71 and 58 x 19.8 px (10.5px, radius 999px), tag 63 x 19.3 px; empty state none reached; error state none; hover actions none revealed (four tools at rest); focus ring 2px offset -2px.
Rows: cards 350 px against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: chips completed (blue) and planned (violet) about 28 px high, radius 6px.
Spacing: the card left rule is blue; a link with a folder icon is accent underlined.
Type sizes: 11.5px x85, 12.5px x66, 9.5px weight 700 x36, 15px weight 700 x21 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: as funding.
Counterpart: as pillars.
Re-measure against the notes: note line 15 reads the collection card grid; the measure agrees.

## applications

State: narrow 309 px and wide 1454 px, shots `applications-narrow.png`, `applications-wide.png` (both cropped to the header and tab; the intro, chips and cards show applications and third-party email addresses, so every measure below the header is by computed styles only); 25 cards.
Fixed set: row `div.row` 19.3 px (29.3 px and 44.5 px for taller rows); indent none; header 69.6 px at narrow (title cut `APPLICA...`, 67 px of 93 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x99; text button `.tool` 79 x 25.3 px x24 and 85 x 25.3 px x2; input search 144 x 25.3 px; badge `.disclosure` 78 x 21.3 px, chips 74 and 59 x 19.8 px (10.5px, radius 999px), tags 37 x 19.3 px x12; empty state none reached; error state none; hover actions none revealed (four tools and Show more at rest); focus ring 2px offset -2px.
Rows: link rows `A` 247 x 33.3 px at narrow and 302 x 33.3 px at wide against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: status chips in six fill colours; `Show more` 79 x 25 px (css:255).
Spacing: card left rule green.
Type sizes: 11.5px x223, 12.5px x127, 9.5px weight 700 x29, 15px weight 700 x25, 12.5px monospace x4 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x103, 12.5 x 12.5 px x50, 13.5 x 13.5 px x25 against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: a card holds the call, status and contact in one block.
Counterpart: as pillars.
Re-measure against the notes: note line 15 reads status chips in six fill colours; the measure agrees.

## joint-work

State: narrow 309 px and wide 1454 px, shots `joint-work-narrow.png`, `joint-work-wide.png` (both are cropped to the header, intro and status chips; the cards name co-supervisors and show third-party emails, so the card measures are by computed styles only); 13 cards.
Fixed set: row `div.row` 25.3, 19.3 and 29.3 px; indent none; header 69.6 px at narrow (title `JOINT ...`, 60 px of 80 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x39; text button `.tool` 120 x 25.3 px x2 and the person name button 140 x 25 px; input search 144 x 25.3 px; badge `.disclosure` 101, 80 and 78 x 21.3 px, chips 48 x 19.8 px (10.5px, radius 999px), count 8 x 17.3 px; the tab carries a violet badge "4"; empty state none reached; error state none; hover actions none revealed (hover row 321 x 25 px, background transparent); focus ring 2px offset -2px on the person button.
Rows: 25.3 px against 22 px (css:1089).
Indents: none (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: PERSON is a bordered pill with an icon (a third chip shape).
Spacing: card 350 px.
Type sizes: 11.5px x70, 12.5px x33, 9.5px weight 700 x36, 15px weight 700 x13 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: none revealed.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the person pill opens the person view directly.
Counterpart: as pillars.
Re-measure against the notes: note line 15 reads PERSON as a bordered chip with an icon; the measure agrees.

## tasks

State: narrow 309 px and wide 1454 px, shots `tasks-narrow.png`, `tasks-wide.png` (both cropped to the header and the status chips; the cards list manuscripts under submission, so the card measures are by computed styles only); 3 cards, 11 subtasks.
Fixed set: row subtask line 25.3 px; indent none; header 69.6 px at narrow (title cut `TA...`, 34 px of 41 px), 38.3 px at wide; toolbar action `.tool` 26 x 20 px (pin, edit and delete); text button per subtask done 45 x 25.3 px, 1w 32, 1mo 40, hide 41, del 35 x 25.3 px; input search 144 x 25.3 px; badge chip 41 x 19.8 px (10.5px), count 35 x 15.8 px; empty state none reached; error state none; hover actions none revealed (28 buttons drawn in the hovered card); focus ring 2px rgb(189,93,56) offset -2px on `+ add`.
Rows: a subtask is one line of a 13 x 13 px checkbox, text and five bordered 25.3 px buttons; when the text wraps, the checkbox, the text and the buttons take three lines at narrow; VS Code's row is 22 px with actions at the right on hover (css:1089, css:86).
Indents: none (css:1095).
Headers: the view header reads "TASKS" where the tab and HELP read "Tasks & Service"; 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: five text buttons per subtask at 11.5px against icon actions of 16 px (css:133).
Spacing: card 350 px.
Type sizes: 11.5px x58, 12.5px x16, 10.5px x6, 9.5px weight 700 x4, 15px weight 700 x3 against 13px (css:1085).
Icons: svg 10.5 x 10.5 px x11, 11.5 x 11.5 px x7, 13.5 x 13.5 px x3 against 16 px (css:252); the checkbox is native-like 13 x 13 px against 18 x 18 px (css:275).
Hover actions: drawn at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: each subtask offers snooze (1w, 1mo) in place.
Counterpart: VS Code has no task board; the nearest is the Problems list rows with 22 px lines (css:826) and the hover actions of tree rows (css:86).
Re-measure against the notes: note line 16 reads 59 subtask buttons on the screen; the measure at wide is 51 subtask buttons (done 11, 1w 10, 1mo 10, hide 10, del 10) in a 1454 px pane, and 28 buttons in the hovered card.

## present

State: narrow 309 px and wide 1454 px, shots `present-narrow.png`, `present-wide.png`; slide 1 of 23.
Fixed set: row none; indent none; header 69.5 px at narrow (tools wrapped to 2 rows, title cut `PRES...`, 44 px of 58 px), 38.3 px at wide (title and tools 307 x 25 px); toolbar action none (all text); text button `.tool` Previous 65, Next 43, Overview 87 and Slides 51 x 25.3 px; input none; badge counter `1 / 23` 38 x 15.8 px (10.5px), tags 79, 103, 64 and 91 x 19.3 px (11.5px, no background at narrow); empty state none reached; error state none; hover actions none; focus ring 2px offset -2px on Previous.
Rows: none.
Indents: none.
Headers: 69.5 px at narrow against 22 px (css:73).
Toolbars and actions: four text buttons in the header, 25.3 px against a header action of 16 px (css:133).
Spacing: the slide uses the left 430 px of the 1454 px pane; the rest is empty.
Type sizes: slide title 19px weight 700, 15px weight 700 x2, 11.5px x8 against 13px (css:1085).
Icons: none measured.
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the topic tags in accent colours.
Counterpart: VS Code has no slide viewer; the header buttons are measured against the editor title actions (css:111, css:133).

## radar

State: narrow 309 px and wide 1454 px, shots `radar-narrow.png`, `radar-wide.png`; 561 cards rendered in one scroll with no windowing. Both shots are cropped to the header and the intro; the cards list papers with author names, so the card measures are by computed styles only.
Fixed set: row `div.row` 25.3 px x506 and 19.3 px x240 at wide; indent none; header 69.6 px at narrow (title `LIT WAT...`, 63 px of 69 px), 38.3 px at wide; toolbar action `.tool` 26 x 19.6 px x746 (dismiss); text button `.tool` 320 x 25.3 px x426 (full-width project link, text cut with an ellipsis), 140 and 177 x 25.3 px (section folds); input search 144 x 25.3 px; badge tags 22 x 17.8 px x279 (10.5px), 100 x 19.3 px; empty state none reached; error state none; hover actions none revealed (card hover background rgb(248,250,252), tools at rest); focus ring 2px offset -2px on the search input.
Rows: card 349 px (274 px at narrow) with a red 3px left rule against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: the section fold `Pre-emption risk (31)` is a filled accent chip; a link row to the project is a bordered full-width button, 25.3 px high.
Spacing: the "threatens:" paragraph is red 12.5px under a lone warning glyph line; the intro legend holds inline radio-like circles.
Type sizes: 12.5px x1821, 11.5px x1312, 15px weight 700 x561, 10.5px x467 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x1312, 12.5 x 12.5 px x688 against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the red rule and the "threatens:" line mark pre-emption risk at once.
Counterpart: the VS Code Problems panel (css:824 to css:870), whose rows are 22 px lines with a count badge (css:826, css:309).
Re-measure against the notes: note line 18 reads titles of 15px wrapping to three lines; the measure at 309 px is 2 lines in a 274 px card.

## leads

State: narrow 309 px and wide 1454 px, no shot at either width; 9 cards (35 declined hidden). The header, the intro and the cards are position leads and lead counts, so every measure is by computed styles only.
Fixed set: row `div.row` n/a (cards); indent none; header 100.8 px at narrow (title `POSIT...`, 51 px of 106 px), 38.3 px at wide (tools 464 x 25 px); toolbar action none; text button `.tool` applied 58, decline 57 and del 35 x 25.3 px per card, `+ add lead` 75 x 25.3 px; input search 144 x 25.3 px; badge tags 15 x 19.3 px and 28 x 17.8 px (10.5px); chips 345 x 42.5 px; empty state none reached; error state none; hover actions none revealed (three buttons at rest); focus ring 2px offset -2px on the search input.
Rows: card 486 px wide in a 309 px pane (overflows by 177 px, text cut without an ellipsis at the edge) at narrow, 352 px at wide.
Indents: none (css:1095).
Headers: 100.8 px at narrow, with 4 controls on 3 rows, against 22 px (css:73).
Toolbars and actions: three bordered 25.3 px text buttons per card against icon actions revealed on hover (css:133, css:86).
Spacing: the fit word is coloured (reach grey, strong green, moderate orange).
Type sizes: 11.5px x59, 12.5px x37, 15px weight 700 x9, 10.5px x9 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the fit word summarises a lead's match in one token.
Counterpart: as radar.
Re-measure against the notes: note line 19 reads a text line overflowing the card at the right ("1 yea" cut); the measure is a card 486 px wide in the 309 px pane with the overflow hidden.

## inbox

State: narrow 309 px and wide 1454 px, probe by computed styles only (no shot, personal content); 12 thread cards.
Fixed set: row account line 23.8 px at 15px; indent none; header 38.3 px, title 40 px wide, tools one search input 144 x 25 px; toolbar action `.tool` 26 x 19.6 px x48 (Draft reply, open, Archive, triaged); text button `.tool` Refresh now 85 x 25.3 px and Add account 105 x 25.3 px; input search 144 x 25 px; badge tag 58 x 19.3 px; empty state none reached; error state none reached; hover actions none revealed (card hover background rgb(248,250,252), four tools at rest); focus ring 2px offset -2px on the search input.
Rows: one card per thread, 1430 px wide at wide, 285 px at narrow, radius 10px, against one 22 px row per item (css:1089).
Indents: none (css:1095).
Headers: 38.3 px against 22 px (css:73); the status line "live | as of | every 10m" and Refresh now, Add account and `...` sit below the header, not in it.
Toolbars and actions: `.opener` 30 x 23.8 px at 13.5px x2, the only 13.5px controls in the application.
Spacing: sender 15px weight 700, subject 12.5px weight 700, preview 11.5px.
Type sizes: 15px weight 700 x13, 12.5px weight 700 x12, 11.5px x46, 13.5px x1 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x49, 13.5 x 13.5 px x2 against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: triage actions per thread (Draft reply, Archive, triaged) are on the card.
Counterpart: the VS Code Timeline pane or the agent sessions list (css:812, css:1067), measured as one row per item.
Re-measure against the notes: note line 20 reads two 24 px controls at 13.5px; the measure is `.opener` 30 x 23.8 px at 13.5px x2. Note line 21 reads four 20 px icon buttons; the measure is 26 x 19.6 px.

## linkedin

State: narrow 309 px and wide 1454 px, probe by computed styles only (no shot, personal content); 19 cards.
Fixed set: row n/a (cards); indent none; header 69.5 px at narrow (title `LINKE...`, 59 px of 60 px, tools 217 x 57 px on 2 rows), 38.3 px at wide (tools 219 x 25 px); toolbar action none; text button `.tool` 57 x 25.3 px x19 (edit), 104 x 25.3 px x10 (mark posted), 69 x 25.3 px; input search 144 x 25.3 px; badge tag 21 x 17.8 px x10 (10.5px); empty state none reached; error state none reached; hover actions none revealed; focus ring 2px offset -2px on the search input.
Rows: cards 352 px in four columns at wide, 285 px at narrow, against 22 px rows (css:1089).
Indents: none (css:1095).
Headers: 69.5 px at narrow against 22 px (css:73).
Toolbars and actions: `+ idea` and search stack on two rows at narrow.
Spacing: a status box with a 3px left rule, padding 8px 10px, 285 px at narrow.
Type sizes: 11.5px x49, 10.5px x38, 12.5px x20, 15px weight 700 x19, 13.5px weight 700 x2 (the "Ideas (10)" heading) against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x30, 13.5 x 13.5 px x2 against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: each idea card carries its footer actions (mark posted, edit).
Counterpart: as radar.
Re-measure against the notes: note line 22 reads a header title cut `LINKE...` in a 290 px pane; the measure at 309 px is the same cut (59 px of 60 px).

## session-list

State: narrow 309 px and wide 1454 px, shots `session-list-narrow.png`, `session-list-wide.png`; 42 session rows at narrow. Both shots are cropped to the header and the search field; the Customizations block and the session rows are cropped out because the rows show session titles that come from prompts, so the row measures are by computed styles only.
Fixed set: row `div.row` 44 px (two lines: title 12.5px, meta 10.5px), `li.item` 22 px at 13px in the Customizations tree; indent 0 for rows, tree rows flush left; header 35 px (title `SESSIONS` 64 px, tools 50 x 22 px); toolbar action two `.tool` 22 x 22 px (transparent, border 0) in the header, `.opener` 22 x 22 px at 13.5px x41 per row (list icon, always drawn); text button chips Claude, gmail and hub (bordered `.tool`); input search 277 x 25.3 px at narrow, 1422 x 25.3 px at wide; badge plain count 17 x 17.3 px and 24 x 17.3 px at the right of a group label, tags 25 x 19.3 px; empty state none reached; error state none; hover actions none revealed (the row background changes to rgb(241,245,249), the row-button 260 x 44 px has cursor pointer); focus ring 2px offset -2px on the pane opener.
Rows: 44 px against 22 px (css:1089); the welcome grid of the VS Code agent sessions list has rows with radius 4px (css:1072) and a hover background (css:1073).
Indents: Customizations tree rows have no indent per level against 8 px (css:1095).
Headers: 35 px against 22 px (css:73); the closest VS Code value is the 35 px part title (css:105).
Toolbars and actions: 22 x 22 px icon tools in the header, the nearest oculus match to VS Code's 20 x 20 px action (css:133, css:85).
Spacing: workspace group labels RESEARCH-HUB are 10.5px weight 700 uppercase with a plain count at the right; VS Code shows a count badge (css:309).
Type sizes: 10.5px x369, 12.5px x43, 10.5px weight 700 x18, 13px x7 (Customizations rows) against 13px (css:1085).
Icons: svg 13.5 x 13.5 px x48 against 16 px (css:252); the status dot is a coloured circle; the selected row has a 3px accent left rule.
Hover actions: none revealed; the per-row list icon is always drawn (css:86).
Focus: first Tab lands on the pane opener 22 x 22 px with a 2px ring offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: a session row shows title, meta, status dot and "needs input" in two lines, which a 22 px row cannot; its header actions are the only ones that approach the 20 x 20 px action of VS Code (css:133, css:85).
Counterpart: the VS Code agent sessions list (css:1067 to css:1074).
Re-measure against the notes: note line 23 reads two bare 16 px header icons; the measure is two 22 x 22 px boxes. Note line 23 reads 121 text nodes at 10.5px; the measure at narrow is not comparable (a different list state), and at wide it is 369.

## session-detail

State: narrow 309 px and wide 1454 px, probe by computed styles only (no shot, personal content); session `S2 status`.
Fixed set: row n/a; indent none; header 71.5 px at narrow (title cut, 52 px of 55 px, tools 225 x 59 px on 2 rows), 40.3 px at wide (tools 177 x 27 px on 2 rows); toolbar action none; text button `.tool` 88, 30, 54 and 116 x 25.3 px at narrow, 51, 93 and 142 x 25.3 px at wide, `.opener` 135 x 27.3 px at narrow and 83 x 27.3 px at wide; input text 152 x 25.3 px at narrow, 1237 x 25.3 px at wide, select 260 x 23.5 px at narrow and 989 x 23.5 px at wide (11.5px, radius 6px); badge none; empty state none; error state none; hover actions none; focus ring 2px offset -2px.
Rows: n/a.
Indents: none.
Headers: 71.5 px at narrow, 40.3 px at wide against 22 px (css:73).
Toolbars and actions: the session opener is 27.3 px high while `.tool` is 25.3 px in the same header.
Spacing: the select is 23.5 px and the input 25.3 px in one form row.
Type sizes: 11.5px x30-32, 10.5px x3, 11.5px monospace x3, 12.5px x1 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x4 against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the session opener switches sessions in place.
Counterpart: VS Code has no session form; the controls are measured against the Settings editor items (css:508) and inputs (css:276, css:277).

## terminal

State: narrow 309 px and wide 1454 px, probe by computed styles only (no shot, personal content). Two states: the composer before any shell is started (header 63.8 px at narrow, 38.3 px at wide) and a started shell (the audit started one and ended it).
Fixed set: row xterm row 15.0 px (12.5px monospace, 256 px wide in a 273 px terminal at narrow, 1400 px at wide); indent none; header 69.5 px at narrow started (title cut `883652-shell`, 36 px of 65 px, tools 240 x 57 px), 38.3 px at wide (tools 430 x 25 px); toolbar action `.tool` 26 x 19.6 px x3 (text size) and `.opener` 22 x 22 px (kind); text button `.tool` new terminal 106 x 25.3 px, Split 60 x 25.3 px; input textarea 255 x 69 px (11.5px, radius 6px) in the composer, 452 px wide at wide; badge none; empty state the composer, `The first message` with chips hub, main, Claude, gmail, CLI default, Manual permissions and a Start button; error state none reached; hover actions none; focus ring 2px offset -2px.
Rows: xterm line 15.0 px against the terminal line height of the font (css:1102 gives the default size 12 on macOS).
Indents: none.
Headers: 63.8 to 69.5 px at narrow against 22 px (css:73).
Toolbars and actions: 3 text-size tools and a kind opener are always drawn, where VS Code's terminal toolbar has icon actions (css:133).
Spacing: `.terminal` padding 4px 6px 6px, `.body` padding 10px 12px.
Type sizes: xterm 12.5px against 12px default (css:1102).
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: the composer is 273 x 180 px at narrow with a prompt textarea 255 x 69 px and a foot with pickers 52, 70 and 43 x 27.3 px.
Error state: none reached.
Better and kept: the composer picks project, branch and permissions before the shell starts.
Counterpart: the VS Code integrated terminal (css:969 to css:1004); there is no tab strip inside the view in oculus, the session is named by the pane tab.

## transcript

State: narrow 309 px and wide 1454 px, probe by computed styles only (no shot, personal content); session `S2 status`. The view showed both a no-turns state and a with-turns state on the same session.
Fixed set: row `.turn.tool` 285 x 19.3 px (head: who 10.5px 31 x 15.8 px, timestamp 10.5px, name 11.5px 17.3 px); indent none; header 71.5 px at narrow with turns (title cut, 54 px of 81 px, tools 222 x 59 px on 3 rows), 102.8 px (3 rows) in the no-turns state, 40.3 px at wide (tools 332 x 27 px on 2 rows); toolbar action `.tool` + 61 and 64 x 25.3 px; text button `.tool` Pin this pane 88 x 25.3 px, Jump to the last turn 149 x 25.3 px, `.opener` 83 x 27.3 px; input composer textarea 267 x 34.5 px at narrow, 1412 x 34.5 px at wide (11.5px, radius 6px, padding 0); badge tag toned 19.3 px; empty state 12.5px, 76 px high; error state none; hover actions none; focus ring 2px offset -2px.
Rows: 19.3 px against 22 px (css:1089).
Indents: none.
Headers: 71.5 to 102.8 px at narrow against 22 px (css:73).
Toolbars and actions: the opener is 27.3 px and the tools 25.3 px.
Spacing: the chat frame is 285 px wide at narrow and 1430 px at wide, radius 8px, border 1px.
Type sizes: 11.5px against 13px (css:1085).
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: 12.5px sentence with a 12.5 x 12.5 px glyph at the top left (css:372).
Error state: none reached.
Better and kept: the turn head carries who, time and name in one line.
Counterpart: VS Code has no chat transcript in this build; rows are measured against the Timeline pane rows (css:812 to css:821).

## timeline

State: narrow 309 px (empty with no session picked, then with session `S2 status`) and wide 1454 px, shots `timeline-narrow-empty.png`, `timeline-narrow.png`, `timeline-wide.png`. `timeline-narrow.png` is cropped to the event rows below the opening prompt line; the session control and that line are cropped out. `timeline-wide.png` is cropped to the header and the event rows.
Fixed set: row `.event` 19 px (186 time tags 21 x 19.3 px, 10.5px monospace time); indent about 12 px for child events; header 40.3 px with no session (opener 65 x 27.3 px and title 59 px), 71.5 px with a session at narrow (title cut, 55 px of 59 px, tools 222 x 59 px on 2 rows), 40.3 px at wide (tools 177 x 27 px); toolbar action none; text button `.tool` Pin this pane 88 x 25.3 px, `.opener` 133 x 27.3 px at narrow and 83 x 27.3 px at wide; input none; badge tag 21 x 19.3 px; empty state 12.5px, 76 px high, glyph 12.5 x 12.5 px in a circle, text and a button; error state none; hover actions none (no hover background); focus ring 2px offset -2px on the opener.
Rows: 19 px against 22 px (css:1089).
Indents: 12 px for children against 8 px (css:1095).
Headers: 71.5 px at narrow against 22 px (css:73).
Toolbars and actions: the session picker is an `.opener` 27.3 px high, taller than the neighbouring tool 25.3 px.
Spacing: time, kind and name sit on one line.
Type sizes: 11.5px x402, 10.5px monospace x200 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: none, no row background change; a VS Code list tints a hovered row (css:1106).
Focus: ring 2px offset -2px (css:368).
Empty state: 12.5px with glyph and a button at 76 px, top left; the VS Code Timeline message is 50% opacity, padded 10px 22px 0 (css:814).
Error state: none reached.
Better and kept: the monospace time column aligns events.
Counterpart: the VS Code Timeline pane (css:812 to css:821).

## changes

State: narrow 309 px and wide 1454 px, shot `changes-narrow.png`, `changes-wide.png`. The ChangeGroups and the CommitBox parts of this view are X3d's and are measured but not for build here. `changes-wide.png` is cropped to the tab strip, the header and the first section label; the file list shows paths, so the row measures at wide are by computed styles only.
Fixed set: row `.file` 17 px; indent none; header 71.5 px at narrow (title cut, 43 px of 62 px, tools 233 x 59 px on 2 rows), 40.3 px at wide (tools 271 x 27 px on 2 rows); toolbar action `.tool` 26 x 25.3 px x4, 26 x 19.6 px x3, 22 x 22 px; text button `.tool` 67 x 25.3 px x4, 88 and 77 x 25.3 px; input text 196 x 25.3 px at narrow, 1313 x 25.3 px at wide; textarea 250 x 19.5 px at 13px, radius 6px, padding 0 (commit message); badge none; empty state `none` 10.5px, 16 px high x2; error state none reached; hover actions none (no hover background); focus ring 2px offset -2px.
Rows: 17 px against 22 px (css:1089).
Indents: none.
Headers: 71.5 px at narrow against 22 px (css:73).
Toolbars and actions: Commit is a split button with an accent background; Stage and Discard are 80 px wide text buttons.
Spacing: the "Touched by this session" list puts path left, verb centred and count right; the verb column starts at varying x.
Type sizes: 11.5px x209, 10.5px x208, 10.5px monospace x203 at wide against 13px (css:1085); the commit message textarea is 13px against the 11.5px of the other inputs.
Icons: svg 11.5 x 11.5 px against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: `none` 10.5px with no glyph; VS Code is centred (css:372).
Error state: none reached.
Better and kept: the touched-by-this-session list shows which files a session wrote.
Counterpart: the VS Code Source Control view, whose stylesheet lines X3d holds in `X3d-vscode-scm.css`.

## agents

State: narrow 309 px and wide 1454 px, shot `agents-narrow.png` (empty: "This session dispatched no agents."). The populated state (100 agents of session `S2 status`) has no shot at either width, because its rows show agent task names; its measures are by computed styles only. At narrow: header 40.3 px on two tool rows, 100 rows `.agent` 284.7 x 17.3 px (flex, no wrap, gap 6 px), status dot 8 px, kind label 54 px, model label 24.6 px (10.5px), task text collapsed to 9.7 px behind an ellipsis, status 164.4 px (10.5px monospace), no hover background.
Fixed set: row `.agent` 17 px; indent none; header 71.5 px at narrow with the session opener 137 px wide (title cut, 49 px of 51 px, tools 228 x 59 px on 2 rows) and 40.3 px at narrow with the opener 83 px wide and 100 agents listed (title 51 of 51 px, tools 177 x 27 px on 2 rows), 40.3 px at wide (tools 177 x 27 px); toolbar action none; text button `.tool` Pin 88 x 25.3 px, `.opener` 137 x 27.3 px at narrow and 83 x 27.3 px at wide; input none; badge status dot (green running, grey done, red error); empty state 12.5px, 39 px high, glyph 12.5 x 12.5 px in a circle; error state none reached; hover actions none (no buttons, no hover background); focus ring 2px offset -2px on the opener.
Rows: 17.3 px against 22 px (css:1089).
Indents: none.
Headers: 71.5 px at narrow with the opener 137 px wide and 40.3 px at narrow with the opener 83 px wide and 100 agents listed, against 22 px (css:73).
Toolbars and actions: as timeline.
Spacing: at narrow the task text keeps 9.7 px of the line and is cut to an ellipsis; agent name 11.5px, model 10.5px grey, task text, and the right-aligned status in 10.5px monospace ("done | 15m 48s | 147 chars").
Type sizes: 11.5px x202, 10.5px x100, 10.5px monospace x100 against 13px (css:1085).
Icons: dot against a 16 px codicon (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: 12.5px with glyph, top left (css:372).
Error state: none reached.
Better and kept: the right-aligned status line summarises each agent's run.
Counterpart: the VS Code Timeline pane rows (css:812 to css:821).

## status

State: narrow 309 px and wide 1454 px, shots `status-narrow.png`, `status-wide.png`.
Fixed set: row table `T` 29.8 px x49, list `L` 18.8 px x7; indent none; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none; text button `.tool` Count again 83 x 25.3 px (11.5px, radius 6px), 100 x 25.3 px; input none; badge none; empty state none; error state none; hover actions none; focus ring 2px offset -2px on Count again.
Rows: table rows 29.8 px and list rows 18.8 px against 22 px (css:1089); VS Code's table header is weight 700 (css:386).
Indents: sub rows indented in an HTML document column 1430 px wide.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: the one button is 25.3 px against 26 px (css:255).
Spacing: the table clips on the right at narrow ("COMM" cut) and the pane scrolls horizontally (scroll width 309 px).
Type sizes: 12.5px monospace x288 (numbers), 12.5px x61, column heads 10.5px monospace weight 700 uppercase x6 against 13px (css:1085).
Icons: none.
Hover actions: none; the list items `LI` 19 px have no hover background.
Focus: ring 2px offset -2px (css:368).
Empty state: none.
Error state: none.
Better and kept: a plain document with 1px row rules and no cards.
Counterpart: VS Code tables, rows and header measured against the keybindings table (css:1007 to css:1052) and `.monaco-table` (css:382, css:386).

## findings

State: narrow 309 px and wide 1454 px, shots `findings-narrow.png`, `findings-wide.png`; the empty state ("No findings: every id resolves and every status is in the vocabulary.").
Fixed set: row none; indent none; header none; toolbar action none; text button none; input none; badge none; empty state `none` 12.5px, 19 px high at wide and 38 px at narrow, top left, no glyph; error state not reached: the state with findings needs a broken hub file and a write is not allowed (the attempt: reading the view with the hub as it is, which has none); hover actions none; focus ring the first Tab lands on the pane opener 22 x 22 px with a 2px ring offset -2px.
Rows: none against 22 px (css:1089).
Indents: none.
Headers: the view draws no `Pane` header, no title and no tools, where VS Code draws a 22 px header (css:73).
Toolbars and actions: none.
Spacing: one sentence at the top left.
Type sizes: 12.5px against 13px (css:1085).
Icons: none, where Search and Hub document draw a 12.5 x 12.5 px glyph before the empty sentence.
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: one 12.5px sentence, no glyph, no header, where VS Code's is centred with padding 0 20px 1em (css:372).
Error state: not reached.
Better and kept: the sentence names what was checked.
Counterpart: the VS Code Problems panel empty message (css:826).
Re-measure against the notes: note line 24 reads the empty state as one 12.5px sentence with no header; the measure agrees.

## gallery

State: narrow 309 px and wide 1454 px, probe by computed styles only (no shot, personal content); 3 cards in three columns at wide.
Fixed set: row table `T` 32.3 px x7-8, list `L` 17.3 px; indent none; header 69.5 px at narrow (title cut, 37 px of 57 px, tools 240 x 57 px on 2 rows), 38.3 px at wide (tools 374 x 25 px); toolbar action none; text button `.tool` 57, 47, 43 and 67 x 25.3 px (Outline, Filled, Both, Reset), sourcing button 53 x 25.8 px at 10.5px (radius 0, border 0, padding 5px 8px); input search 144 x 25.3 px; badge chips 94 to 242 x 21.3 px (radius 999px); empty state 12.5px, 39 px high; error state none; hover actions none; focus ring 2px offset -2px on the search input.
Rows: table rows 32.3 px against 22 px (css:1089).
Indents: none.
Headers: 69.5 px at narrow against 22 px (css:73).
Toolbars and actions: a three-way segmented control (Outline, Filled, Both) of bordered text buttons, Both filled accent.
Spacing: section labels 10.5px weight 700 uppercase accent coloured.
Type sizes: 11.5px x50, 12.5px x12, 10.5px weight 700 x10, 15px weight 700 x3 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x40, 10.5 x 10.5 px, 12.5 x 12.5 px against 16 px (css:252).
Hover actions: the hover point hit an `H3` (no row).
Focus: ring 2px offset -2px (css:368).
Empty state: 12.5px, 39 px high, top left.
Error state: none reached.
Better and kept: the gallery shows chips in outline and filled forms side by side.
Counterpart: VS Code has no icon gallery; the table is measured against the keybindings table (css:1007 to css:1052).
Re-measure against the notes: note line 25 reads table rows of 32 px and a 10.5px header; the measure is rows 32.3 px.

## hpc

State: narrow 309 px (pane 0) and wide 1454 px, shots `hpc-narrow.png`, `hpc-wide.png`; the cluster is unreachable from here, so the error state is the only state reached. The empty states exist in the code (the starting state `Hpc.svelte:68-69`, the empty queue `Jobs.svelte:46` and `Head.svelte:58`, under `src/lib/views/system/hpc/`) and are not reachable here: the poll result is held by the running server, so a starting state needs a fresh server.
Fixed set: row none; indent none; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none; text button `.tool` Refresh now 39 x 25.3 px at narrow (cut at the pane's right edge, "Refresh" cut) and 85 x 25.3 px at wide (floated to the far right in the body); input none; badge none; empty states exist (`Hpc.svelte:68-69`, `Jobs.svelte:46`, `Head.svelte:58`) and were not reached: the cluster is unreachable and a starting state needs a fresh server; error state `unreachable` 11.5px weight 700 red, then the ssh message 11.5px monospace red (3 lines at narrow), 12.5px text, no glyph and no box; hover actions none; focus ring 2px offset -2px on Refresh now.
Rows: none.
Indents: none.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: Refresh now sits in the body, not in the header, where VS Code has refresh as a header action (css:83, css:133).
Spacing: the Refresh button touches the pane edge at narrow.
Type sizes: 11.5px x4, 11.5px weight 700 x2, 11.5px monospace x1, 12.5px x1 against 13px (css:1085).
Icons: none.
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: not reached. The starting state (`Hpc.svelte:68-69`) and the empty queue (`Jobs.svelte:46`, `Head.svelte:58`) exist in the code; while the cluster is unreachable the view shows the error.
Error state: red monospace lines with no icon and no box; a VS Code error is a notification item with padding 10px 5px and a 22 px line (css:403, css:406).
Better and kept: the error names the unreachable cluster in bold and shows the ssh line verbatim.
Counterpart: the VS Code notification list item for the error (css:403 to css:433) and the Problems panel for the table (css:824 to css:870).

## usage

State: narrow 309 px and wide 1454 px, shots `usage-narrow.png`, `usage-wide.png`; `usage-narrow.png` is cropped to the tab strip and the header, and `usage-wide.png` is removed, because the account cards show account labels, a session id and a cost; the card and table measures are by computed styles only.
Fixed set: row table `T` 29.8 px at wide (header row 26.3 px), live row 26.3 px at wide, 47.5 px at narrow; indent none; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none; text button `.tool` Refresh now 103 x 25.3 px with icon, x2; input none; badge tags 33, 42, 97 and 106 x 17.8 px (10.5px); meters: bars 5 to 6 px high; empty state none; error state none; hover actions none revealed (a cell hover background rgb(241,245,249) at 30 px on `TD`, `TR` transparent); focus ring the first Tab lands on the pane opener 22 x 22 px, 2px ring offset -2px.
Rows: table rows 29.8 px against 22 px (css:1089); the progress element is 5 to 6 px against 2 px (css:391).
Indents: none.
Headers: 30.3 px against 22 px (css:73); table header 10.5px uppercase against weight 700 at the body size (css:386).
Toolbars and actions: Refresh now sits inside each account card.
Spacing: the table is 609 px wide in a `.history` container whose clientWidth is 285 px at narrow, so it scrolls horizontally (scrollWidth 609); account cards 285 px at narrow, 470 px in three columns at wide, radius 10px.
Type sizes: 12.5px monospace x76 ("9% | resets in 3h 26m"), 12.5px x73, 10.5px x14, 11.5px x13 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x2 against 16 px (css:252).
Hover actions: the hover tints the cell, not the row.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: percentage and reset time sit in one monospace column that aligns across accounts.
Counterpart: VS Code tables and progress (css:382 to css:391).
Re-measure against the notes: note line 26 reads a row hover tint; the measure is a cell tint (`TD` rgb(241,245,249), 30 px high) with `TR` transparent.

## help

State: narrow 309 px and wide 1454 px, shots `help-narrow.png`, `help-wide.png`.
Fixed set: row table `T` 25.8 px, list `L` 18.8 px; indent none; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none; text button none (contents list links `A` 14.5 px); input none; badge none; empty state none; error state none; hover actions none; focus ring `A` link outline auto 1px rgb(0,95,204) offset 1px (the browser default).
Rows: contents links 18.8 px against 22 px (css:1089).
Indents: none.
Headers: 30.3 px against 22 px (css:73); the document headings are 19px weight 700 (h1) and 15px weight 700.
Toolbars and actions: none.
Spacing: the document column is 1430 px wide at wide with no maximum width.
Type sizes: body 12.5px x563, code 11.5px monospace x359, diagram text 10px x193 and 8px x170 against 13px (css:1085).
Icons: svg diagrams 213 to 956 px wide.
Hover actions: none.
Focus: links take the browser ring 1px, not the application ring (css:368).
Empty state: none.
Error state: none.
Better and kept: the diagrams are inline vector images.
Counterpart: VS Code's Markdown preview in an editor tab; measured against the editor content font (css:1104, css:1105).

## config

State: narrow 309 px and wide 1454 px, computed styles only (Config is never screenshot); the `local.yml` card was not opened.
Fixed set: row n/a; indent none; header 30.3 px, title 49 px wide, no tools; toolbar action none; text button `.tool` 85 x 25.3 px x12; input none read; badge `.disclosure` 87, 81, 80 and 85 x 21.3 px (radius 999px) and counts 22 x 17.3 px; empty state none; error state none; hover actions none; focus ring not read.
Rows: cards 253 px at narrow, 1398 px at wide, radius 10px, 12 cards.
Indents: none.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: 12 `.tool` buttons 85 x 25.3 px against 26 px text buttons with radius 4px (css:255).
Spacing: intro 253 px at narrow, radius 0.
Type sizes: 11.5px x24, 12.5px x17, 11.5px weight 700 x13, 15px weight 700 x12, 11.5px monospace x4 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x24 against 16 px (css:252).
Hover actions: none.
Focus: not read.
Empty state: none.
Error state: none.
Better and kept: one card per config file.
Counterpart: the VS Code Settings editor (css:440 to css:616).
Re-measure against the notes: note line 30 reads no control in the first screen; the measure over the whole view is 12 `.tool` buttons of 85 x 25.3 px.

## audit

State: narrow 309 px and wide 1454 px, shots `audit-narrow.png`, `audit-wide.png`; one open item. `audit-narrow.png` is cropped to the tab strip and the header, `audit-wide.png` to the header and the section line; the open item states hub work, so its measures are by computed styles only.
Fixed set: row none; indent none; header 38.3 px (search input 144 x 25 px), 11.5px weight 700 uppercase; toolbar action none; text button `.tool` mute 63 x 25.3 px, Findings 82 x 25.3 px; input search 144 x 25.3 px; badge plain count 7 x 17.3 px, tab count badge 1 accent; empty state none reached; error state none; hover actions none (no row at the hover point); focus ring 2px offset -2px on the search input.
Rows: one card 285 px at narrow, 1430 px at wide, radius 10px, left rule 1px against a 22 px row (css:1089).
Indents: none.
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: `x mute` is a 25.3 px text button.
Spacing: the section heading `Open items (TODO / VERIFY) 1` has a plain count.
Type sizes: card title 15px weight 700, 11.5px monospace, 11.5px x3, 12.5px x1 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x2 against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: each item carries its mute action.
Counterpart: the VS Code Problems panel (css:824 to css:870), whose count is a badge (css:309).
Re-measure against the notes: note line 27 agrees with the measure.

## memories

State: narrow 309 px (pane 0) and wide 1454 px, computed styles only (no shot, personal content).
Fixed set: row photo tile `B.tool` 283 px wide and 159 to 628 px high at narrow, radius 0, border none, 15px; indent none; header 38.3 px (title 68 px, one tool `Add` 91 x 25.3 px); toolbar action none; text button `.tool` 91 x 25.3 px (add photo); input none; badge none; empty state text 11.5px (loading or empty, one node); error state none reached; hover actions none; focus ring 2px offset -2px on add photo.
Rows: photos fill the body; no row list (css:1089).
Indents: none.
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: the add control is a 25.3 px text button.
Spacing: photos fill the width of the pane.
Type sizes: 11.5px weight 700 x1, 11.5px x1 against 13px (css:1085).
Icons: none read.
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: one 11.5px node; VS Code's is centred (css:372).
Error state: none reached.
Better and kept: photos fill the pane without chrome.
Counterpart: VS Code has no photo view; the tiles are measured against the Explorer tree row (css:949, css:1089).

## calendar

State: narrow 309 px and wide 1454 px, computed styles only (no shot, personal content). No calendar address was fetched.
Fixed set: row `ec-grid` cell 30.3 px at 11.5px; indent none; header 30.3 px, no tools; toolbar action none; text button `.tool` Refresh now 85 x 25.3 px, Add account 105 x 25.3 px, Previous week, Today, Next week, and Day, Week, Month, List; input none; badge tag 58 x 19.3 px; empty state none reached; error state none reached; hover actions none (day hover background transparent); focus ring 2px offset -2px on Refresh now.
Rows: `A.ec-event` 48 px high, 95 and 189 px wide, 9.8px text, radius 3px, padding 2px, border 0.
Indents: none.
Headers: 30.3 px against 22 px (css:73); the status line and the account line (`.opener` 30 x 23.8 px at 13.5px x2) sit below the header.
Toolbars and actions: Week is filled accent in the segmented control.
Spacing: events in one saturated blue.
Type sizes: event text 9.8px, 11.5px x49, 15px weight 700 x1 against 13px (css:1085); 9.8px is the smallest text in the application and is not on the type scale.
Icons: none read.
Hover actions: none, day hover background transparent.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: the week grid shows events from several accounts.
Counterpart: VS Code has no calendar; the event text is measured against the workbench body text (css:1085).
Re-measure against the notes: note line 28 reads event text 9.775px; the measure is 9.8px.

## account-setup

State: narrow 309 px and wide 1454 px, shots `account-setup-narrow.png`, `account-setup-wide.png`; the setup steps with no secret field filled.
Fixed set: row numbered steps `L` 22.9 px at 15px, 22.5 px and 43.8 px; indent none; header 30.3 px (title 108 px), no tools; toolbar action `.tool` 26 x 19.6 px x9 (copy); text button `.tool` Save 44 x 25.3 px x2; input text 1420 x 25.3 px x3 and password 1420 x 25.3 px at wide, 275 x 25.3 px at narrow (11.5px, radius 6px); badge tag 36 x 19.3 px ("set up"); empty state none; error state none; hover actions Copy 26 x 20 px at rest; focus ring a link `A` 254 x 18 px with outline auto 1px rgb(0,95,204) offset 1px (the browser default).
Rows: steps 22.9 px at 15px against 22 px at 13px (css:1089, css:1085).
Indents: none.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: copy buttons on scope lines are bordered 26 x 19.6 px.
Spacing: the inputs fill the pane (1420 px) at wide.
Type sizes: 15px x17, 11.5px monospace x9, 11.5px x8, 10.5px weight 700 x4 (field labels), 13.5px weight 700 x2 (provider headings) against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x9, 15 x 15 px x6 against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: links take the browser ring; inputs and tools take the 2px ring (css:368).
Empty state: none.
Error state: none reached.
Better and kept: each scope line has its own copy button.
Counterpart: the VS Code Settings editor items (css:508), which pad 12px 14px 18px.

## history

State: narrow 309 px and wide 1454 px, shots `history-narrow.png`, `history-wide.png`; the filter held the text `transcript` before the look, so the shots show its filtered-empty text. The populated state was measured after clearing the filter (27 entries, the newest dated 09-30 18:28, no entry written during the audit) and the filter text was typed back afterwards.
Fixed set: row `li` 284.7 px wide and 104 to 146 px high at narrow (padding 4px 0, line-height 22.5 px, border-bottom 1px rgb(226,232,240)); indent none; header 38.3 px (filter input 144 x 25.3 px in the header), 11.5px weight 700 uppercase; toolbar action none; text button `.tool` Undo 65 x 25.3 px, drawn at rest; `.disclosure` pills 80.5 x 21.3 px, drawn at rest; input filter 144 x 25.3 px (11.5px, radius 6px, padding 3px 8px); badge none; empty state "No writes are recorded yet." glyph 12.5 x 12.5 px and 12.5px text, 39 px high; error state none reached; hover actions none (the row background stays transparent on hover and the Undo and pill controls are always drawn); focus ring 2px rgb(189,93,56) offset -2px on the filter input and on Undo.
Rows: 104 to 146 px high against 22 px (css:1089); the Undo button and the pills are drawn on every row.
Indents: none.
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: the filter is in the header as a 144 px input.
Spacing: the empty line sits top left.
Type sizes: 12.5px against 13px (css:1085).
Icons: svg 12.5 x 12.5 px against 16 px (css:252).
Hover actions: none revealed; Undo and the pills are drawn at rest, where VS Code reveals row actions on hover or focus-within (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: "No writes are recorded yet." with a glyph, 12.5px, top left; the same sentence is shown while the filter hides all 27 rows, so it states a false fact in that case, and it does not name the filter that hides the rows. VS Code's list filter message is centred with 40px top padding at 70% opacity (css:14).
Error state: none reached.
Better and kept: the filter sits in the header.
Counterpart: the VS Code Timeline pane (css:812 to css:821).

## catalogue

State: narrow 309 px and wide 1454 px, shots `catalogue-narrow.png`, `catalogue-wide.png`. Both shots are cropped above the Projects group, whose chips carry project counts; the groups below are measured by computed styles only.
Fixed set: row view buttons `B.tool` 25.3 px; indent none; header 30.3 px, no tools; toolbar action none; text button `.tool` 82, 69, 74, 115 and 61 x 25.3 px (icon, label, shortcut code); input search (the focus lands on the search input); badge 13 x 12.8 px x7 and 18 x 12.8 px x4 (8.5px, radius 999px); empty state none; error state none; hover actions none (the hover point lands between sections); focus ring 2px offset -2px on the search input.
Rows: buttons wrap in a flow, 25.3 px high, against 22 px rows (css:1089).
Indents: none.
Headers: 30.3 px against 22 px (css:73); group heads are 11.5px weight 700 uppercase with an icon and a letter code.
Toolbars and actions: shortcut codes (f1 and others) 8.5px monospace x61 and 8.5px monospace weight 700 x12.
Spacing: wrapped flow of buttons at 1454 px.
Type sizes: 8.5px monospace, 11.5px x51, 11.5px weight 700 x13 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x62 against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none.
Error state: none.
Better and kept: every view shows its shortcut code next to its name.
Counterpart: the VS Code quick open list and the keybindings table (css:1007 to css:1052).

## settings

Its findings go to S3, which rebuilds this view as VS Code's Settings editor (S3c builds it); the build steps from the Proposed grouping do not touch it.
State: narrow 309 px and wide 1454 px, shots `settings-narrow.png`, `settings-wide.png`; the Theme switch of the case-11 look was made and undone here, final theme light.
Fixed set: row rail row `div.row` 25.3 px at 15px (three lines stacked at narrow, 86 px), 27.3 px x2; indent none; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action `.tool` 26 x 19.6 px x39 (rail row icons); text button `.tool` 59 x 25.3 px (Save), Appearance `.opener` Theme 69 x 27.3 px and 98 x 27.3 px (radius 6px, padding 4px 6px); input text 144 x 25.3 px x12 (11.5px, radius 6px), select 116 x 23.5 px x12 and `B.select` 89 x 25.3 px x2; badge none; empty state none; error state none; hover actions none; focus ring the Theme opener, 2px offset -2px.
Rows: 25.3 px against the settings item padding 12px 14px 18px (css:508).
Indents: none; the settings tree TOC has 22 px rows (css:493, css:494).
Headers: 30.3 px against the settings header with padding 3px 24px and a top margin of 11 px (css:442); section titles APPEARANCE, RAIL, PAGES are small uppercase labels, where VS Code uses 600 weight group titles padded 10px 10px 10px 15px (css:564).
Toolbars and actions: 39 bordered icon tools against 16 px actions (css:133).
Spacing: the form takes about 800 px at the left of 1454 px with the right half empty.
Type sizes: 11.5px x72, 11.5px weight 700 x4 against 13px (css:1085).
Icons: svg 11.5 x 11.5 px x72 against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none.
Error state: none.
Better and kept: the rail row edits label, icon and page on one line at wide.
Counterpart: the VS Code Settings editor (css:440 to css:616).
Re-measure against the notes: note line 29 reads 39 bordered icon buttons; the measure is 39 `.tool` 26 x 19.6 px.

## pages

State: narrow 309 px and wide 1454 px, shots `pages-narrow.png`, `pages-wide.png`; 7 pages.
Fixed set: row `.item` 22 px at 13px; indent none (flat rows, the current page TEST is bold with a check); header 30.3 px, no tools; toolbar action `.tool` Rename, Reset and Close 22 x 15.6 px x19 (r6, hidden until hover); text button New page 90 x 25.3 px; input none; badge none; empty state none; error state none; hover actions Rename, Reset to its a.. and Close 22 x 16 px, shown on hover; focus ring 2px offset -2px on New page.
Rows: 22 px, equal to VS Code (css:1089); the hover background is rgb(241,245,249) with cursor grab.
Indents: none against 8 px (css:1095).
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: three hover tools of 22 x 16 px, radius 6px, border 1px against 16 px codicons in a 20 x 20 px box (css:133, css:85).
Spacing: `B.main` 1337 x 22 px (13px, radius 0, border 0).
Type sizes: 13px, equal to VS Code (css:1085).
Icons: svg 11.5 x 11.5 px x20 against 16 px (css:252).
Hover actions: revealed on hover, as VS Code (css:86).
Focus: ring 2px offset -2px (css:368).
Empty state: none.
Error state: none.
Better and kept: the 22 px rows at 13px and hover-revealed actions already match; the build keeps them.
Counterpart: the VS Code Explorer tree (css:949).

## customization

State: narrow 309 px and wide 1454 px. Shots `customization-empty-narrow.png`, `customization-empty-wide.png` (the empty state "No file is open here.") and `customization-narrow.png`, `customization-wide.png` (the populated state, cropped to the header and tab strip, because the body is a rule file and its path under the home folder; the body measures are by computed styles only). The populated state was reached with the agent menu of the Customizations block in the Sessions view set to Codex and its Instructions row `~/.codex/AGENTS.md`.
Fixed set: row none (the body is one `pre` block); indent none; header 30.3 px (title 106 px), 11.5px weight 700 uppercase, no tools; toolbar action none; text button none; input none; badge none; populated body `pre` 285 x 641 px at narrow and 1430 x 635 px at wide, 11.5px monospace, line-height 17.25 px, padding 0, white-space pre-wrap; empty state 12.5px, 39 px high, glyph 12.5 x 12.5 px, top left; error state not reached; hover actions none; focus ring not read.
Rows: the populated body is one text block of 17.25 px lines (11.5px monospace) against the VS Code editor line of 18 px at 12px (css:1104, css:1105).
Indents: none reached.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: none.
Spacing: the empty state is one line at the top left; the populated `pre` has padding 0 and runs to the pane width.
Type sizes: 11.5px monospace in the body (one `pre`), 12.5px x1 in the empty state, 11.5px weight 700 x1 in the header against 13px (css:1085) and the editor 12px (css:1104).
Icons: svg 12.5 x 12.5 px against 16 px (css:252).
Hover actions: none.
Focus: not read.
Empty state: "No file is open here." 12.5px with a glyph, top left; VS Code's is centred with 20px padding (css:372).
Error state: not reached.
Better and kept: the empty sentence names the missing file.
Counterpart: the VS Code editor with a file open (css:1104, css:1105 for the editor font) and the welcome view for the empty state (css:372 to css:379). The view is a `pre` block with no syntax colouring, so it holds no Monaco instance.

## deposit

State: narrow 309 px and wide 1454 px, shots `deposit-narrow.png`, `deposit-wide.png` (empty: no project chosen) and the populated state (a 479 px pane, a project opened by the project card More menu), which has no shot because the pane names the project and its manuscript state; its measures are by computed styles only.
Fixed set: row mirror name 15px monospace; indent none; header 30.3 px, title `DEPOSIT`, 11.5px weight 700 uppercase, no tools; toolbar action none; text button `.tool` adopt 50, plan 41, create 52, suggest 62 and commit, push, snapshot x 25.3 px (11.5px, radius 6px, disabled ones faded); input 455 x 25.3 px and textarea 455 x 77 px (radius 6px); `.opener` branch 40 x 27.3 px; badge none; empty state "No project chosen. Open the deposit from a project card." 12.5px, 58 px high, glyph 12.5 x 12.5 px; error state none reached; hover actions none; focus ring 2px offset -2px on the id button `YQ530VVFGK` 116 x 22 px.
Rows: none.
Indents: none.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: seven text buttons of 25.3 px side by side against a text button of 26 px (css:255).
Spacing: "No plan yet. Press plan to see what would ship." and "Press plan first." are plain 12.5px lines.
Type sizes: 11.5px x9, 10.5px x4, 15px monospace x2, 12.5px x2 against 13px (css:1085).
Icons: svg 12.5 x 12.5 px against 16 px (css:252).
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: 12.5px, 58 px high, glyph, top left (css:372).
Error state: not reached; the deposit commit and push controls write and were not pressed.
Better and kept: the buttons are disabled with a faded style until their precondition holds, and the empty text names the next action.
Counterpart: the VS Code Source Control view (X3d's extract `X3d-vscode-scm.css`) for the commit and push buttons.
Re-measure against the notes: note line 31 reads a header plus one empty-state line with an icon, 12.5px; the measure agrees, and the populated state adds the buttons and fields above.

## doc

State: narrow 309 px and wide 1454 px. Shots `doc-empty-narrow.png`, `doc-empty-wide.png` (the empty state of the Hub document view, title `HUB DOCUMENT`, 104 px) and `doc-narrow.png`, `doc-wide.png` (the populated state, the HPC how-to opened from the HELP buttons of the Views catalogue; `doc-wide.png` is cropped to the pane alone, the title, the introduction and the contents list; `doc-theme-dark.png` is the same view in the dark theme).
Fixed set: row Markdown blocks 18.8 to 75 px high (narrow); indent the contents list nests its links; link 14.5 px high at narrow; header 30.3 px, 11.5px weight 700 uppercase, no tools; toolbar action none; text button none; input none; badge none; document body `div.doc` 1398 x 5816 px at wide (max-width none, padding 0, 12.5px), `h1` 24px weight 700 (1398 x 36 px), links 12.5px (154 x 15 px), no svg; empty state "No document chosen. Open one from a group of the Views catalogue." 12.5px, 58 px high, glyph 12.5 x 12.5 px; error state not reached; hover actions none; focus ring not read.
Rows: Markdown blocks of 18.8, 37.5, 44.5, 56.3 and 75 px at narrow, link rows 14.5 px, against 22 px (css:1089).
Indents: none reached.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: none.
Spacing: one line top left.
Type sizes: populated: 11.5px monospace x343, 12.5px x307, 19px weight 700 x14, 24px weight 700 x1 at narrow; empty state 12.5px against 13px (css:1085).
Icons: the populated document draws no svg; the empty state draws svg 12.5 x 12.5 px against 16 px (css:252).
Hover actions: none.
Focus: not read.
Empty state: as deposit (css:372).
Error state: not reached.
Better and kept: the empty sentence names where to open a document from.
Counterpart: the VS Code Markdown preview and editor (css:1104, css:1105). The document is rendered Markdown with no Monaco instance.
Re-measure against the notes: note line 31 agrees with the measure for the empty state.

## document

State: narrow 309 px and wide 1454 px, shots `document-narrow.png`, `document-wide.png`; `side-projects/residual/mockup.html` in a frame. Both shots are cropped to the header; the frame shows a side project's mockup, so the frame measures are by computed styles only.
Fixed set: row none; indent none; header 38.3 px (title 95 px, tools 138 x 25 px), 11.5px weight 700 uppercase; toolbar action none; text button `.tool` Open in a browser tab 138 x 25.3 px (11.5px, radius 6px); input none; badge none; empty state none reached; error state none reached; hover actions none; focus ring not read.
Rows: none.
Indents: none.
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: one 25.3 px text button against a 20 x 20 px icon action (css:133, css:85).
Spacing: the frame is 285 px wide at narrow inside a body padded 10px 12px, 1430 px at wide, radius 0.
Type sizes: the framed page sets its own.
Icons: none.
Hover actions: none.
Focus: not read.
Empty state: none reached.
Error state: none reached.
Better and kept: the frame shows the page in its own theme (dark inside the light shell).
Counterpart: the VS Code webview editor (css:619 to css:752 for the tab).

## editor

State: narrow 309 px and wide 1454 px, no shot at either width; the manifest form for a project. Nothing was typed or saved. The form shows a project's manifest fields (unpublished research), so its measures are by computed styles only.
Fixed set: row field row; indent none; header 94.8 px at narrow (title cut, 213 px of 797 px, tools 63 x 82 px on 2 rows), 38.3 px at wide (tools 237 x 25 px: "nothing changed", Save, Revert); toolbar action none; text button `.tool` 275 x 25.3 px x11 (full width), 190 x 25.3 px x3, 71, 87 and 242 x 25.3 px; input text 275 x 25.3 px x15 at narrow, 1420 x 25.3 px at wide (11.5px, radius 6px, padding 3px 8px), textarea 275 x 59.8 px x9, date 123 x 27.3 px x5, select 70 x 23.5 px x2; badge tag 59 x 19.3 px; empty state none; error state none reached; hover actions none; focus ring 2px offset -2px.
Rows: field rows against the settings item with padding 12px 14px 18px (css:508).
Indents: none.
Headers: 94.8 px at narrow against 22 px (css:73); the section heading `CORE` is accent uppercase with an underline.
Toolbars and actions: 242 px wide toggle chips are text buttons at full width.
Spacing: the inputs fill the pane (1420 px) at wide.
Type sizes: labels 10.5px weight 700 uppercase x46, help text 10.5px x36, 11.5px x77 against 13px (css:1085).
Icons: none read.
Hover actions: none.
Focus: ring 2px offset -2px; input focus keeps the border 1px rgb(226,232,240) (css:368).
Empty state: none.
Error state: none reached.
Better and kept: a "nothing changed" status beside Save and Revert tells the dirty state.
Counterpart: the VS Code Settings editor items (css:508 to css:616).

## file

State: narrow 309 px and wide 1454 px, no shot at either width; `tools/present/assets/equations/eq_btfno.png`, drawn from a natural 1628 x 235 px (`max-width: 100%`, `object-fit: contain`). The picture is an equation of an unpublished manuscript, so its measures are by computed styles only.
Fixed set: row none; indent none; header 69.5 px at narrow (title cut, 83 px of 118 px, tools 194 x 57 px on 2 rows), 38.3 px at wide (the title cut and the tool rows were read on another equation picture and show the same two tool rows); toolbar action none; text button `.tool` Bookmark this file 134 x 25.3 px and Open in a browser tab 138 x 25.3 px; input none; badge none; empty state none reached; error state none reached; hover actions none; focus ring not read.
Rows: none.
Indents: none.
Headers: 69.5 px at narrow against 22 px (css:73).
Toolbars and actions: two text buttons against icon actions (css:133).
Spacing: the picture is scaled to the pane width, not drawn at its natural size: 284.6 x 41.1 px at 309 px, 455.3 x 65.7 px at a 490 px pane and 1430.0 x 206.4 px at wide, from 1628 x 235 px, at the top left of the body with no centring and no zoom control.
Type sizes: none.
Icons: none.
Hover actions: none.
Focus: not read.
Empty state: none reached.
Error state: none reached.
Better and kept: the file's own bookmark is one button.
Counterpart: the VS Code image preview, whose stylesheet lines are not in `U2-vscode.css`; no VS Code value is taken for the picture frame.

## note

State: narrow 309 px and wide 1454 px, shots `note-narrow.png`, `note-wide.png`; an untitled note, nothing typed. `note-wide.png` is cropped below the tab strip, which names a person.
Fixed set: row none; indent none; header 30.3 px (title `UNTITLED NOTE` 101 px), the status text "Not saved yet" 75 x 17 px in the tools slot, 11.5px weight 700 uppercase; toolbar action none; text button none; input text 275 x 25.3 px at narrow and 1420 x 25.3 px at wide (11.5px, radius 6px, padding 3px 8px), textarea 275 x 353 px at narrow and 1420 x 353 px at wide (resize handle); badge none; empty state none; error state none; hover actions none; focus ring not read.
Rows: none.
Indents: none.
Headers: 30.3 px against 22 px (css:73).
Toolbars and actions: no Save button in the header, the status sits there.
Spacing: the textarea is 353 px of about 600 px of body height, so it does not fill the pane.
Type sizes: labels 10.5px weight 700 uppercase x2, inputs 11.5px against 13px (css:1085).
Icons: none.
Hover actions: none.
Focus: not read.
Empty state: none.
Error state: none.
Better and kept: the not-saved status is visible.
Counterpart: the VS Code untitled editor (css:1104, css:1105).

## person

State: narrow 309 px and wide 1454 px, computed styles only (no shot, personal content).
Fixed set: row `L` 25.3 px x10 at 15px, 22.5 px x1, 45 px x1; indent none; header 69.6 px at narrow (title cut, 117 px of 134 px, tools 160 x 57 px on 2 rows), 38.3 px at wide (tools 183 x 25 px); toolbar action none; text button `.tool` 92, 85, 60, 89 and 64 x 25.3 px; input none; badge tag 21 x 19.3 px at narrow, 33 x 19.3 px at wide; empty state none reached; error state none reached; hover actions none (rows 25 px high, no hover background); focus ring 2px offset -2px on Joint work.
Rows: 25.3 px against 22 px (css:1089).
Indents: none.
Headers: 69.6 px at narrow against 22 px (css:73).
Toolbars and actions: five 25.3 px text buttons.
Spacing: section labels 9.5px weight 700 uppercase x2.
Type sizes: 11.5px x13, 15px x3, 11.5px weight 700 x3 against 13px (css:1085).
Icons: none read.
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none reached.
Error state: none reached.
Better and kept: each person page links to joint work and files.
Counterpart: the VS Code Settings editor item rows (css:508).

## project

State: narrow 309 px and wide 1454 px, no shot at either width; one project card. Q91 builds on this view; its findings go there. The card shows a project's plan and manuscript state (unpublished research), so its measures are by computed styles only.
Fixed set: row `frow` 25.3 px x13 and 19.3 px x4; indent none; header 30.3 px (title cut at narrow, 285 px of 797 px), no tools; toolbar action `.tool` 26 x 19.6 px x2 (pin, copy context) and `.opener` More 26 x 19.6 px; text button `.tool` 86 x 25.3 px x3, 71 x 25.3 px x2, file links 114 x 19.8 px at 12.5px (radius 0, border 0); input search 144 x 25.3 px; badge tags 22 x 19.3 px, chips 48 x 19.8 px (10.5px, radius 999px) and 131 x 21.3 px (11.5px); empty state 12.5px, 39 px high; error state none; hover actions none revealed (card tools at rest); focus ring not read.
Rows: 25.3 px and 19.3 px against 22 px (css:1089); one card 285 px at narrow, 1430 px at wide, radius 10px.
Indents: none (css:1095).
Headers: 30.3 px; the title is cut to 285 px of 797 px at narrow (css:67).
Toolbars and actions: the More menu holds Ask, folder, Show in Files, + subtask, edit manifest, deposit; menu items are 25.3 px at 11.5px, where VS Code's menu option is 13px at 28 px with radius 3px and padding 0 4px (css:437).
Spacing: `B.open` 782 x 22.5 px at 15px (the files disclosure).
Type sizes: 12.5px x70, 11.5px x26, 9.5px weight 700 x8, 19px weight 700 x6 (title), 12.5px weight 700 x4 against 13px (css:1085).
Icons: svg against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: not read.
Empty state: 12.5px, 39 px high.
Error state: none reached.
Better and kept: the status line and the card controls sit on one card.
Counterpart: as projects (css:949).

## slides

State: narrow 309 px and wide 1454 px, no shot at either width; opened from Present's Slides button; nothing saved. The slide rows show the content of unpublished research, so the measures are by computed styles only.
Fixed set: row `row` 33.8 px (24 rows, checkbox 13 x 13 px, drag grip 15 x 15 px, index 10.5px monospace, title 11.5px, kind tag, up 32 x 25.3 px and down 47 x 25.3 px); indent 6 px left padding; header 38.3 px (title 45 px, Save 44 x 25.3 px); toolbar action none; text button `.tool` up, down, Save; input none; badge tag 38 x 19.3 px (kind); empty state none; error state none; hover actions none revealed (tools at rest); focus ring not read.
Rows: 33.8 px against 22 px (css:1089); the row box is 400 px wide at narrow, wider than the 309 px pane (title truncated).
Indents: 6 px against 8 px (css:1095).
Headers: 38.3 px against 22 px (css:73).
Toolbars and actions: up and down are text buttons 25.3 px against a text button of 26 px (css:255).
Spacing: intro 285 px.
Type sizes: 11.5px, 10.5px monospace against 13px (css:1085).
Icons: drag grip 15 x 15 px against 16 px (css:252).
Hover actions: at rest (css:86).
Focus: not read.
Empty state: none.
Error state: none.
Better and kept: up and down buttons reorder without a pointer.
Counterpart: the VS Code Explorer tree rows (css:949) for drag handles and row height.

## source

State: narrow 309 px and wide 1454 px, shots `source-narrow.png`, `source-wide.png`, `source-error.png`; a hub `.md` rule file opened through the Files bookmark list, and the error state (479 px pane): a source tab the server refused (`Cannot open: HTTP 404`) because its symlink resolves outside every root. The refusal is booked outside this audit. `source-wide.png` is cropped below the tab strip. `source-theme-dark.png` is a source tab (`build.py`) in the dark theme.
Fixed set: row Monaco line 17 px; indent none; header 100.8 px at narrow (title cut, 102 px of 228 px, tools 175 x 88 px on 3 rows), 38.3 px at wide (full title, tools 392 x 25 px); toolbar action none; text button `.tool` Save 62, Revert 71, Preview 79 and `Take this bookmark out` 163 x 25.3 px (11.5px, radius 6px); input none; badge none; empty state none; error state "Cannot open: HTTP 404", `SPAN.message` 142 x 19 px, 12.5px, colour rgb(95,111,133), a 12.5px warning glyph, placed at y 400 in a 642 px block, left aligned, no retry control; hover actions none; focus ring 2px offset -2px on Save.
Rows: editor line 17 px at 11.5px monospace; VS Code's editor default is 12px with an 18 px line on macOS (css:1104, css:1105).
Indents: none.
Headers: 100.8 px at narrow against 22 px (css:73); the full title shows at wide.
Toolbars and actions: four text buttons in the header; the bookmark button is filled accent when the file is bookmarked.
Spacing: the editor and the rendered Markdown preview sit side by side (138 px editor at narrow, about 700 px each at wide), a sash row 611 px high with cursor col-resize.
Type sizes: editor 11.5px monospace, line numbers 35 px wide, gutter 78 px, minimap 13 px wide; the preview heading is 24px weight 700 and the preview text 12.5px against the editor 12px and 18 px line (css:1104, css:1105).
Icons: none read.
Hover actions: none.
Focus: ring 2px offset -2px (css:368).
Empty state: none.
Error state: a source tab refused because its symlink resolves outside every root, shown as a centred-in-block, left-aligned 12.5px sentence in a muted colour with a glyph and no retry; VS Code's notification has padding 10px 5px and a 22 px message line (css:403, css:406).
Better and kept: the side-by-side preview and the bookmark button in the header.
Counterpart: the VS Code editor with a Markdown preview (css:619 to css:752 for the tab, css:1104 for the font).
Re-measure against the notes: note line 32 lists source as not looked at; it was measured here in the light theme, then in the dark theme (Common differences, theme switch).

## Common differences

Each item names the views it holds for. Measures are the ones given in the view sections.

1. Header wrap. `ui/frame/Pane.svelte`'s `.tools` has `min-width: 0` and `ui/frame/Toolbar.svelte` wraps, so a pane's header actions wrap onto further lines when the title is long and the pane narrow, and the title is cut to a few letters beside them. VS Code keeps the header at 22 px on one line, cuts the title with an ellipsis and shows the actions only on hover or focus-within (css:73, css:67, css:86). Measured header heights at 309 px (a header with no wrap is 30.3 px without tools and 38.3 px with one row of tools):

| View | Narrow header | Title shown | Wide header |
| --- | --- | --- | --- |
| projects | 165.3 px, 6 rows | 16 of 67 px | 40.3 px, 2 rows |
| coauthor | 196.5 px, 7 rows | 17 of 72 px | 40.3 px, 2 rows |
| archive | 165.3 px, 6 rows | 14 of 57 px | 40.3 px, 2 rows |
| leads | 100.8 px, 3 rows | 51 of 106 px | 38.3 px |
| source | 100.8 px, 3 rows | 102 of 228 px | 38.3 px |
| editor | 94.8 px, 2 rows | 213 of 797 px | 38.3 px |
| transcript | 71.5 px (102.8 px with no turns) | 54 of 81 px | 40.3 px, 2 rows |
| timeline | 71.5 px (40.3 px with no session) | 55 of 59 px | 40.3 px, 2 rows |
| changes | 71.5 px | 43 of 62 px | 40.3 px, 2 rows |
| agents | 71.5 px (40.3 px with the 83 px opener) | 49 of 51 px | 40.3 px, 2 rows |
| session-detail | 71.5 px | 52 of 55 px | 40.3 px, 2 rows |
| present | 69.5 px | 44 of 58 px | 38.3 px |
| venues | 69.6 px | 41 of 51 px | 38.3 px |
| code | 69.6 px | 30 of 35 px | 38.3 px |
| statements | 69.6 px | 62 of 84 px | 38.3 px |
| funding | 69.6 px | 46 of 58 px | 38.3 px |
| events | 69.6 px | 74 of 106 px | 38.3 px |
| education | 69.6 px | 92 of 144 px | 38.3 px |
| applications | 69.6 px | 67 of 93 px | 38.3 px |
| joint-work | 69.6 px | 60 of 80 px | 38.3 px |
| tasks | 69.6 px | 34 of 41 px | 38.3 px |
| radar | 69.6 px | 63 of 69 px | 38.3 px |
| linkedin | 69.5 px | 59 of 60 px | 38.3 px |
| gallery | 69.5 px | 37 of 57 px | 38.3 px |
| file | 69.5 px | 83 of 118 px | 38.3 px |
| person | 69.6 px | 117 of 134 px | 38.3 px |
| terminal | 69.5 px started, 63.8 px composer | 36 of 65 px | 38.3 px |

The project view cuts its title at narrow with no tools (285 of 797 px). Views whose header holds one row of tools at 309 px and do not wrap: pillars, domains, data, audit, history, inbox, memories, slides, document.

2. Live theme switch. No difference: switching the theme in Settings repaints the application and an open Monaco editor on its own, with no other action. Measured with the TEST tab `visibilityState` `visible` and 121 `requestAnimationFrame` callbacks in one second, read before each switch. The theme in force before was light (body rgb(241,245,249); the Settings Appearance row read `Theme light`). The switch was made through the Theme list of Settings (the opener, then the entry), light to dark twice and dark to light twice; a pointerdown-armed `requestAnimationFrame` watcher logged the first frame at which a background changed. The page body changed between rgb(241,245,249) and rgb(11,17,32) 119 ms, 100 ms and 150 ms after the click on the entry. Monaco on the source tab `build.py` (class `vs` in light, `vs-dark` in dark) changed its background between rgb(255,255,255) and rgb(18,26,43) 183 ms, 168 ms and 394 ms after the click, with the first token colour rgb(102,109,122) in light and rgb(138,144,157) in dark and the gutter on the background colour; on the first light to dark switch Monaco was already `vs-dark` at the first read after the click and at every read up to 1.8 s. The populated doc view (the HPC how-to, rendered Markdown) read text rgb(15,23,42) in light and rgb(231,236,243) in dark, and a code block rgb(241,245,249) in light and rgb(27,38,56) in dark. The populated customization view (one `pre`, 455 x 640 px, 11.5px, background transparent) read text rgb(15,23,42) in light and rgb(231,236,243) in dark. Shots: `source-theme-dark.png` and `doc-theme-dark.png`. The theme was set back to light through the same list and confirmed by a read (body rgb(241,245,249), Monaco class `vs` with background rgb(255,255,255), the Appearance row reading `Theme light`). Views that hold Monaco: source only (doc is rendered Markdown and customization is one `pre` block).

3. Control heights. The application has six control heights: `.act` 14.8 px, icon tool 19.6 px, compact tool 22 px, select 23.5 px, input and text tool 25.3 px and `.opener` 27.3 px; VS Code has an action of 20 px (css:133, css:85), a text button of 26 px (css:255, 16 px line plus 4px padding twice plus a 1px border twice) and an input of 26 px in the Search widget (css:764). Holds for focus, search, history, session-detail, timeline, transcript, changes, settings, editor, deposit, present, every collection view.

4. Bordered text buttons in header and rows. Actions are text buttons of 25.3 px with radius 6px and a 1px border (11.5px, padding 3px 8px) where VS Code's header actions are borderless 16 px codicons with 2px padding (css:133, css:85) and its text button is radius 4px at 12px (css:255). Holds for every view with a text tool in its header or body: projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, present, radar, leads, inbox, linkedin, session-detail, terminal, transcript, timeline, changes, agents, status, gallery, hpc, usage, audit, memories, calendar, account-setup, catalogue, settings, config, deposit, document, editor, file, note, person, project, slides, source, search, history.

5. Bordered icon tools in cards and rows. Icon tools are 26 x 19.6 px with a 1px border, radius 6px and an 11.5 px icon; VS Code's action icon is 16 px, no border, hover outline dashed 1px (css:133, css:252, css:237). Holds for projects (x191), coauthor (x48), archive (x71), pillars (x9), domains (x9), venues (x68), data (x54), code (x60), statements (x6), funding (x39), events (x24), education (x68), applications (x99), joint-work (x39), radar (x746), inbox (x48), settings (x39), account-setup (x9).

6. Hover actions drawn at rest. Card and row actions are opacity 1 with the mouse away; VS Code reveals actions on hover or focus-within (css:86). Holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, tasks, radar, leads, inbox, linkedin, focus, session-list (the per-row opener), account-setup. Pages reveals on hover and matches.

7. Cards and boxes where VS Code has rows. Collections draw cards (radius 10px, a 3px coloured left rule, 285 to 352 px wide) with 15px titles; VS Code lists are 22 px rows with a 13px label (css:1089, css:1085). Holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, radar, leads, inbox, linkedin, usage, gallery, audit, config, project.

8. Row heights. Rows measure 14.5, 17.3, 18.8, 19.3, 21.3, 25.3, 29.8, 32.3, 33.8 and 44 px; VS Code is 22 px (css:1089, css:1090, css:1091). Holds for focus, venues, code, tasks, status, help, session-list, timeline, agents, changes, search, slides, person, usage, gallery.

9. Type sizes. Body is 11.5px and 12.5px; micro labels are 8.5px, 9.5px, 9.8px and 10.5px; titles 15px; two controls use 13.5px; the workbench body is 13px (css:114, css:1085) and the header 11px (css:67). The 9.8px text of the calendar and 8.5px of the catalogue codes are off the scale of 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 15, 19 and 24. Holds for every view.

10. Status chips. Chips are three shapes: radius 999px at 19.8 to 21.3 px, radius 6px at about 25 to 28 px (filled toggles and status), and a bordered pill with an icon (joint-work); VS Code has a count badge of 11px, radius 11px, min 18 px (css:309) and no filled status chip. Holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, radar, map, catalogue, session-list.

11. Focus ring. The application ring is 2px solid rgb(189,93,56) offset -2px; VS Code's is 1px solid offset -1px (css:368). Three other ring styles exist: the browser default 1px rgb(0,95,204) on focus item names, help links and account-setup links; outline 2px offset 1px on map chips. Holds for every view; the browser ring holds for focus, help, account-setup; the offset ring for map.

12. Empty states. They are one 12.5px sentence with a 12.5 x 12.5 px glyph at the top left (39 to 58 px high), and history shows the same sentence while a filter hides its rows; findings has no header and no glyph; code, changes and `none` lines use 10.5px with no glyph; VS Code's welcome view is centred with padding 0 20px 1em (css:372) and a list message is centred at 70% opacity (css:14). Holds for search, history, deposit, doc, customization, agents, transcript, timeline, findings, code, changes, project, memories.

13. Error states. Errors are red or muted text lines without a box (search draws a 12.5 px glyph before its line) (hpc has a Refresh now button in the body; source and search have no retry control); VS Code uses a notification item padded 10px 5px with a 22 px message line (css:403, css:406) and a Problems message (css:826). Holds for hpc (red monospace), source (muted sentence), search (muted 12.5px line, `error: unclosed group`).

14. Narrow overflow. In a 309 px pane, collection cards are 320 px wide and clip 11 px on the right (coauthor, archive, venues, code, statements, funding, events, education, tasks), a lead card is 486 px (leads), the Slides row box is 400 px (slides), the status table scrolls horizontally (status), the usage table is 609 px wide in a 285 px container and scrolls horizontally (usage), and Refresh now is cut at the edge (hpc). VS Code's side bar minimum width is 170 px (css:1100).

15. Links. Links are accent coloured and underlined; VS Code workbench links have no underline (css:365). Holds for venues, code, events, education, applications, radar, data, help, account-setup.

16. Intro boxes. A box with a 3px orange left rule, radius 6px and padding 8px 10px heads many views; `U2-vscode.css` holds no rule for such a box (css:372 to css:379 is the nearest, the welcome view). Holds for pillars, domains, venues, data, search, linkedin, slides, config.

17. Input widths. The same text input is 144 px in a header and fills the pane in a body (1375 to 1422 px at wide); its radius is 6px against 4px (css:276). Holds for data, session-list, account-setup, editor, note, deposit, search, history, changes.

18. Header height and type. The header is 30.3 or 38.3 px (11.5px, weight 700, uppercase, letter-spacing 0.46px); VS Code is 22 px, 11px, weight 700, uppercase (css:73, css:76, css:78). Holds for every view that draws a `Pane` header: all 56 except findings, which draws none.

19. Icon set (a question for Axel). Icons are Lucide, drawn at 1em of the text around them (the live rule `.glyph svg { width: 1em; height: 1em }`): 11.5 x 11.5 px in 11.5px text, the commonest size, 12.5 x 12.5 px beside 12.5px text and in empty states, 13.5 x 13.5 px in the pane chrome, and 10.5, 9.5 and 15 px in places, where VS Code's codicons are 16 x 16 px (css:241, css:252, css:133). `DESIGN.md` "Theming" decides Lucide, and the audit measures size, not the set. Question: keep Lucide and fix the icon size at 16 px (option 1), or replace the set with codicons through `icons.yml` (option 2). Option 1 keeps the decision and replaces the 1em rule with one size; option 2 matches VS Code glyph for glyph but re-maps every id and has no codicon for several domain icons. Recommendation: option 1. The lazy option is leaving the icons at the size of their text.

## Proposed grouping

This is a proposal; no build step exists before Axel's ruling.

1. Header frame (differences 1 and 18; every view with a `Pane` header). One step sets the header to 22 px, 11px, one line, the title cut with an ellipsis, and the actions on one line that does not wrap (an overflow menu for what does not fit). They belong together because the wrap exists because the header height and the tools are one component, `Pane.svelte` with `Toolbar.svelte`. Findings gets a header in the same step.
2. Control sizes (differences 3, 4, 5, 11 and 17; all views with controls). One step sets a text button of 26 px with radius 4px, an icon action of 20 px with a 16 px glyph and no border, an input of 26 px with radius 4px, and one focus ring of 1px offset -1px. They belong together because they are the same tokens (`--button-font`, `--input-radius`) used by every control.
3. Type and row scale (differences 8 and 9; every view). One step moves the base text to 13px, sets the row to 22 px and the tree indent to 8 px with a 16 px twistie, and removes the sizes off the scale (9.8px, 13.5px controls). They belong together because the row height follows the font.
4. Icons (difference 19; every view). One step sets icons to 16 px after Axel's ruling on the set.
5. Hover reveal (difference 6; collection views, radar, leads, inbox, linkedin, focus, session-list, account-setup). One step reveals row and card actions on hover or focus-within. They belong together because it is one rule in the card and row components.
6. Collections as lists (differences 7, 10 and 15; collection views, radar, leads, inbox, linkedin, usage, gallery, audit, config, project). One step replaces cards with 22 px rows and a count badge and drops the underline on links; it is the largest change and a decision for Axel, since cards carry the status rule that rows lose. Recommendation: rule on one collection view (projects) first and take the others from that ruling; the lazy option is keeping the cards and restyling only their buttons.
7. Empty, error and narrow states (differences 12, 13, 14 and 16; the views named there). One step makes the empty state centred with 20px padding, the error state a notification-shaped item with a retry, removes the clipping at 309 px and drops the intro boxes. They belong together because they are what a view shows when it has nothing, fails or is narrow.

Settings (S3c) and the X3d parts of changes are outside every group. The tab strip is X3c's.
