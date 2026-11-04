# O142 report: a nested group's heading one level down

Everything in the brief is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:181-185` (read with the Read tool, lines 181 to 186):

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.


## Closed items
```

The list holds no entry. The step raises none.

## The cases' first run, on the unchanged tree

Run before any change. `diff -q` of the worktree's `GroupHead.svelte` against `O142-base/src/lib/ui/controls/heads/GroupHead.svelte` printed `same-as-base` at that moment. The case-run program's base run is quoted in full under "The case-run program" below (run 1).

- C1, the Audit strip. Read of `GroupHead.svelte:188-202` (base): `.strip` declares `padding: 2px 8px` and `font-size: var(--fs-md)`; `.name` declares no font size and inherits `--fs-md`. Result: `--fs-md`, `2px 8px`. The case's expected look holds on the base.
- C2, a kind strip inside Audit and the Muted strip (`AuditSection.svelte:199`, `:216`, inside `:189`). The same component with the same rules, and no rule on the base reads the nesting: label `--fs-md`, count `--fs-sm`, `padding: 2px 8px`, no indent. Result: unmet on the base (the label is at `--fs-md`, no indent).
- C3, the Gallery strip (`Status.svelte:131`) and its eight sections (`Gallery.svelte:235`, `:277`, `:299`, `:317`, `:336`, `:344`, `:364`, `:382`). Gallery strip: `--fs-md`, `2px 8px`, the expected look. Each section: `--fs-md`, `2px 8px`, no indent. Result: the Gallery strip holds, the sections are unmet on the base.
- C4, a top-level group in `Pane.svelte:89`'s `.body` (Venues, the Projects board's sections). No rule of the base keys on any `.body`: `--fs-md`, `2px 8px`. Holds.
- C5, a group inside a `Card.svelte:126` or `Settings.svelte:446` `.body` (the Usage view's Live group at `Usage.svelte:240`, the Settings groups of `List.svelte`). As C4: `--fs-md`, `2px 8px`. Holds.
- C6, stickiness. `.strip` declares `top: var(--group-above)` (`:190`), `.group` declares `--group-above: var(--group-strip, 0px)` (`:182`) and the body sets `--group-strip` to `calc(var(--group-above) + <strip height>px)` (`:172`); `Table.svelte:110` reads `top: var(--group-strip, 0)` for its header. Holds on the base.
- C7, the compiled CSS. Run 1 below: no rule reads a nesting value (`grep -n 'group-inset\|group-indent\|group-label'` over the run's output exits 1), `--- warnings: 0`, `--- unused comments: 0`, `--- css_unused_selector warnings: 0`. Result: no nested rule on the base, as the case says.
- C8, the indent at another `--text-scale` and in a rice theme. No indent is declared on the base. Unmet.
- C9, two deep. No indent is declared on the base, so none adds per level. Unmet; and by reading no place of the tree nests two deep (item 2 below).

No case or requirement of the brief turned out wrong.

## DONE / NOT DONE

| Item | State | Command | Last line it printed |
| --- | --- | --- | --- |
| Item 1, the nested strip one level down, keyed on a value the body passes down | DONE | case-run program, run 2 | `--- css_unused_selector warnings: 0` (with `.body.svelte-yopwl3 {` holding `--group-label` and `--group-indent` as live rules) |
| Item 2, no caller changes; nested places listed | DONE | `diff -rq -x local.yml -x node_modules <base>/<d> <d>` for `src tests utils config` | `Files .../O142-base/src/lib/ui/controls/heads/GroupHead.svelte and src/lib/ui/controls/heads/GroupHead.svelte differ` (the only line) |
| Item 3, the head comment's `:29-31` sentence rewritten, the indent sentence added, `:48` kept, filled at 100 columns | DONE | `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/ui/controls/heads/GroupHead.svelte`; `tests/checks/source/comment-width.test.ts` inside test:quick | awk prints nothing; `test:quick: 75.2 s; every command passed` |
| Verify 1, `npm run diagrams` then `npm run test:quick` once | DONE | `npm run diagrams` (no diagram changed: `git status --short` printed only ` M src/lib/ui/controls/heads/GroupHead.svelte`), then `npm run test:quick` | `ok      svelte-check (48.5 s): 1793753116063 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `test:quick: 75.2 s; every command passed` |
| Verify 2, the case-run program after the last change | DONE | `node compile-grouphead.mjs <worktree> <worktree>/src/lib/ui/controls/heads/GroupHead.svelte` | `--- css_unused_selector warnings: 0` |
| Verify 3, the ASCII check of `GroupHead.svelte` | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/ui/controls/heads/GroupHead.svelte` | prints nothing (exit 0) |
| Verify 4, no line over 100 columns | DONE | `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/ui/controls/heads/GroupHead.svelte` | prints nothing (exit 0) |
| Unused exports against the base list | DONE | `sh utils/unused-exports.sh > <scratch>/unused-after.txt`; `diff O142-base/unused-exports.txt <scratch>/unused-after.txt` | diff prints nothing (exit 0); the step adds no export |
| No test added or changed | DONE | `diff -rq` above lists no file under `tests` | the step adds and changes no test |

test:quick result lines, in full:

```
test:quick: 1 changed file(s), from git since HEAD
test:quick: 9 test file(s)
ok      prettier (2.2 s): All matched files use Prettier code style!
ok      ASCII gate (2.5 s)
ok      svelte-kit sync (4.7 s)
ok      eslint (16.7 s)
ok      svelte-check (48.5 s): 1793753116063 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (70.3 s): Duration  49.90s (transform 31.48s, setup 0ms, import 64.51s, tests 70.70s, environment 4ms)
test:quick: 75.2 s; every command passed
```

The nine test files it ran are the checks under `tests/checks/source` and `tests/checks/tree` (catalog-file-keys, comment-width, history, html-sites, keys, strip-types, boundaries, duplication, size). Not covered, as test:quick prints: tests that reach no changed file within the import depth, the build, the lint of unchanged files. No test reads the strip's look, so the computed values on a page are the look at landing.

Runs: `npm run diagrams` once and `npm run test:quick` once, both after the last change. No whole-suite command was run. `npx prettier --check src/lib/ui/controls/heads/GroupHead.svelte` ran once before them ("All matched files use Prettier code style!"); `npm run format` was not run, since no file needed it.

## The cases after the change

Each read is of the worktree's `GroupHead.svelte` (264 lines) and the compiled CSS of the round's run (`run3-round1.txt`).

- C1, the Audit strip (`AuditSection.svelte:189`). Its section stands in `Pane.svelte:89`'s `.body` and in `Findings.svelte`, neither a `GroupHead` body (Findings' own `GroupHead` is `:155-198`, and `<AuditSection>` is at `:200`, after it), so nothing sets `--group-indent` or `--group-label` above it: `.group` gives `--group-inset: var(--group-indent, 0px)` = `0px` (`:192`), `.strip` `padding: 2px 8px 2px calc(8px + 0px)` = `2px 8px` (`:220`), `.name` `font-size: var(--group-label, var(--fs-md))` = `--fs-md` (`:245`). Met: unchanged.
- C2, the kind strips and Muted (`AuditSection.svelte:199`, `:216`). Their sections are descendants of the Audit group's `<div class="body">`, which the rule `.body` (`:200-205`) gives `--group-label: var(--fs-sm)` and `--group-indent: calc(0px + var(--bare-box, var(--tab-action)) + var(--group-gap))`, with `--group-gap: 6px` (`:193`). Inherited: `.name` at `--fs-sm`; `.count` at `--fs-sm` (`:251-254`, unchanged); `.strip` left padding `calc(8px + 22px * scale + 6px)` with `--bare-box` unset in a pane body. Met.
- C3, Gallery (`Status.svelte:131`) unchanged by the C1 read (it stands in the Status view's top level); the eight sections (`Gallery.svelte:235` to `:382`) stand in its body through `<Gallery>` at `Status.svelte:139`, so each reads one level down as C2. Met.
- C4, the Venues group and the Projects board's sections: they stand in `Pane.svelte:89`'s `.body`, which carries `Pane.svelte`'s scoped class and not `GroupHead`'s `svelte-yopwl3`, so the `.body.svelte-yopwl3` rule does not match it and nothing sets the two values: `--fs-md`, `2px 8px`. Met.
- C5, the Usage view's Live group (`Usage.svelte:240`, in a Card whose `.body` is `Card.svelte:126`) and the Settings groups (`List.svelte`, under `Settings.svelte:446`): both `.body` elements are other components' scoped classes, so as C4: `--fs-md`, `2px 8px`. Met.
- C6, stickiness: `top: var(--group-above)` (`:213`), `--group-above` (`:191`) and the body's `style:--group-strip` (`:181`) are as on the base, and the indent is padding, so the strip's height and the sum the body passes are unchanged; the Gallery's Table section (`Gallery.svelte:336-342`) keeps its header at `var(--group-strip, 0)` under both strips. Met by reading; the scrolled look is the look at landing.
- C7, the round's run: `.body.svelte-yopwl3 {` with `--group-label: var(--fs-sm);` and `--group-indent: calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap));`, `.group.svelte-yopwl3` with `--group-inset: var(--group-indent, 0px);` and `--group-gap: 6px;`, `.strip.svelte-yopwl3` with `padding: 2px 8px 2px calc(8px + var(--group-inset));`, `.name.svelte-yopwl3` with `font-size: var(--group-label, var(--fs-md));`; `--- warnings: 0`, `--- unused comments: 0`, `--- css_unused_selector warnings: 0`. Met.
- C8, the declared indent is `var(--bare-box, var(--tab-action)) + var(--group-gap)` per level, `--group-gap` being `6px`. The parent's fold control is a bare `ToolButton` with `box-sizing: border-box; min-width: var(--bare-box, var(--tab-action))` and `padding: 0 var(--tab-action-pad)` (`ToolButton.svelte:226-232`); its glyph is `calc(var(--icon-box) * var(--text-scale, 1))` wide with `--icon-box: 16px` (`tokens.css:253`), so its content box is `16 * scale + 2 * 2 * scale = 20 * scale`, under the `22 * scale` minimum, and the control is exactly `--tab-action` wide at every scale. The parent's words start at `8px + 22px * scale + 6px` from the section's edge (the strip's gap is `var(--group-gap)`, 6px, `:217`), and the nested fold control starts at `8px + (22px * scale + 6px)`: the same. The rice themes override only the `--fs-*` steps (`themes.css:51-57`; `grep -rn -- '--tab-action:' src/lib/themes/` finds only `tokens.css:193`) and `:global(body.rice) .tool.bare` takes the same box (`ToolButton.svelte:227`), so it holds there. `--bare-box` is set only on a pane's header, a toolbar's popover and a page leaf's head (`Pane.svelte:152`, `Toolbar.svelte:313`, `PageLeaf.svelte:142`), never around a group's body, so the body computes the box the fold control draws. Met by reading; the drawn alignment is the look at landing.
- C9, two deep: a nested group's section carries `--group-inset` = its parent body's `--group-indent` (one level), and its own body computes `--group-indent: calc(<one level> + box + var(--group-gap))`, so a group in that body reads two levels. Met by reading; no place of the tree nests two deep.

## The case-run program

Source, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o142-builder/compile-grouphead.mjs`:

```js
// Case-run program of O142 C7: compiles one GroupHead.svelte with the svelte/compiler of the
// worktree it is given and prints the compiled CSS and every compiler warning. It writes nothing.
// Usage: node compile-grouphead.mjs <worktree root> <path of GroupHead.svelte>
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [root, file] = process.argv.slice(2);
const require = createRequire(join(root, 'package.json'));
const loaded = await import(pathToFileURL(require.resolve('svelte/compiler')).href);
const svelte = typeof loaded.compile === 'function' ? loaded : loaded.default;
const source = readFileSync(file, 'utf8');
const result = svelte.compile(source, { filename: 'GroupHead.svelte', css: 'external', generate: 'client' });

console.log('svelte ' + svelte.VERSION + ', file ' + file);
console.log('--- css');
console.log(result.css === null ? '(no css)' : result.css.code);
console.log('--- warnings: ' + result.warnings.length);
for (const w of result.warnings) console.log(w.code + ': ' + w.message.split('\n')[0]);
const css = result.css === null ? '' : result.css.code;
console.log('--- unused comments: ' + (css.match(/\(unused\)/g) ?? []).length);
console.log('--- css_unused_selector warnings: ' + result.warnings.filter((w) => w.code === 'css_unused_selector').length);
```

The command, with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH`, run from the scratch folder: `node compile-grouphead.mjs $W $W/src/lib/ui/controls/heads/GroupHead.svelte`, `$W` the worktree. Its output was kept with `tee` in the scratch folder (`run1-base.txt`, `run2-after.txt`); it writes no file of the worktree.

Run 1, on the unchanged tree (the file equal to the base copy):

```
svelte 5.57.1, file /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O142/src/lib/ui/controls/heads/GroupHead.svelte
--- css

    .group.svelte-yopwl3 {
        --group-above: var(--group-strip, 0px);
        min-width: 0;
    }

    /* The fold control stands on the strip's centre line; the label and the count share a baseline
       after it, and the actions stand at the line's right end. */
    .strip.svelte-yopwl3 {
        position: sticky;
        top: var(--group-above);
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin: 0 0 8px;
        padding: 2px 8px;
        border-radius: var(--input-radius);
        background: var(--panel);
        font-size: var(--fs-md);
        color: var(--group, var(--muted-txt));
    }

    /* The strip of a tree's row, which takes the keyboard's focus as a row of the tree does. */
    .strip.svelte-yopwl3:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .words.svelte-yopwl3 {
        display: flex;
        flex: 1;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
    }

    /* A label longer than the pane is cut with an ellipsis, so the strip stays one line. */
    .name.svelte-yopwl3 {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .count.svelte-yopwl3 {
        flex: none;
        font-size: var(--fs-sm);
    }

    .actions.svelte-yopwl3 {
        display: flex;
        flex: none;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        font-weight: normal;
    }

--- warnings: 0
--- unused comments: 0
--- css_unused_selector warnings: 0
```

Run 2, after the first run's last change and before repair round 1 (the rules that differ from run 1, then the summary; the rest is run 1's text); the round's run is quoted under "Repair round 1":

