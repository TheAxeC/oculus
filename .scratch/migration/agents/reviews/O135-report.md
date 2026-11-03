# O135 report, an Add Front Matter command for a note

Everything in the brief is done. The look cases (C1 to C5 offer and menu, C9, C10, C12, C13) are proved at the look on landing; their code paths are below.

## Open items of the state file

Verbatim from `.scratch/migration/orchestrator-state.md:165-169`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## The cases' first run, on the unchanged tree

The case-run program, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o135build/cases.mts`, run as `node <that path> "$PWD"` from the worktree root. It only prints. On the unchanged tree it reads a header with `scanNote`'s own two lines (`withoutMark`, the CR and CRLF replace, `FRONT_MATTER`) and the brief's text `---\ntags: []\n---\n`; on the changed tree it calls `readFrontMatter` and `NOTE_HEAD`. Its source, with the one character outside ASCII (in the C11 line) written by its name:

```ts
// Case-run of O135: prints, for each case of the brief that a data function decides, what the
// tree's own functions give. It writes nothing. Run from the worktree root:
//   node <scratch>/o135build/cases.mts <worktree>
const tree = process.argv[2];
const fm = await import(`${tree}/src/lib/data/prose/markdown/front-matter.ts`);
const { withoutMark } = await import(`${tree}/src/lib/data/prose/text-edits.ts`);
const { scanNote } = await import(`${tree}/src/lib/data/prose/markdown/note-links.ts`);
const { inNotes, isNote } = await import(`${tree}/src/lib/data/prose/markdown/note-names.ts`);

const changed = typeof fm.readFrontMatter === 'function';
console.log(changed ? 'reading: readFrontMatter of front-matter.ts' : 'reading: scanNote inline');
// The reading on the unchanged tree is scanNote's own two lines (note-links.ts:48-49).
const header = (source: string): string | null => {
    if (changed) return fm.readFrontMatter(source).front?.[0] ?? null;
    return fm.FRONT_MATTER.exec(withoutMark(source).replace(/\r\n?/g, '\n'))?.[0] ?? null;
};
const head: string = changed ? fm.NOTE_HEAD : '---\ntags: []\n---\n';
console.log('inserted text', JSON.stringify(head));

// JSON with every character outside printable ASCII written as a \u escape.
const q = (value: unknown): string =>
    JSON.stringify(value).replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
const show = (name: string, source: string): void => {
    const found = header(source);
    const tags = scanNote(source).tags.map((one: { tag: string }) => one.tag);
    const offered = found === null ? 'offered' : 'not offered';
    console.log(`${name} ${q(source)} header ${q(found)} -> ${offered}; scanNote tags ${q(tags)}`);
};

show('C1', '# Title\n\nBody\n');
show('C1after', head + '# Title\n\nBody\n');
show('C2', '---\ntags: [a]\n---\n# Title\n');
show('C3', '---\ntags: [a]\n...\nBody\n');
show('C4', '---\t\ntags: []\n---\n');
show('C6', '');
show('C6after', head + '');
show('C7', '---\nBody below a rule\n');
show('C7after', head + '---\nBody below a rule\n');
show('C8', head + '# Title\n\nBody\n');
show('C9', '# T\r\nBody\r\n');
show('C9after', '---\r\ntags: []\r\n---\r\n# T\r\nBody\r\n');
show('C11', '<byte-order mark>---\ntags: [a]\n---\n');
show('C12after', head + 'one\ntwo\nthree\n');

