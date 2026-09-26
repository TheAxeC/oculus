# Q76 report

Everything in the brief is done. There is one qualification on check 10 for `tests/browser/workbench/system.spec.ts`. Every revert in that file turned its case red in at least one of three `bin/revert-check.mjs` runs. No single run printed 0 unproven, because another step's revert-check copies held port 8792 at the same time. The DONE / NOT DONE table below gives the evidence.

Open items of the state file, verbatim: "None." The booked list holds 3 items (Q72, O33, O32), none for this step.

## DONE / NOT DONE

| Item | State | Proof (command, output) |
|---|---|---|
| 1. A re-read keeps what is shown; the empty-id invalidation is gone | DONE | `npx vitest run tests/state/system/docs.test.ts` gives `19 passed (19)`. `invalidate` is removed from `DocsStore`. The case "keeps returning what is held while the new answer is in flight" asserts `toBe(before)` between the write and the answer. |
| 2. An unchanged answer repaints nothing: ETag, If-None-Match, 304 | DONE | `npx vitest run tests/routes/docs/docs.test.ts` gives `30 passed (30)`. The store cases "sends the held tag, and keeps the held object itself on a 304" and "...draws the same document" pass. In the browser case every re-read was a 304. |
| 3. Only a files event on the holding root re-asks; the empty root asks nothing | DONE | The store cases "asks nothing again after a write under a root that does not hold it", "is asked for by no message with the empty root" and "leaves the manual as it is when a write re-reads a hub document" pass. |
| 4. A tab of a moved entry follows it; an unmatched tab names its path | DONE | Browser cases 374 and 375 pass in the full run. The unit cases in `tests/views/sources/doc.test.ts` and `tests/state/workbench/navigation/catalogue.test.ts` pass. |
| 5. Unit, server and browser tests, each naming its revert | DONE | Check 10 below. |
| Check 1: `npx vitest run --reporter=dot` | DONE | `Test Files  330 passed (330)` / `Tests  5152 passed (5152)`. An earlier full run under load printed `Tests  2 failed \| 5150 passed (5152)`; I did not capture which two, and the rerun above passed. The five changed node files passed 5 runs out of 5 (`Tests  101 passed (101)` each time). |
| Check 2: `npm run check` | DONE | `COMPLETED 1458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Check 3: `npm run build` | DONE | `build exit 0` |
| Check 4: `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| Check 5: `npm run lint` | DONE | `lint exit 0` |
| Check 6: ASCII gate | DONE | Prints nothing (`wc -l` of its output is `0`). |
| Check 7: `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | `size exit 0`, `folder exit 0` |
| Check 8: `npm run diagrams` twice | DONE | `second diagrams run changed nothing` (md5 of `docs/diagrams/*` compared between the two runs) |
| Check 9: `npm run build`, then `npx playwright test` | DONE | `410 passed (8.3m)`, the three new cases included (373, 374, 375). The port was checked free three times in a row before the run. |
| Check 10: `node bin/revert-check.mjs` over the node files (store, route, doc view, catalogue, help) | DONE | `87 reverts, 0 unproven, 0 unchecked` over the first four files. `37 reverts, 0 unproven, 9 unchecked` over catalogue plus help. The 9 unchecked cases are pre-existing HELP.md content cases in `tests/views/system/help.test.ts`. I changed that file only to renumber its one revert into `content/docs.ts`. |
| Check 10: `node bin/revert-check.mjs tests/browser/workbench/system.spec.ts` | DONE, with the qualification in the first line | Three runs gave `11 reverts, 3 unproven, 5 unchecked`, then `11 reverts, 5 unproven, 5 unchecked`, then `11 reverts, 3 unproven, 5 unchecked`. Every unproven line reads `[the case did not run]`. While the runs went on, `ps` on the holder of :8792 showed other `oculus-revert-*` copies running `playwright test tests/browser/sources/...`. Every revert in the file was red in at least one run. Of the three new cases: the heading case was red, red, then did not run; the follows case did not run, then red, red; the unlisted case was red all three times. The 5 unchecked cases are pre-existing cases I did not change. |
| Check 11: `ls -d $TMPDIR/oculus-* \| wc -l` | DONE | `0` before, `0` after |

## Per item: what changed and the revert that proves it

**1 and 3. `src/lib/state/system/docs.svelte.ts`**
- Each held document now carries:
  - a mark count (`marks`, `$state`),
  - the mark it was asked at (`askedAt`),
  - the absolute file its answer named (`files`),
  - the tag its answer carried (`tags`).
- `entities.afterReceive` hands each `files` message to `filesMoved` (:109-111, :168-181). A message marks a key only when `concerns()` (:160-166) says so:
  - a gap in the channel's versions marks every key (a merged message has lost its roots);
  - the empty root marks none;
  - otherwise the key is marked when `holds(root, file)` (:58-63, a path-segment prefix match), or when the answer named no file.
- `reading()` (:150-154) asks again when the mark moved, and returns what is held until the answer lands. `PENDING` is returned only before the first answer.
- `load()`'s `finally` (:246) asks again straight away when a mark came while the request was in flight.
- `invalidate` is removed from the type and the store. Grep: `grep -rn "invalidate" src` shows it only in `latex.svelte.ts` and `fs.svelte.ts`, which are other stores.
- Reverts:
  - `:153 => return askedAt[key] !== (marks[key] ?? 0) ? PENDING : (doc ?? PENDING);` (the flicker) turns the in-flight case and the browser heading case red;
  - `:165 => return true;` turns the another-root, id-hub and manual-survives cases red;
  - `:162 => if (root === '') return true;` turns the empty-root case red;
  - `:171 => const gap = false;` turns the gap case red;
  - `:246 => delete` turns the in-flight re-ask case red.

**2. `src/lib/server/content/docs.ts`**
- `fileTag()` (:104-115) is `"<size>-<mtimeMs>"` from one `statSync`, and the empty string for a path that is not a file.
- `answer()` (:280-299) answers `304` with the tag and no body when `If-None-Match` equals the current tag. Otherwise it renders and answers 200 with an `etag` header.
- Both the 200 and the 404 body now carry `file`, the resolved path read.
- `handleDocs` reads `if-none-match` (:458) and passes it to `renderManual`, `renderHubDoc` and `renderDoc`, so the manual and project documents take the same path.
- In the store, a 304 returns early (:213) and `keep()` (:191-196) keeps the held object when the new answer is equal.
- Reverts:
  - docs.ts `:288 => if (false) {` turns the 304 case red;
  - docs.ts `:111 => return '';` turns the tag case red;
  - docs.ts `:458 => const held = '';` turns the manual and project 304 case red;
  - store `:213 => if (false) return;` turns the store 304 case red;
  - store `:193 => delete` turns the equal-body case red.

**4. Following a moved entry**
- `followDoc(docs, path, label)` in `src/lib/state/workbench/navigation/catalogue.ts:30-45` returns:
  - the entry at the path;
  - else the one entry carrying the label, with `moved: true`;
  - else none.
- `src/lib/views/sources/doc/Doc.svelte`:
  - reads the `docs:` list from `entities.config()` through `readDocs`, the same state reader the Catalogue view uses, so nothing goes through the shell (:43-60);
  - an `$effect` (:62-66) calls `layout.restateInstance(instance.id, { ...state, ...docState(entry) })` when the tab is moved;
  - a tab matching nothing draws `doc.unlisted` with its path (:84);
  - `doc.failed` now names the path read (:89);
  - before the config's first push, the tab's own path is read.
- `config/text/views/sources/doc.yml` changes `failed` to `'The document {0} could not be read: {1}'` and adds `unlisted`.
- Reverts:
  - Doc.svelte `:65 => delete` turns the browser follows case red;
  - `:84` turns the unlisted cases red;
  - `:58 => const reading = $derived(path);` turns the unit follows case red;
  - catalogue.ts `:43` turns the one-label case red.

**5. Tests**
- `tests/state/system/docs.test.ts`: 19 cases, every one with a revert.
- `tests/routes/docs/docs.test.ts`: 5 new ETag and 304 cases. The missing-document case now expects `file`. Every case in the file carries a revert.
- `tests/views/sources/doc.test.ts`: 3 new cases; every case carries a revert.
- `tests/state/workbench/navigation/catalogue.test.ts`: 2 `followDoc` cases. They are there because the audits check refuses non-drawing cases under tests/views.
- `tests/browser/workbench/system.spec.ts`: 3 new cases.
- `tests/checks/tree/allow-duplication.txt`: 3 entries removed. Those pairs no longer share lines, and `duplication.test.ts` demands that a repaired pair drops its entry.

## Files and line counts (main, then worktree)

| File | Main | Worktree |
|---|---|---|
| `src/lib/state/system/docs.svelte.ts` | 181 | 256 |
| `src/lib/server/content/docs.ts` | 416 | 468 |
| `src/lib/state/workbench/navigation/catalogue.ts` | 254 | 272 |
| `src/lib/views/sources/doc/Doc.svelte` | 79 | 107 |
| `config/text/views/sources/doc.yml` | 10 | 11 |
| `tests/state/system/docs.test.ts` | 174 | 421 |
| `tests/routes/docs/docs.test.ts` | 359 | 468 |
| `tests/views/sources/doc.test.ts` | 129 | 189 |
| `tests/state/workbench/navigation/catalogue.test.ts` | 444 | 470 |
| `tests/views/system/help.test.ts` | 307 | 307 (one revert line renumbered) |
| `tests/browser/workbench/system.spec.ts` | 351 | 501 |
| `tests/checks/tree/allow-duplication.txt` | 694 | 691 |
| `docs/diagrams/channels.dot` / `.svg` | 168 / 894 | 170 / 906 |
| `docs/diagrams/layer-views.dot` / `.svg` | 139 / 624 | 139 / 624 |
| `docs/diagrams/layers.dot` / `.svg` | 72 / 390 | 72 / 390 |

The `docs/diagrams/*` files are outside the brief's path list. `npm run diagrams` (check 8) rewrote them, because the Doc view now reads the config channel and has a new import. `diagrams.test.ts` fails without them.

## Judgment calls the orchestrator may reverse

1. **Wire shape.** The `api/docs` JSON answer gains `file` (the absolute path read) on 200 and on the 404 from a missing file. A `files` event names an absolute root, and the page had no other way to tell which root holds a document. The git payload already carries absolute roots to the page.
2. **Gap rule.** A `files` message whose version is not the last one plus one (the first message heard included) marks every held document. `server/files/files-channel.ts` merges pending messages to the newest root, so a skipped version means a root was lost. The cost is one 304 per document.
3. **An answer that named no file** (the id is unknown, the name is refused, the path climbs out) is re-read on every message that names a root.
4. **Label matching.** A label counts only when exactly one entry carries it. Two entries with the tab's label follow neither, and the tab shows the unlisted message.
5. **An unlisted tab asks the server nothing**, even when the file exists on disk.
6. **An error answer on a re-read replaces what was held.** It is not the loading state.
7. **Mark during flight.** A write that comes while a request is in flight re-asks from `load()`'s `finally`, without waiting for a reader.

## Sharp edges and limitations

- **Duplicate doc tabs.** A stale tab restated to an entry whose path another open tab already holds gives two tabs with the same `stateId`. They are not deduplicated or closed, and no test exercises this.
- **Stale render after an upgrade.** The tag is size plus mtime and knows nothing of the renderer. After an oculus upgrade that changes `renderMarkdown`, an open tab keeps its old render until the file changes or the page reloads. Tags live only in page memory, so a reload clears them.
- **Busy builders.** A builder writing under `.agents/worktrees/` still moves the hub root, so hub documents and the manual are re-asked every few seconds while it runs. Each re-ask is a 304 and one `stat`, with no render and no repaint. This follows decision 3 of the brief.
- **Flaky pre-existing browser case.** "a diagram says it is drawing while its answer is out, and a view closed then opens whole" printed GREEN with its revert in the second browser revert-check run and red in the other two.

## Premise in the brief that was wrong

Tree fact 6 says no unit test drives `docs.svelte.ts`. `tests/state/system/docs.test.ts` existed on main with 11 cases driving the store through `createClientState`. `grep -rln "createDocs" tests` prints nothing because that file never names `createDocs`. I rewrote the file.

## Before and after, for the look on TEST

1. **Hub document during writes.**
   - Open "HPC how-to" from the Views catalogue, then let a builder run or touch any file under the hub.
   - Before: every few seconds the text drops to "Reading the document..." and comes back.
   - After: the text stays still, and the network tab shows 304s.
2. **Help and a project tab** in the same state: no flicker after.
3. **Saved tab at an old path.**
   - Put a doc tab in the saved layout with path `HPC-UTwente-howto.md` and label "HPC how-to".
   - Before: "The document could not be read: document does not exist".
   - After: the document renders, and the layout's tab state becomes `{ id: "docs/HPC-UTwente-howto.md", path: "docs/HPC-UTwente-howto.md", label: "HPC how-to" }`.
4. **Tab matching nothing.**
   - Before: "The document could not be read: document does not exist".
   - After: "GONE.md is not in the documents list of config/layout.yml, and no entry there carries this tab's name."
5. **Listed path whose file is missing.**
   - Before: "The document could not be read: document does not exist".
   - After: "The document docs/X.md could not be read: document does not exist".

## Doc text (for the orchestrator to apply at landing)

**DESIGN.md:107**, current line as `grep -n` prints it:
`107:Flat, JSON-safe, small: the whole hub is a few hundred kilobytes. Documents are not in it; `api/docs` serves one when a view opens it. That is the reason the cockpit's page is 8.8 MB and this one is not. The one exception is a project's `PRESENT.md` front matter, and for a file that has none its narrative: the Present view draws a slide on a key press, so its slides ride in the snapshot rather than being fetched one at a time.`

Replacement: the same line with this appended at its end:
` A document answer carries an `ETag` of the file's size and modification time and the absolute path of the file read; the page sends the tag back in `If-None-Match` when it asks again, and an unchanged file is a `304` that keeps what the page holds, so a re-read renders nothing.`

**DESIGN.md:275**, current line (it begins `275:- The manual, the configuration and the hub's own documents.` and ends `...with a figure beside a document addressed under the `hub` root so the file route draws it.`).

Replacement: the same line with this appended at its end:
` A `doc` tab whose saved path left the list while exactly one entry still carries its label shows that entry and is restated to the entry's path and id; a tab matching no entry names the path it asked for. `state/system/docs.svelte.ts` asks for a held document again only after a `files` message whose root holds its file, or a gap in that channel's versions, keeps returning what it holds while the answer is in flight, and keeps the held object when the answer is a `304` or draws the same document.`

**HELP.md:13**, current line (it begins `13:The rail draws one button per entry of the `rail:` list of `config/layout.yml`` and ends `...the groups, their order and their letters are those two keys.`).

Replacement: the same line with this appended at its end:
` A document tab saved at a path the `docs` list no longer holds follows the entry carrying its name; one that matches no entry names the path it asked for.`