```
    .group.svelte-yopwl3 {
        --group-above: var(--group-strip, 0px);
        --group-inset: var(--group-indent, 0px);
        min-width: 0;
    }

    /* What the groups nested in the body read: the small size for their label, and an indent one
       level deeper than this group's, one fold control's box and the strip's 6 px gap. */
    .body.svelte-yopwl3 {
        --group-label: var(--fs-sm);
        --group-indent: calc(var(--group-inset) + var(--bare-box, var(--tab-action)) + 6px);
    }

    /* The fold control stands on the strip's centre line; the label and the count share a baseline
       after it, and the actions stand at the line's right end. A nested group's indent is padding
       before the fold control, so the strip paints its whole band. */
    .strip.svelte-yopwl3 {
        ...
        padding: 2px 8px 2px calc(8px + var(--group-inset));
        ...
    }

    /* A label longer than the pane is cut with an ellipsis, so the strip stays one line. It is at
       the medium size, and at the small size in a group nested in another's body. */
    .name.svelte-yopwl3 {
        min-width: 0;
        font-size: var(--group-label, var(--fs-md));
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

--- warnings: 0
--- unused comments: 0
--- css_unused_selector warnings: 0
```

`grep -n 'group-inset\|group-indent\|group-label\|svelte-yopwl3 {' run2-after.txt` prints `4:    .group.svelte-yopwl3 {`, `6:        --group-inset: var(--group-indent, 0px);`, `12:    .body.svelte-yopwl3 {`, `13:        --group-label: var(--fs-sm);`, `14:        --group-indent: calc(...)`, `20:    .strip.svelte-yopwl3 {`, `29:        padding: 2px 8px 2px calc(8px + var(--group-inset));`, `42:    .words.svelte-yopwl3 {`, `52:    .name.svelte-yopwl3 {`, `54:        font-size: var(--group-label, var(--fs-md));`, `60:    .count.svelte-yopwl3 {`, `65:    .actions.svelte-yopwl3 {`.