for (const path of ['docs/plan.md', '.oculus/notes/plan.md', '.oculus/notes/plan.txt']) {
    const inside = inNotes(path);
    const note = inside !== null && inside !== '' && isNote(inside);
    console.log(`C5 ${path}: inNotes ${JSON.stringify(inside)} isNote ${note}`);
}
```

Its output on the unchanged tree, as printed (in the C11 line the program prints the six ASCII characters of a `\u` escape followed by `feff`, written here as `<backslash>ufeff` because this report's writer turns that escape into the mark itself):

```
reading: scanNote inline
inserted text "---\ntags: []\n---\n"
C1 "# Title\n\nBody\n" header null -> offered; scanNote tags []
C1after "---\ntags: []\n---\n# Title\n\nBody\n" header "---\ntags: []\n---\n" -> not offered; scanNote tags []
C2 "---\ntags: [a]\n---\n# Title\n" header "---\ntags: [a]\n---\n" -> not offered; scanNote tags ["a"]
C3 "---\ntags: [a]\n...\nBody\n" header "---\ntags: [a]\n...\n" -> not offered; scanNote tags ["a"]
C4 "---\t\ntags: []\n---\n" header "---\t\ntags: []\n---\n" -> not offered; scanNote tags []
C6 "" header null -> offered; scanNote tags []
C6after "---\ntags: []\n---\n" header "---\ntags: []\n---\n" -> not offered; scanNote tags []
C7 "---\nBody below a rule\n" header null -> offered; scanNote tags []
C7after "---\ntags: []\n---\n---\nBody below a rule\n" header "---\ntags: []\n---\n" -> not offered; scanNote tags []
C8 "---\ntags: []\n---\n# Title\n\nBody\n" header "---\ntags: []\n---\n" -> not offered; scanNote tags []
C9 "# T\r\nBody\r\n" header null -> offered; scanNote tags []
C9after "---\r\ntags: []\r\n---\r\n# T\r\nBody\r\n" header "---\ntags: []\n---\n" -> not offered; scanNote tags []
C11 "<backslash>ufeff---\ntags: [a]\n---\n" header "---\ntags: [a]\n---\n" -> not offered; scanNote tags ["a"]
C12after "---\ntags: []\n---\none\ntwo\nthree\n" header "---\ntags: []\n---\n" -> not offered; scanNote tags []
C5 docs/plan.md: inNotes null isNote false
C5 .oculus/notes/plan.md: inNotes "plan.md" isNote true
C5 .oculus/notes/plan.txt: inNotes "plan.txt" isNote false
```

The command does not exist on the unchanged tree: `grep -rn "Add Front Matter\|addFrontMatter" ../O135-base/src ../O135-base/config ../O135-base/docs ../O135-base/tests --exclude=local.yml` prints nothing (exit 1). So on the unchanged tree no case is offered anything in the palette or the tab menu.

- C1: the reading gives no header (output above), so the brief's rules offer it. The palette and the tab menu offer nothing on the unchanged tree (the grep). The edit, the caret and the Undo: no command at line 1 column 1 exists on the unchanged tree (`EditorCommand`, `../O135-base/src/lib/ui/controls/editor/types.ts:93-110`, holds `insert` at the selections and `replace` of the whole text only). The text after the run reads as a header (C1after).
- C2: header `---\ntags: [a]\n---\n`, so not offered by the brief's rules.
- C3: header `---\ntags: [a]\n...\n`, not offered.
- C4: header `---\t\ntags: []\n---\n`, not offered.
- C5: `docs/plan.md` gives `inNotes null`; `.oculus/notes/plan.txt` gives `isNote false`; `.oculus/notes/plan.md` is a note path, and in a root that is no hub the hub test `roots.some((one) => one.key === place.root && one.hub === true)` (`../O135-base/src/lib/state/life/note-hooks.ts:32`, read) is false. Not offered in all three by the brief's rules.
- C6: no header, offered; the text after the run reads as a header (C6after).
- C7: no header, offered; after the run the header is the first three lines and the rule stays below it (C7after).
- C8: the text after C1's run gives a header, so not offered.
- C9: no header, offered; the expected result text `---\r\ntags: []\r\n---\r\n# T\r\nBody\r\n` reads as a header (C9after). The line ending of the inserted text is Monaco's (the look).
- C10: by reading, a tab at a commit has `head !== undefined`, so `lockedWords` gives words (`../O135-base/src/lib/views/sources/source/save/locked-words.ts:26-30`) and `editing = read && lock.words === ''` (`status/tab-shown.ts:62`) is false. Not offered by the brief's rules.
- C11: header `---\ntags: [a]\n---\n` with the mark taken off, so not offered.
- C12: the reading of the result text gives a header (C12after); the selection is the look.
- C13: by reading, a tab publishes while its view is mounted (`status/source-status.svelte.ts:37-44`), and the unchanged tab menu reads no published status (`../O135-base/src/lib/shell/panes/strip/tab-menu-state.svelte.ts:73-125`).
- C14: `sed -n '394,411p' ../O135-base/docs/HELP.md | grep -c "Add Front Matter"` prints 0: the notes section has no sentence on the command.

No case of the first run gives a result the brief's rules get wrong.

## DONE / NOT DONE