## Item 2, the nested places

Read from every caller: `grep -rln '<GroupHead' src --include='*.svelte'` (39 files, each with its count of `<GroupHead`), the open and close lines of every file with more than one (`EntryFolder`, `Person`, `Project`, `Inbox`, `Leads`, `Linkedin`, `AccountSetup`, `Usage`, `Catalogue`: each pair closes before the next opens, so siblings), the snippets holding a `GroupHead` and where each is rendered (`Inbox.svelte:203` `section`, rendered at `:254`, outside `:262-275`; the `heading` snippets of `EntryFolder.svelte:120` and `Person.svelte:292`, inside a `FolderFiles` at `:119` and `:291`, each after the previous group closes), and every render site of a component that draws a `GroupHead` (`ScheduleList` at `UpdateTray.svelte:163`, before its group at `:170`; `GitSteps` at `AccountSetup.svelte:158`, after `:157`; `Bucket` at `Radar.svelte:150`, before `:166`; `Keys` and `Order` at `Slides.svelte:322`, `:334`, before `:345`; `AuditSection` at `Findings.svelte:200`, after `:198`; `Latex` at `Project.svelte:153`, before `:155`; `Hooks` at `Status.svelte:127`, before `:131`; `Referrers`, `EntryFolder`, `Lanes`, `Band`, `Capacity`, `Login`, `Quota`, `Recent`, `List`, `AppHosts` in files with no `GroupHead`; `Gallery` at `Status.svelte:139`, inside `:131-141`). `Gallery.svelte` and `AuditSection.svelte` render no component of that set inside their sections. The nested places:

| Nested group | Parent group |
| --- | --- |
| `views/system/findings/AuditSection.svelte:199` (each kind: Open items, Missing data, Hub conventions, Manifest guardrails, Readability, Website) | `views/system/findings/AuditSection.svelte:189` (Audit) |
| `views/system/findings/AuditSection.svelte:216` (Muted) | `views/system/findings/AuditSection.svelte:189` (Audit) |
| `views/system/status/Gallery.svelte:235` | `views/system/status/Status.svelte:131` (Gallery, `<Gallery>` at `:139`) |
| `views/system/status/Gallery.svelte:277` | `views/system/status/Status.svelte:131` |
| `views/system/status/Gallery.svelte:299` | `views/system/status/Status.svelte:131` |
| `views/system/status/Gallery.svelte:317` | `views/system/status/Status.svelte:131` |
| `views/system/status/Gallery.svelte:336` (the Table section) | `views/system/status/Status.svelte:131` |
| `views/system/status/Gallery.svelte:344` | `views/system/status/Status.svelte:131` |
| `views/system/status/Gallery.svelte:364` | `views/system/status/Status.svelte:131` |
| `views/system/status/Gallery.svelte:382` | `views/system/status/Status.svelte:131` |

All paths are under `src/lib/`. No place nests two deep. No caller changed (the `diff -rq` row above).

## The diff of `GroupHead.svelte`

`src/lib/ui/controls/heads/GroupHead.svelte`, 239 lines to 264 (`wc -l`), 32 lines added and 8 removed (`grep -c` over `diff -u` against the base copy), as `git diff 261dc20b2 -- src/lib/ui/controls/heads/GroupHead.svelte` prints it after repair round 1. The only file of the step's tree that changed (the `diff -rq` row), besides this report.