| Item | State | Proof (last run) |
| --- | --- | --- |
| 1. `readFrontMatter` in front-matter.ts, `scanNote` calls it | DONE | `src/lib/data/prose/markdown/front-matter.ts:51-54`, `note-links.ts:276`; case-run after the change prints 19 lines (`wc -l`): `reading: readFrontMatter of front-matter.ts` and the same 18 lines, lines 2 to 19, as the first run (`diff` of lines 2 on, exit 0) |
| 2. `NOTE_HEAD = '---\ntags: []\n---\n'` with its doc comment | DONE | `front-matter.ts:33-38`; case-run prints `inserted text "---\ntags: []\n---\n"` |
| 3. `isNoteFile` exported, head comment | DONE | `note-hooks.ts:29`, head comment :8-9 |
| 4. The action in `tabActions`, the `$derived` boolean, the id beside `SAVE_ACTION`, the label, head comments, `SaveKeyHost.svelte` | DONE | `status/front-matter-offer.svelte.ts:41-46` (created at `Source.svelte:311-317`), the getter `Source.svelte:345-347`; `ask-perform.ts:97-103`; `editor-status.svelte.ts:109-114`; `source.yml:89`; svelte-check in the verify list: `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 5. `prepend` command, one `executeEdits` with `forceMoveMarkers: true` between two `pushUndoStop`, then `made.focus()` | DONE | `commands.ts:146-158`, `types.ts:111`; behaviour at the look |
| 6. Tab menu item `Add Front Matter` in its own group after the compare items, pick asks `{ kind: 'action', id }` | DONE | `tab-menu.ts:165`, `:311`; `tab-menu-state.svelte.ts:118-119`, `:232-237`; `ui.yml:103` |
| 7. HELP sentence after line 406 | DONE | `docs/HELP.md:407` |
| 8. Source.svelte at or under 520, code moved into a partial under `status/` | DONE | `wc -l src/lib/views/sources/source/Source.svelte` prints `518 src/lib/views/sources/source/Source.svelte`; partials `status/editor-actions.ts` and `status/front-matter-offer.svelte.ts` |
| Verify 1: scoped tests | DONE | `npx vitest run tests/data/prose/markdown/front-matter.test.ts tests/shell/panes/strip/tab-menu.test.ts tests/views/sources/source/save-key.client.test.ts tests/ui/controls/editor/reach-text.test.ts tests/checks/tree/boundaries.test.ts tests/shell/window/menu-answer.test.ts tests/views/sources/bar-actions.test.ts --reporter=dot` (the last two found by `grep -rlE` of each changed module under `tests`): `Tests  174 passed (174)` |
| Verify 2: `npm run diagrams`, then `npm run test:quick` | DONE | `test:quick: 62.7 s; every command passed`, over 28 changed files (the run of "Repair round 1") |
| Verify 3: ASCII gate over the changed files | DONE | over all 25 changed paths, after repair round 1: the rules file's perl form over the 18 under `src`, `tests` and `config` prints nothing, `ASCII gate exit 0`; `LC_ALL=C grep -n '[^ -~]'` over the 7 under `docs` prints nothing, `docs grep exit 1` (the commands are under "Repair round 1") |
| Verify 4: unused exports | DONE | `diff ../O135-base/unused-exports.txt <after>` prints nothing, `diff exit 0` |
| Verify 5: size and folders | DONE | `518 src/lib/views/sources/source/Source.svelte`; `sh utils/folder-check.sh` prints nothing, `folder-check exit 0` |
| Verify 6: changed test run on the unchanged tree and after | DONE | see "Tests" below |
| Verify 7: list items and sentence length | DONE | see "Prose" below |

The verify list's result lines of the first run, from its second run; the final run is under "Repair round 1":

```
test:quick: 23 changed file(s), from git since HEAD
test:quick: 29 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (11.3 s)
ok      svelte-check (11.4 s): 1793733066390 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (39.9 s): Duration  25.62s (transform 12.19s, setup 0ms, import 16.04s, tests 9.42s, environment 0ms)
ok      vitest (41.5 s): Duration  27.50s (transform 55.47s, setup 0ms, import 99.88s, tests 3.04s, environment 1.63s)
ok      vitest checks (55.6 s): Duration  41.51s (transform 19.12s, setup 0ms, import 36.54s, tests 90.16s, environment 3ms)
test:quick: 57.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The full list ran twice. The first run was red on `tests/checks/tree/duplication.test.ts > a rule written twice > is not held anywhere under src/lib`: `src/lib/views/sources/source/status/ask-perform.ts:48 and src/lib/views/sources/source/status/tab-asks.svelte.ts:76 hold the same 9 lines (3ae7a2f267a8)`, the callbacks of `TabActionDeps` and `SourceDoes` once both gained `addFrontMatter`. They are now one type, `TabActionCalls` (`ask-perform.ts:31-41`), which `TabActionDeps` and `SourceDoes` extend. `npx vitest run tests/checks/tree/duplication.test.ts tests/views/sources/source/save-key.client.test.ts --reporter=dot` then printed `Tests  19 passed (19)`, and the list ran once more, green. No whole-suite command was run.

The ASCII gate over every changed path, with its file list and exit status, is under "Repair round 1", item 7.

## Tests