```diff
@@ -27,10 +27,19 @@
     //
     // The line inside the strip is the fold control (FoldControl.svelte beside it), a bare button
     // named "Fold <name>" or "Unfold <name>" with the fold glyph of the state, then the group's
-    // glyph where it has one, its label at the medium size in the group's hue, in the muted text
-    // colour where it has none, and its count at the small size in the same colour, then the
-    // group's `actions` at the line's right end, for what acts on the whole group. A label longer
-    // than the pane is cut with an ellipsis, so the strip stays one line.
+    // glyph where it has one, its label in the group's hue, in the muted text colour where it has
+    // none, and its count in the same colour, then the group's `actions` at the line's right end,
+    // for what acts on the whole group. A group in no other group's body draws its label at the
+    // medium size and its count at the small size. A group nested in another group's body reads one
+    // level under it: its label and its count are at the small size, and the words of its strip
+    // stand one level in, so its fold control starts under its parent's glyph or label. The body
+    // passes the groups inside it the size of their label (`--group-label`) and how far in they
+    // stand (`--group-indent`, which the section carries as `--group-inset`, as it carries the
+    // strip heights), one fold control's box and the strip's 6 px gap more at each level, so the
+    // indent holds at every text size and in every theme, and a group nested two deep stands two
+    // levels in. The indent is padding inside the strip, so the strip's `--panel` paint covers its
+    // whole band from the group's left edge and nothing scrolling under it shows beside the words.
+    // A label longer than the pane is cut with an ellipsis, so the strip stays one line.
     //
     // A folded group's body stays in the page, hidden until found: its cards stay mounted, so a
     // reveal finds them, and the browser's find-in-page searches them; a match inside fires
@@ -180,21 +189,35 @@
 <style>
     .group {
         --group-above: var(--group-strip, 0px);
+        --group-inset: var(--group-indent, 0px);
+        --group-gap: 6px;
         min-width: 0;
     }
 
+    /* What the groups nested in the body read: the small size for their label, and an indent one
+       level deeper than this group's, one fold control's box and the strip's gap (`--group-gap`,
+       which the strip's `gap` reads as well). */
+    .body {
+        --group-label: var(--fs-sm);
+        --group-indent: calc(
+            var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap)
+        );
+    }
+
     /* The fold control stands on the strip's centre line; the label and the count share a baseline
-       after it, and the actions stand at the line's right end. */
+       after it, and the actions stand at the line's right end. A nested group's indent is padding
+       before the fold control, so the strip paints its whole band. The gap between the strip's
+       parts is the section's `--group-gap`, which the body adds to the indent at each level. */
     .strip {
         position: sticky;
         top: var(--group-above);
         z-index: 2;
         display: flex;
         align-items: center;
-        gap: 6px;
+        gap: var(--group-gap);
         min-width: 0;
         margin: 0 0 8px;
-        padding: 2px 8px;
+        padding: 2px 8px 2px calc(8px + var(--group-inset));
         border-radius: var(--input-radius);
         background: var(--panel);
         font-size: var(--fs-md);
@@ -215,9 +238,11 @@
         min-width: 0;
     }
 
-    /* A label longer than the pane is cut with an ellipsis, so the strip stays one line. */
+    /* A label longer than the pane is cut with an ellipsis, so the strip stays one line. It is at
+       the medium size, and at the small size in a group nested in another's body. */
     .name {
         min-width: 0;
+        font-size: var(--group-label, var(--fs-md));
         overflow: hidden;
         white-space: nowrap;
         text-overflow: ellipsis;
```

Fill of the rewritten paragraph (`:28-42`): `awk 'NR>=28 && NR<=43 {print NR": "length($0)}'` prints `28: 98 29: 96 30: 98 31: 98 32: 96 33: 100 34: 96 35: 97 36: 96 37: 95 38: 97 39: 97 40: 99 41: 99 42: 89`, and no next line's first word fits on the line above it (checked against each next line's first word with `awk '{split($0,a," "); ...}'`).

Greps:

- The new names, `grep -rn -e '--group-label' -e '--group-indent' -e '--group-inset' src tests docs README.md` and the same over `config --exclude=local.yml`: hits only in `GroupHead.svelte` (`:36`, `:37`, `:192`, `:201`, `:202`, `:203`, `:220`, `:245`); none elsewhere, so no other rule reads or sets them. The same names were absent on the base (`grep -rn -- '--group-' src` before the change listed only `--group-strip`, `--group-above` and `--group`).
- The history words over the added lines: `grep '^+' grouphead.diff | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"` prints `+       before the fold control, so the strip paints its whole band. */` (and the diff's `+++` header line). Judged: "before" there is the place in the strip (the padding stands ahead of the fold control), the sense `GroupHead.svelte:96` already uses ("The glyph name drawn before the label"), not a comparison with an earlier state.

## The comments and doc paragraphs on the strip's look

- `GroupHead.svelte:29-31` (base), the label and count sizes: rewritten (now `:30-33`, with the nested sizes, and `:33-42` the indent and why it is padding).
- `GroupHead.svelte:13-16`, "pads its words the same in every mode" and "paints the pane's background (`--panel`) solid in every mode and wherever it stands, so what scrolls under it never shows through": still true; the padding differs by level and not by mode, and the indent is padding, so the paint covers the band.
- `GroupHead.svelte:22-26`, the body passing `--group-strip` and the section carrying `--group-above`: still true; the new pair follows it and the rewritten paragraph names the likeness.
- `GroupHead.svelte:48` (now `:57`), "The look of the strip is the same.": still true, kept.
- `GroupHead.svelte:55-56` and `:61-62` (now `:64-65`, `:70-71`), the two nesting views: still true, kept.
- `GroupHead.svelte:186-187`, the `.strip` comment: rewritten (a sentence on the indent as padding added).
- `GroupHead.svelte:218`, the `.name` comment: rewritten (the two sizes added).
- `tokens.css:233-235` (the sentence starting at `:234`), a group's heading paints the panel solid so nothing scrolling under it shows through: still true.
- `docs/HELP.md:573`, a group's heading stays solid whatever `panel_opacity` is: still true.
- `docs/HELP.md:295`, the Groups bullet (one strip per group; a group that folds inside another, such as a kind of the Audit section or a section of the Gallery, whose strip stands under the outer one): rewritten (repair round 1, item 3).
- `Gallery.svelte:28-30`, each section is the group nested in the Gallery group: still true. `AuditSection.svelte:23-26`, each kind and Muted a group of its own inside the Audit: still true.

## Judgment calls the brief left open

Each reversible, none a user-visible shape beyond the ruled look.

1. The mechanism is the value the body passes down (the brief's first form), with three new internal custom properties: `--group-indent` and `--group-label` set by the body (`.body`, `:200-205`), and `--group-inset` the section's copy of `--group-indent` (`:192`), named after the existing `--group-strip` and `--group-above` pair. The scoped `.body` with a `:global(...)` tail was not used, since it would match any `.group > .strip` of another component inside a `GroupHead` body and would need a selector per depth for C9.
2. The small size is set on the label (`.name`) alone; the strip keeps `font-size: var(--fs-md)`, so the glyph's `vertical-align: -0.125em` and every other inherited size stay as on a top-level strip, per the brief's decision 1 ("no other property changes"). The count was already `--fs-sm`.
3. A group two deep keeps its label at `--fs-sm` (no `--fs-xs`): the ruling names the small size, and only the indent adds per level.
4. The strip's gap is one value, `--group-gap: 6px`, declared once on `.group` (`GroupHead.svelte:193`); the strip's `gap` reads it (`:217`) and the body's `--group-indent` adds it (`:202-204`), and the comments over `.body` (`:197-199`) and `.strip` (`:207-210`) name it. The gap of `.words` (`:237`, `gap: 6px`, between the glyph, the label and the count) is a separate value and stays a literal.
5. The `docs/HELP.md:295` Groups bullet says the nested look in one clause (the ruling of repair round 1, item 3).

## Host- and user-visible changes, before and after

What the look at landing reads against. State: the Findings view with the Audit group open and findings in at least one kind and at least one muted finding (Muted present); the Status view with the Gallery group open (it starts closed, `showGallery`) and its sections open.

- The Audit kinds (`AuditSection.svelte:199`: Open items, Missing data, Hub conventions, Manifest guardrails, Readability, Website) and Muted (`:216`). Before: each strip drawn exactly as the Audit strip, label 13 px, fold control at 8 px from the group's left edge. After, in Light (the default, the first theme) and Dark and VS Code Dark Modern (`vscode-dark-modern`) and Light Modern: label 12 px (the count 12 px as before), the fold control at 8 + 22 + 6 = 36 px, standing under the first letter of "Audit"; the `--panel` band still spans from the group's left edge, nothing of the rows scrolling under it showing in the 28 px left of the fold control. In a terminal theme (Catppuccin Mocha, `body.rice`): label 11 px against Audit's 12 px, same indent. At text size 1.2: label 14.4 px, indent 8 + 26.4 + 6 px. The strip's height, the 8 px under it, the stickiness under the Audit strip, the hue (the kinds carry none, so the muted text colour) and the actions are unchanged.
- The eight Gallery sections (`Gallery.svelte:235`, `:277`, `:299`, `:317`, `:336`, `:344`, `:364`, `:382`) under the Gallery group (`Status.svelte:131`). Before: each drawn as the Gallery strip. After, in the same themes: as the Audit kinds above, under the first letter of "Gallery"; the Table section (`:336`) keeps its sticky header row under both strips when its rows scroll.
- The label's room before its ellipsis, in every nested group above. Before: a nested strip's label had the same room as its parent's. After: one fold control and one gap less at each level (`22px * scale + 6px`, 28 px at text scale 1), from the left padding (`GroupHead.svelte:220`) with the label cut at `text-overflow: ellipsis` (`:248`); the smaller font gives part of it back. In a narrow pane a long kind label such as "Manifest guardrails", or a long Gallery section label, is cut about 28 px sooner than before.
- Unchanged everywhere else: the Audit and Files strips, the Gallery and Hooks strips, the Venues view, the Projects board's sections, the Usage view's Live (in a Card) and History, the Settings groups, and every other top-level group of the 39 callers.

## Wrong or impossible in the brief

One premise does not reproduce: the list of `.body` elements (brief, "What is on the tree", fourth bullet). `grep -rn 'class="body"' src --include='*.svelte'` on the base copy prints 16 hits; the brief names five besides GroupHead's own (`Pane.svelte:89`, `Card.svelte:126`, `Settings.svelte:446`, `PaneBody.svelte:316`, `Workbench.svelte:389`), and the other ten are `views/shared/forms/entry/card/EntryLink.svelte:53`, `:57`, `:61`, `views/shared/forms/entry/card/EntryFields.svelte:181`, `views/academic/present/parts/Plain.svelte:24`, `:39`, `:42`, `views/academic/present/parts/Project.svelte:116`, `views/system/workbench/editors/Fold.svelte:68` and `views/sessions/terminal/transcript/TurnList.svelte:100`. None of the ten holds a `GroupHead` (`grep -c '<GroupHead'` over the six files prints 0 for each), and the mechanism keys on GroupHead's own scoped `.body`, so nothing built rests on the brief's list.

Every other premise checked held: `GroupHead.svelte` 239 lines with the cited ranges (`cat -n`), the nesting places (item 2), `--fs-sm`/`--fs-md` at `tokens.css:167-168` and `themes.css:53-54`, the bare box at `ToolButton.svelte:230` and `--tab-action` at `tokens.css:193`, Svelte 5.57.1 (`node_modules/svelte/package.json`).

## Limitations and sharp edges

- The alignment of C8 rests on the fold control being exactly its minimum box: its 16 px icon box plus 2 px of room either side (20 px at scale 1) is under the 22 px minimum. A fold glyph drawn wider than the box (under the terminal themes' ASCII stand-ins, `rice.icons: false`, the glyph is text at the stand-in's size; not measured) would widen the parent's control and the nested control would stand that much left of the parent's label. The look at landing in a terminal theme with icons off shows it.
- `--group-label` and `--group-indent` are inherited by everything inside a group's body; no rule outside `GroupHead.svelte` reads either (the grep above), so nothing else changes, but a future component that reads a property of those names would pick them up.
- The computed values on a page (font size, padding, the alignment under the parent's label, the painted band while rows scroll) are seen only at the look on landing; this step ran no page, as the rules file says.

## Repair round 1

Every item of `agents/briefs/O142-round-1.md` is done.

The `file:line` positions of `GroupHead.svelte` in the sections above are of the file after this round: `.group` `:190-195` (`--group-inset` `:192`, `--group-gap` `:193`), the `.body` comment `:197-199` and rule `:200-205` (`--group-label` `:201`, `--group-indent` `:202-204`), the `.strip` comment `:207-210`, `.strip` `:211` with `top` `:213`, `gap` `:217`, `padding` `:220`, `.name` `:243` with `font-size` `:245` and `text-overflow` `:248`, `.count` `:251`. The head comment (`:28-42`) and the markup are unchanged by the round.

### Item 1, the gap as one value

`.group` declares `--group-gap: 6px` once (`:193`); `.strip` reads it as `gap: var(--group-gap);` (`:217`); the body's indent adds it in place of the literal:

```css
    .body {
        --group-label: var(--fs-sm);
        --group-indent: calc(
            var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap)
        );
    }
```

The three-line form of `--group-indent` is prettier's print of the one-line form (`npx prettier src/lib/ui/controls/heads/GroupHead.svelte`, printed to stdout, written into the file with the Edit tool). The comment over `.body` now ends "one fold control's box and the strip's gap (`--group-gap`, which the strip's `gap` reads as well).", and the comment over `.strip` adds "The gap between the strip's parts is the section's `--group-gap`, which the body adds to the indent at each level." The head comment's sentence "one fold control's box and the strip's 6 px gap more at each level" stays true: the value is 6 px. The `.words` gap (`:237`) is the gap inside the words and is not the strip's gap; it is unchanged. `grep -rn -- '--group-gap' src tests docs README.md` and the same over `config --exclude=local.yml` found nothing before the change (exit 1).

The case-run program after the change (`node compile-grouphead.mjs $W $W/src/lib/ui/controls/heads/GroupHead.svelte > run3-round1.txt`, then `grep -n 'group-gap\|group-inset\|group-indent\|group-label\|svelte-yopwl3 {\|^---'` over it):

```
2:--- css
4:    .group.svelte-yopwl3 {
6:        --group-inset: var(--group-indent, 0px);
7:        --group-gap: 6px;
12:       level deeper than this group's, one fold control's box and the strip's gap (`--group-gap`,
14:    .body.svelte-yopwl3 {
15:        --group-label: var(--fs-sm);
16:        --group-indent: calc(
17:            var(--group-inset) + var(--bare-box, var(--tab-action)) + var(--group-gap)
24:       parts is the section's `--group-gap`, which the body adds to the indent at each level. */
25:    .strip.svelte-yopwl3 {
31:        gap: var(--group-gap);
34:        padding: 2px 8px 2px calc(8px + var(--group-inset));
47:    .words.svelte-yopwl3 {
57:    .name.svelte-yopwl3 {
59:        font-size: var(--group-label, var(--fs-md));
65:    .count.svelte-yopwl3 {
70:    .actions.svelte-yopwl3 {
79:--- warnings: 0
80:--- unused comments: 0
81:--- css_unused_selector warnings: 0
```

The nested rule `.body.svelte-yopwl3` is live, and no `css_unused_selector` warning is printed.

### Item 2, judgment call 4

Rewritten in "Judgment calls the brief left open": the gap is one value, `--group-gap: 6px` on `.group` (`:193`), read by the strip's `gap` (`:217`) and added by the body's `--group-indent` (`:202-204`), named in the comments over `.body` (`:197-199`) and `.strip` (`:207-210`). Judgment call 5, which said no `docs/HELP.md` bullet, was made false by item 3 and now says the bullet carries the nested look.

### Item 3, `docs/HELP.md:295`

The Groups bullet's sentence on a heading inside a group, after the round (the rest of the bullet unchanged; `git diff --stat docs/HELP.md` prints `1 file changed, 1 insertion(+), 1 deletion(-)`):

> A heading inside a group is a plain label that does not fold, such as a Settings section or a sub-heading of the Gallery or the Views catalogue, or a group that folds, such as a kind of the Audit section or a section of the Gallery, whose strip stands under the outer one and reads one level under it: its label and its count at the small size, and the words of its strip indented by one fold control.

The added words are "and reads one level under it: its label and its count at the small size, and the words of its strip indented by one fold control".

### Item 4, the list of `.body` elements

"Wrong or impossible in the brief" now names the premise as not reproduced. `grep -rn 'class="body"' src --include='*.svelte'` on the base copy (`O142-base`):

```
src/lib/ui/frame/Pane.svelte:89:    <div class="body" class:flush data-scroll>
src/lib/ui/frame/Card.svelte:126:            <div class="body">{@render children()}</div>
src/lib/ui/controls/heads/GroupHead.svelte:171:        class="body"
src/lib/shell/Workbench.svelte:389:        <div class="body" style={bodyTracks(shownFloats())}>
src/lib/shell/panes/PaneBody.svelte:316:    class="body"
src/lib/views/shared/forms/entry/card/EntryLink.svelte:53:    <p class="body">
src/lib/views/shared/forms/entry/card/EntryLink.svelte:57:    <p class="body">
src/lib/views/shared/forms/entry/card/EntryLink.svelte:61:    <p class="body">
src/lib/views/shared/forms/entry/card/EntryFields.svelte:181:            <div class="body">
src/lib/views/academic/present/parts/Plain.svelte:24:        <div class="body"><Words text={row.body} block /></div>
src/lib/views/academic/present/parts/Plain.svelte:39:            <div class="body"><Words text={row.rest} block /></div>
src/lib/views/academic/present/parts/Plain.svelte:42:        <div class="body"><Words text={row.code} block /></div>
src/lib/views/academic/present/parts/Project.svelte:116:        <div class="body"><Words text={slide.body} block /></div>
src/lib/views/system/workbench/editors/Fold.svelte:68:    <div id={body} class="body">
src/lib/views/system/workbench/Settings.svelte:446:        <div class="body">
src/lib/views/sessions/terminal/transcript/TurnList.svelte:100:                        <div class="body">
```

16 hits (`wc -l`). `grep -c '<GroupHead'` over `EntryLink.svelte`, `EntryFields.svelte`, `present/parts/Plain.svelte`, `present/parts/Project.svelte`, `editors/Fold.svelte` and `TurnList.svelte` prints 0 for each, so none of the ten holds a `GroupHead`, and the mechanism is unaffected.

### Item 5, the label's room

"Host- and user-visible changes" gains a bullet: a nested strip's label has one fold control and one gap less room before its ellipsis at each level (`22px * scale + 6px`, 28 px at text scale 1), before and after, with "Manifest guardrails" in a narrow pane as the example.

### Item 6, the doc paragraph list

The list of comments and doc paragraphs on the strip's look adds `docs/HELP.md:295`, marked 'rewritten'.

### Runs, after the last change of the round

- `npm run diagrams`, then `npm run test:quick` once:

```
test:quick: 5 changed file(s), from git since HEAD
test:quick: 9 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (10.1 s): 1793755903197 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (10.1 s)
ok      vitest checks (46.3 s): Duration  34.08s (transform 14.50s, setup 0ms, import 29.77s, tests 44.07s, environment 2ms)
test:quick: 48.9 s; every command passed
```

  The five changed files are the two source files and the three untracked ledger files (the round brief, the review, this report). After `npm run diagrams`, `git status --short` printed only ` M docs/HELP.md`, ` M src/lib/ui/controls/heads/GroupHead.svelte` and the three `??` ledger files, so no diagram changed. Not covered, as test:quick prints: tests that reach no changed file within the import depth, the build, the lint of unchanged files.
- The case-run program: quoted under item 1, `--- css_unused_selector warnings: 0`.
- `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/ui/controls/heads/GroupHead.svelte docs/HELP.md`: prints nothing (exit 0).
- `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/ui/controls/heads/GroupHead.svelte`: prints nothing (exit 0).
- `npx prettier --check src/lib/ui/controls/heads/GroupHead.svelte docs/HELP.md`: "All matched files use Prettier code style!"
- `sh utils/unused-exports.sh` to `unused-r1.txt` in the scratch folder, `diff ../O142-base/unused-exports.txt` against it: prints nothing (exit 0).
- History words over the added lines of `GroupHead.svelte` (`grep '^+' g2.diff | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"`): one hit besides the `+++` header, `+       before the fold control, so the strip paints its whole band. The gap between the strip's`; "before" names the place in the strip, as the review judged.
- `diff -rq -x local.yml -x node_modules ../O142-base/<d> <d>` over `src tests utils config`: the one line `Files ../O142-base/src/lib/ui/controls/heads/GroupHead.svelte and src/lib/ui/controls/heads/GroupHead.svelte differ`. `docs/` is not in the base copy; `git status --short` lists ` M docs/HELP.md`.

The verify list ran once in this round. No whole-suite command was run. No test was added or changed. No program other than the case-run program was written; every edit was made with the Edit tool.

### Files

| File | Lines | Change against the base |
| --- | --- | --- |
| `src/lib/ui/controls/heads/GroupHead.svelte` | 264 (`wc -l`; 239 on the base) | +32 -8 (`grep -c` over `diff -u` against the base copy) |
| `docs/HELP.md` | 621 (`wc -l`) | line 295 changed, `1 insertion(+), 1 deletion(-)` (`git diff --stat`) |
| `.scratch/migration/agents/reviews/O142-report.md` | this report | the edits of items 2, 4, 5 and 6 and this section |

`docs/HELP.md:295` is inside the round's widened paths.