The step adds no test and changes one test fixture, `tests/views/sources/source/SaveKeyHost.svelte` (G107's fixture): it gains `frontMatter: false` and `addFrontMatter: nothing`, the two fields `SourceFacts` and `SourceDoes` gained, so it type-checks. It tests a behaviour the change preserves (Cmd+S saves the draft), so it has no failing line on the unchanged tree. A run on a copy of the base copy alone runs the base's own fixture; the run of the changed fixture over the base code is under "Repair round 1", item 8. After the change it is in the scoped run (`Tests  174 passed (174)`) and the verify list, both green. It is an audit of the new fields: the test never reads them. `tests/shell/panes/strip/tab-menu.test.ts` is unchanged, since no row went red (its tabs publish no status, so the menu offers no item). No assertion, allow list or predicate was edited: `git diff tests/checks/tree/layer-rows.ts` changes comment lines 233-238 only, not `ALLOWED`.

## The cases after the change

The case-run's output after the last change (`node .../cases.mts "$PWD"`, exit 0): first line `reading: readFrontMatter of front-matter.ts`; `diff <(tail -n +2 first-run.txt) <(tail -n +2 after-run.txt)` prints nothing (exit 0); each output is 19 lines (`wc -l`), so lines 2 to 19, 18 lines, are those quoted under the first run. C2, C3, C4, C8 and C11 read a header; C1, C6, C7 and C9 read none; C1after, C6after, C7after, C9after and C12after read `---\ntags: []\n---\n`.

The look cases, with the code path that gives each result:

- C1 offered: `status/front-matter-offer.svelte.ts:41-46` derives `offered = editing && asked === null && isNoteFile(roots, root/path) && readFrontMatter(text).front === null`, created at `Source.svelte:311-317`; the `facts` getter `Source.svelte:345-347` returns it; `tab-asks.svelte.ts:109` passes it to `tabActions`, which pushes `{ id: FRONT_MATTER_ACTION, label: t('source.cmd_front_matter') }` (`ask-perform.ts:97-103`) after Open Preview to the Side; `listed` publishes it (`tab-asks.svelte.ts:148`). The palette runs it through `editor.ask(instance, { kind: 'action', id: action })` (`shell/keys/palette-open.ts:74`), and `performAsk` runs `own.run()` (`ask-perform.ts:138-140`). The tab menu reads `statusOf(found.id)?.actions` (`tab-menu-state.svelte.ts:118-119`), `tabMenu` adds the group (`tab-menu.ts:165`), and a pick shows a hidden tab and asks the tab (`tab-menu-state.svelte.ts:232-237`). Running: `does.addFrontMatter` (`Source.svelte:403`, the partial's `add` at `front-matter-offer.svelte.ts:53-56`) performs `{ kind: 'prepend', text: NOTE_HEAD }`, which `commands.ts:146-158` makes one edit at 1,1 with `forceMoveMarkers: true` between `pushUndoStop` calls, then `made.focus()`. The caret at 1,1 is a marker at the insertion point, which force-move puts after the inserted text, on line 4 column 1. One Undo takes back the one edit between the two undo stops.
- C2, C3, C4, C8, C11: `readFrontMatter(draft.text).front` is not null (case-run), so `frontMatter` is false and `tabActions` pushes nothing; the published actions lack the id, so the tab menu's `frontMatter` is false and `tabMenu` adds `[]`.
- C5: `isNoteFile` (`note-hooks.ts:29-35`): `docs/plan.md` gives `inNotes` null; a non-hub root fails `one.hub === true` (:33); a `.txt` file fails `isNote` (:34).
- C6, C7: `front` is null (case-run), so offered; the edit is the C1 path at 1,1.
- C9: the C1 path; Monaco writes the inserted LF text in the model's CRLF ending (`pieceTreeTextBuffer.js:194-200`, per the brief), and the save writes the draft's text.
- C10: `editing` false (`status/tab-shown.ts:62`, `save/locked-words.ts:26-30`) ends the `&&` at `front-matter-offer.svelte.ts:42`.
- C12: the C1 path; force-move moves the selection's start at 1,1 past the inserted text and the end moves with its line, so the selection covers the old text.
- C13: a once-shown hidden tab keeps its view mounted and publishes (`status/source-status.svelte.ts:37-44`), so `statusOf` holds the action; a tab not shown since load has no status, `statusOf` gives null and `status?.actions.some(...) === true` is false (`tab-menu-state.svelte.ts:119`).
- C14: `docs/HELP.md:407` reads: "On a note you can edit that has no front matter, Markdown: Add Front Matter in the palette, on the tab in view, and Add Front Matter in the tab's menu, once the tab has been shown since the page loaded, write `---`, `tags: []` and `---` at its top as one edit that one Undo takes back; a note with front matter and a file that is no note are not offered it."

## Files

From `diff -rq ../O135-base/<folder> <folder>` over src, tests, utils, config and docs, with `git diff --numstat` (added, removed) and `wc -l` after:

| Path | Added / removed | Lines | On the write list |
| --- | --- | --- | --- |
| `src/lib/data/prose/markdown/front-matter.ts` | 25 / 3 | 54 | yes |
| `src/lib/data/prose/markdown/note-links.ts` | 2 / 4 | 453 | yes |
| `src/lib/state/life/note-hooks.ts` | 3 / 2 | 101 | yes |
| `src/lib/state/workbench/navigation/editor-status.svelte.ts` | 17 / 6 | 324 | yes |
| `src/lib/views/sources/source/Source.svelte` | 19 / 21 | 518 | yes |
| `src/lib/views/sources/source/status/ask-perform.ts` | 32 / 14 | 160 | yes |
| `src/lib/views/sources/source/status/tab-asks.svelte.ts` | 15 / 16 | 176 | yes |
| `src/lib/views/sources/source/status/editor-actions.ts` | new | 31 | yes, the partial of item 8 |
| `src/lib/ui/controls/editor/types.ts` | 3 / 0 | 165 | yes |
| `src/lib/ui/controls/editor/commands.ts` | 17 / 4 | 298 | yes |
| `src/lib/shell/panes/strip/tab-menu.ts` | 21 / 7 | 320 | yes |
| `src/lib/shell/panes/strip/tab-menu-state.svelte.ts` | 21 / 1 | 254 | yes |
| `tests/views/sources/source/SaveKeyHost.svelte` | 2 / 0 | 90 | yes |
| `tests/checks/tree/layer-rows.ts` | 4 / 2, lines 233-238 | 368 | yes (lines 228-236 at the base) |
| `config/text/views/sources/source.yml` | 1 / 0 | | yes |
| `config/text/ui.yml` | 1 / 0 | | yes |
| `docs/HELP.md` | 1 / 0, line 407 | | yes (lines 394-411) |
| `docs/diagrams/layer-shell.dot`, `.svg`, `layer-views.dot`, `.svg`, `layers.dot`, `.svg` | 1+1+2+2+3+3 / same | | yes, by `npm run diagrams` (edge counts only) |

## Judgment calls the brief left open

- The partial of item 8 is `src/lib/views/sources/source/status/editor-actions.ts`, `tabEditorActions(client, instance, own, file, language)`: the composition of the actions the tab hands its editor (its own, the quick diff's, the apps' `editor/context` entries), which was 16 lines inline at `Source.svelte:400-415` with the `appShell` destructure. Source.svelte derives `own` from it in one line (`Source.svelte:413`), which reads the same reactive values as before. Named `tabEditorActions` because `editorActions` is taken by `state/shared/words/appearance.ts:608`.
- `readFrontMatter(source)` returns `{ text, front }`, since `scanNote` needs the read text for its positions as well as the match.
- `TabActionCalls` (`ask-perform.ts:31-41`): one type for the callbacks `TabActionDeps` and `SourceDoes` share.
- The `EditorCommand` kind is `prepend`; the editor edit source string is `'oculus-prepend'`.
- The action id is `oculus.addFrontMatter`; the tab menu item id is `front-matter` (not exported); the catalog keys are `source.cmd_front_matter` and `ui.tab_front_matter`, each placed in key order.
- `TabFacts.frontMatter` is optional, like `pdf`, `windows` and `copyable`, so the menu tests and callers that do not set it get no item.
- `EditorStatus.actions`'s doc comment said "none for a tab drawing no editor", which `tab-asks.svelte.ts:124-130` contradicts (the tab's own actions are listed whether or not it draws an editor); it now says what the list holds, as the step touched that comment.

Keys and asynchronous paths: `grep -rn "oculus.addFrontMatter\|'front-matter'\|tab_front_matter\|cmd_front_matter" src config` finds one definition each and no configured key or keybinding naming them. A pick or a palette run that lands after the note gained a header finds no own action in `performAsk` and falls to the editor's `action` command, whose Monaco action the editor disposed when the list changed (`ui/controls/editor/Editor.svelte:287-324`), so it inserts nothing. The edit reaches the draft in the same task (`Editor.svelte:368-371` calls `onchange` from `onDidChangeContent`), so `frontMatter` reads the new text on its next read. A run asked while the tab's editor is still being made: `Editor.svelte:467-471` queues the `prepend` until the editor has loaded, and the text does not change until then. Before repair round 1 the action stayed offered in that time, so a second run queued a second `prepend` and the note got two heads (`---\ntags: []\n---\n---\ntags: []\n---\n# Title...`). After it, `add` sets `asked` to the text it was asked on (`front-matter-offer.svelte.ts:54`), `offered` is false while `asked` is set (`:43`), and the effect at `:38-40` clears `asked` once the text differs from it; so the second run finds no Add Front Matter in `performAsk`, falls to the editor's `action` command for an id the editor holds no action for, and the note gets one head.

## What a user sees, before and after

- The palette on a note tab without front matter: before, no Add Front Matter entry; after, `Markdown: Add Front Matter` listed after `Markdown: Open Preview to the Side` in the tab's action order (typed text ranks the palette by its own fuzzy match). Running it writes the head at the top, the caret and the selection stay on the text they were on, and the editor takes the keyboard.
- The tab menu of that tab (once shown since the page loaded): after, a group holding `Add Front Matter` between the compare items and Keep Open / Pin.
- A pick of Add Front Matter on the menu of a note tab hidden behind another tab of its pane: before repair round 1, the head was written into the hidden tab's text, nothing on screen changed, and the keyboard stayed where it was. After it, the note tab is shown, by `layout.activateInstance(tab, page)`, the call a press on the tab in the strip makes (`PaneView.svelte:449`), the head is written at its top, and its editor takes the keyboard. A pick on the tab already in view does as before: no activation, the head written, the editor takes the keyboard.
- On a note with front matter, a note at a commit, a read-only note, a Markdown file outside `.oculus/notes/`, a notes folder of a root that is no hub, and a `.txt` file: no palette entry and no menu item, before and after.
- The look: open a note of a hub without front matter, open the palette and type "front matter"; right-click its tab; run each, check the three lines at the top, press Undo once; repeat on a CRLF note and read its bytes after the save; Select All on a three-line note then run; reload, right-click a note tab not yet shown (no item) and one shown then hidden (item).

## Head comments and documents re-read

Rewritten: front-matter.ts head (:22-26); note-hooks.ts head (:8-9); editor-status.svelte.ts head paragraph (:14-19) and `EditorStatus.actions`; ask-perform.ts head (:7-13); tab-asks.svelte.ts head (:1-7 and :9-13) and `SourceDoes`; Source.svelte head palette list (:40-43); `EditorCommand` doc in types.ts; commands.ts head (:1-8); tab-menu.ts head (:1-8) and `tabMenu`'s doc; tab-menu-state.svelte.ts head (:1-9); layer-rows.ts :228-238. Still true: note-links.ts head and `scanNote`'s doc; `isNoteFile`'s and `noteWait`'s docs; `tabActions`, `performAsk` and `createTabAsks` docs; `runCommand`'s doc; `tabPicked`, `TabPickDeps`, `read` and `pick` docs; app-actions.ts head; Source.svelte's other head paragraphs; `docs/HELP.md:406`; `docs/templates.md:885-893`; the front-matter.ts mentions at `views/shared/prose/RenderedMarkdown.svelte:17`, `data/sources/documents/docs.ts:55` and `data/sources/deck/split.ts:7`.

The grep of the names the step adds or changes, `grep -rn "readFrontMatter\|NOTE_HEAD\|editorActions\b\|FRONT_MATTER_ACTION\|'prepend'\|addFrontMatter\|isNoteFile\|quickDiffActions\|appEditorActions\|tab_front_matter\|cmd_front_matter" src tests config docs README.md --exclude=local.yml`, finds them only in the changed files above, the two `app-actions.ts` definitions, and `appearance.ts`'s and `PaneView.svelte`'s unrelated `editorActions` (taken before the rename to `tabEditorActions`; `grep -rn "tabEditorActions" src tests` was empty before it was written). At the base, `grep -rn "readFrontMatter\|NOTE_HEAD\|editorActions\b\|FRONT_MATTER_ACTION\|'prepend'\|addFrontMatter" ../O135-base/src ../O135-base/tests` found only that `editorActions`, so nothing existing was reused or duplicated.

History words: `{ git diff -U0 -- src tests; diff -U0 /dev/null src/lib/views/sources/source/status/editor-actions.ts; } | grep '^+' | grep -v '^+++' | grep -E '^\+\s*(//|\*|/\*\*)' | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"` prints nothing (exit 1).

`sh utils/unused-exports.sh` adds no line: the new exports (`readFrontMatter`, `NOTE_HEAD`, `isNoteFile`, `FRONT_MATTER_ACTION`, `TabActionCalls`, `tabEditorActions`) each have an importer outside their file.

## Prose

- `docs/HELP.md:407` is one bullet of one sentence, 75 words (`sed -n '407p' docs/HELP.md | wc -w`), long beside the section's other bullets, because item 7 asks for one sentence and round 1 item 1 asks to add to that sentence: it names the two places, when each offers the command, the three lines, the single Undo and the two kinds of file not offered it.
- The new doc comments and comment paragraphs are full sentences, rewrapped at 100 columns (the comment-width check in the verify list passed).

## Limitations and sharp edges

- On a note tab, `frontMatter` reads the whole text through `readFrontMatter` (a copy for the CR replace and one pattern run) at every change of `draft.text`, that is per keystroke; on a tab that is no note, `isNoteFile` ends the `&&` first and the text is not read. Not measured.
- A pick from the tab menu on a hidden tab shows the tab first (repair round 1, item 2). Whether the keyboard stays in the editor once the menu closes, or the menu hands it back to the strip, is seen only at the look.
- One scoped run of the seven verify-1 files, before the last change, printed `1 failed | 173 passed (174)` without the failing file in the captured tail; the same command then printed `174 passed (174)` three times, the last after the last change, and the verify list passed.
- The case-run program in the scratch folder had one edit made with an inline `python3` program (the `q` escaping of its output); it changed only `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o135build/cases.mts`, no file of the step.

## Wrong or impossible in the brief

Nothing. Small line drifts: the brief places `made.focus()` of `insert` at `commands.ts:128` and `forceMoveMarkers: true` at :140; on the base they are at :128 and :141.

## Programs

Every command, in the first run and in repair round 1, that wrote or changed a file other than through the Edit and Write tools, as run, with the file it wrote. `<S>` stands for `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o135build`; every command ran from the worktree root unless it names another folder.

First run:

- `node <S>/cases.mts "$PWD" 2>&1 | tee <S>/first-run.txt`: wrote `<S>/first-run.txt`.
- An inline `python3 - <<'EOF' ... EOF` program run in `<S>` that read `cases.mts`, put in the `q` function (JSON with every character outside printable ASCII written as a `\u` escape) and used it in the `console.log` of `show`, and wrote `cases.mts` back: changed `<S>/cases.mts`. In the same command, `node <S>/cases.mts "$PWD" > <S>/first-run.txt 2>&1`: wrote `<S>/first-run.txt` again (the output quoted under the first run).
- `mkdir -p <S>/basetree && cp -R ../O135-base/src ../O135-base/tests ../O135-base/utils ../O135-base/config ../O135-base/docs <S>/basetree/ && cp package.json tsconfig.json vite.config.ts .npmrc <S>/basetree/ && ln -s <worktree>/node_modules <S>/basetree/node_modules`: wrote the scratch copy `<S>/basetree`. Then, in `<S>/basetree`, `rm node_modules && cp -c -R <worktree>/node_modules ./node_modules`: wrote its node_modules. The vitest runs in it wrote its `.svelte-kit`. `rm -rf <S>/basetree` removed it.
- `npx prettier --write <the 16 changed files>`: wrote nothing, each printed `(unchanged)`.
- `npx svelte-kit sync`: wrote the worktree's `.svelte-kit` (ignored by git).
- `npx vitest run <the 7 verify-1 files> --reporter=dot > <S>/scoped2.txt 2>&1` and the same with `> <S>/scoped3.txt 2>&1`: wrote `<S>/scoped2.txt` and `<S>/scoped3.txt`.
- `node <S>/cases.mts "$PWD" > <S>/after-run.txt 2>&1`, run twice: wrote `<S>/after-run.txt`.
- `sh utils/unused-exports.sh > <S>/unused-after.txt 2>&1`, run twice: wrote `<S>/unused-after.txt`.
- `npm run diagrams`, run twice: wrote the six `docs/diagrams/layer-shell.*`, `layer-views.*` and `layers.*` files.
- `npm run test:quick > <S>/quick1.txt 2>&1` and `npm run test:quick > <S>/quick2.txt 2>&1`: wrote `<S>/quick1.txt` and `<S>/quick2.txt`.

Repair round 1:

- `mkdir -p <S>/base-with-fixture && cp -R ../O135-base/src ../O135-base/tests ../O135-base/utils ../O135-base/config ../O135-base/docs <S>/base-with-fixture/ && cp package.json tsconfig.json vite.config.ts .npmrc <S>/base-with-fixture/ && cp tests/views/sources/source/SaveKeyHost.svelte tests/views/sources/source/save-key.client.test.ts <S>/base-with-fixture/tests/views/sources/source/ && cp -c -R node_modules <S>/base-with-fixture/node_modules`: wrote the scratch copy of item 8; its vitest run wrote its `.svelte-kit`; `rm -rf <S>/base-with-fixture` removed it.
- `npm run diagrams`, run twice: wrote the same six diagram files.
- `npm run test:quick`, run twice, output read from the terminal: its `svelte-kit sync` wrote the worktree's `.svelte-kit`.

No program was written in the round; every check of the round printed to the terminal.

## Repair round 1

Every item of `.scratch/migration/agents/briefs/O135-round-1.md` is done.

1. `docs/HELP.md:407` now says the palette offers the command on the tab in view and the tab's menu once the tab has been shown since the page loaded: "On a note you can edit that has no front matter, Markdown: Add Front Matter in the palette, on the tab in view, and Add Front Matter in the tab's menu, once the tab has been shown since the page loaded, write `---`, `tags: []` and `---` at its top as one edit that one Undo takes back; a note with front matter and a file that is no note are not offered it." (75 words, `sed -n '407p' docs/HELP.md | wc -w`; see "Prose".)
2. `TabMenuDeps` gains `shown?: () => string`, the tab the pane shows (`tab-menu-state.svelte.ts:47-51`), which `PaneView.svelte:370` gives as `shown: () => active`, the tab PaneView draws (`PaneView.svelte:168-170`). The pick (`tab-menu-state.svelte.ts:232-237`) calls `layout.activateInstance(tab, deps.page())` when the tab is not the one shown, the call the strip's press makes (`PaneView.svelte:449`, `onselect={(id: string) => activateInstance(id, page)}`), then asks the action; on the tab in view it asks only. The field is optional because `tests/shell/panes/strip/tab-menu.test.ts` builds `createTabMenu` without it and the round changes no test; with no `shown`, the pick asks without showing. The head comment of tab-menu-state.svelte.ts and the doc of `TabPickDeps.addFrontMatter` in tab-menu.ts say so. The file the round widens to is `src/lib/shell/panes/PaneView.svelte` (one line). The before and after are under "What a user sees, before and after".
3. The flag and the offer are in a partial, `src/lib/views/sources/source/status/front-matter-offer.svelte.ts` (`createFrontMatterOffer`), which `Source.svelte:311-317` creates. The fact and the run moved there because, held in Source.svelte with the flag, its effect and the run, the component would pass 520 lines (it was 517); the rules file's size rule asks for a split by concern, so this is a path outside the write list, named here with that reason. `asked` (`:37`) holds the text a run was asked on; `add` sets it (`:54`) and performs the `prepend`; `offered` is false while it is set (`:41-46`, order `editing`, `asked === null`, `isNoteFile`, the header reading); the effect at `:38-40` sets it back to null once the text differs from it. So an Undo that gives the old text back after the head was written finds `asked` already null, and the command is offered again. The facts getter returns `frontMatter.offered` (`Source.svelte:345-347`) and `does.addFrontMatter` is `frontMatter.add` (`:403`). The path with its before and after is in "Keys and asynchronous paths". `Source.svelte` is 518 lines (`wc -l`).
4. `EditorStatus.actions` (`editor-status.svelte.ts:58-62`): "The actions the tab offers the palette: for a source tab, its own that apply, then its editor's while the editor is drawn; for a diff pane, its diff editor's (views/sources/repositories/diff/Diff.svelte). The tab menu reads Add Front Matter from them."
5. The section "Programs" above.
6. DONE row 1 and "The cases after the change" now say 19 lines, lines 2 to 19. `node <S>/cases.mts "$PWD" | wc -l` prints `19`; `node <S>/cases.mts "$PWD" | diff - <S>/after-run.txt; echo "case-run vs after-run exit $?"` prints `case-run vs after-run exit 0`; `wc -l <S>/first-run.txt <S>/after-run.txt` prints 19 for each.
7. The ASCII gate over every path the step changes, 25 by `diff -rq ../O135-base/<folder> <folder>` over src, tests, utils, config and docs:

```
$ LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/prose/markdown/front-matter.ts src/lib/data/prose/markdown/note-links.ts src/lib/shell/panes/PaneView.svelte src/lib/shell/panes/strip/tab-menu-state.svelte.ts src/lib/shell/panes/strip/tab-menu.ts src/lib/state/life/note-hooks.ts src/lib/state/workbench/navigation/editor-status.svelte.ts src/lib/ui/controls/editor/commands.ts src/lib/ui/controls/editor/types.ts src/lib/views/sources/source/Source.svelte src/lib/views/sources/source/status/ask-perform.ts src/lib/views/sources/source/status/editor-actions.ts src/lib/views/sources/source/status/front-matter-offer.svelte.ts src/lib/views/sources/source/status/tab-asks.svelte.ts tests/checks/tree/layer-rows.ts tests/views/sources/source/SaveKeyHost.svelte config/text/ui.yml config/text/views/sources/source.yml; echo "ASCII gate exit $?"
ASCII gate exit 0
$ LC_ALL=C grep -n '[^ -~]' docs/HELP.md docs/diagrams/layer-shell.dot docs/diagrams/layer-shell.svg docs/diagrams/layer-views.dot docs/diagrams/layer-views.svg docs/diagrams/layers.dot docs/diagrams/layers.svg; echo "docs grep exit $?"
docs grep exit 1
```

Both print no line; grep's exit 1 is "no match".

8. The changed fixture over the base code, on a copy of `../O135-base` in the scratch folder with the two test files copied in (the `mkdir`/`cp` command under "Programs"):

```
$ diff ../O135-base/tests/views/sources/source/save-key.client.test.ts tests/views/sources/source/save-key.client.test.ts; echo "test file vs base exit $?"
test file vs base exit 0
$ diff ../O135-base/tests/views/sources/source/SaveKeyHost.svelte tests/views/sources/source/SaveKeyHost.svelte
51a52
>             frontMatter: false,
79a81
>             addFrontMatter: nothing,
$ diff -rq ../O135-base/src src; echo "src vs base exit $?"
src vs base exit 0
$ npx vitest run tests/views/sources/source/save-key.client.test.ts
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

(all run in the copy). What the run shows: over the base's code, which has no `frontMatter` in `SourceFacts` and no `addFrontMatter` in `SourceDoes`, the changed fixture gives the same pass, so the two fields change nothing at run time; they are there for the type check, and the test is an audit of them.

Checks after the last change, from the worktree root:

```
$ npx vitest run tests/data/prose/markdown/front-matter.test.ts tests/shell/panes/strip/tab-menu.test.ts tests/views/sources/source/save-key.client.test.ts tests/ui/controls/editor/reach-text.test.ts tests/checks/tree/boundaries.test.ts tests/shell/window/menu-answer.test.ts tests/views/sources/bar-actions.test.ts --reporter=dot
      Tests  174 passed (174)
$ grep -rlE "panes/PaneView(\.svelte)?['\"]|front-matter-offer" tests; echo "grep exit $?"
grep exit 1
$ npm run diagrams   (the same six diagram files differ from the base; git status --short docs/diagrams lists them)
$ npm run test:quick
test:quick: 28 changed file(s), from git since HEAD
test:quick: 29 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (11.2 s)
ok      svelte-check (11.3 s): 1793734958697 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (40.5 s): Duration  26.46s (transform 13.56s, setup 0ms, import 17.56s, tests 8.74s, environment 0ms)
ok      vitest (41.2 s): Duration  27.44s (transform 53.19s, setup 0ms, import 99.52s, tests 3.21s, environment 1.67s)
ok      vitest checks (60.2 s): Duration  46.27s (transform 17.03s, setup 0ms, import 33.76s, tests 98.16s, environment 3ms)
test:quick: 62.7 s; every command passed
$ diff ../O135-base/unused-exports.txt <(sh utils/unused-exports.sh); echo "unused diff exit $?"
unused diff exit 0
$ wc -l src/lib/views/sources/source/Source.svelte src/lib/shell/panes/PaneView.svelte
     518 src/lib/views/sources/source/Source.svelte
     514 src/lib/shell/panes/PaneView.svelte
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0
```

The full list ran twice in the round. The first run was red in `eslint` on `src/lib/views/sources/source/status/front-matter-offer.svelte.ts`, a file the step changes (`37:9 error void operator is useless here` and `42:13 error Unnecessary conditional, value is always truthy`). The effect now compares the text with `asked`, and `asked` is typed by `$state<string | null>(null)`; `npx eslint src/lib/views/sources/source/status/front-matter-offer.svelte.ts; echo "eslint exit $?"` printed `eslint exit 0`, and the list then ran once more, green (above). No red line fell in a file the step does not change. No test is added or changed.

The history-words grep over the added comment lines, `front-matter-offer.svelte.ts` included, prints one hit: `+// offered. The editor queues a command asked before it has loaded (ui/controls/editor/Editor.svelte`. It describes the order of two events at run time, not an earlier state of the code, so it stays.

`unused-exports` (knip over exports and types) adds no line. `createFrontMatterOffer` is imported by Source.svelte; `FrontMatterOfferDeps` is exported as the tree's other partials export their deps types (`LibraryTabInput`, `TabMenuDeps`), and knip does not report it.

Head comments and docs re-read for the round: rewritten are tab-menu-state.svelte.ts's head (:1-10), `TabMenuDeps.shown`, `TabPickDeps.addFrontMatter` in tab-menu.ts, `EditorStatus.actions`, and the new partial's head; still true are note-hooks.ts's head (the source tab asks `isNoteFile`, through the partial), front-matter.ts's head and `tests/checks/tree/layer-rows.ts:228-238` (the source tab reads the module and writes its head, through the partial), PaneView.svelte's head (:43-46), tab-asks.svelte.ts's head, and Source.svelte's head.

Files the round changes, with `git diff --numstat` against the base for the whole step and `wc -l` after:

| Path | Added / removed (whole step) | Lines |
| --- | --- | --- |
| `docs/HELP.md` | 1 / 0, line 407 | |
| `src/lib/shell/panes/PaneView.svelte` | 1 / 0 | 514 |
| `src/lib/shell/panes/strip/tab-menu-state.svelte.ts` | 21 / 1 | 254 |
| `src/lib/shell/panes/strip/tab-menu.ts` | 21 / 7 | 320 |
| `src/lib/state/workbench/navigation/editor-status.svelte.ts` | 17 / 6 | 324 |
| `src/lib/views/sources/source/Source.svelte` | 19 / 21 | 518 |
| `src/lib/views/sources/source/status/front-matter-offer.svelte.ts` | new | 58 |
| `docs/diagrams/*` (six files) | regenerated, unchanged from the first run's counts | |

Every other file's figures are those of the "Files" table above. `status/` holds 10 items, the folder limit.
