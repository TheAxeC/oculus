# Diagnosis: Format Document's edit is not undone by Cmd+Z

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says.

## Symptom

"Cmd+Z after Format Document on a .tex file in the oculus source editor does not undo the format (D14's look, latex.formatter: tex-fmt), though typing is undone." Open item Z427, closed in automode (a): diagnosed on TEST (localhost:8790, tab 812137347) while D37 builds.

## Where the probes run

The symptom needs the running page, so the red command runs on TEST (localhost:8790, tab 812137347), served from the main checkout at 3e3574ef9. `latex.formatter` is set to `tex-fmt` in `tools/oculus/config/behavior.yml` for the run and put back (hash before: e3bb8249). The scratch file is `zz-look-d37/probe.tex` at the hub root, removed at the cleanup. Probes change nothing on disk: each is a change made in the page's own JavaScript at run time and gone at a reload. The step's worktree is not touched. Paths redirected: none. Snapshots before: `~/.oculus/changes.jsonl` 00b23e5d (39 lines), `~/.oculus/workspaces.json` 1bf5d57a.

## Red command

On TEST: open a `.tex` file never opened before with one click in the Files tree (a preview tab), click into the editor (`document.activeElement` is `DIV.native-edit-context`), press Shift+Alt+F (Format Document), read `document.activeElement` and zoom the editor, press Cmd+Z and zoom again. Red is both parts of the symptom: the format stays after Cmd+Z, and the focus has left the editor.

- Run 1, `zz-look-d37/probe2.tex`: after the format the tab is kept (italic name gone, unsaved dot), the text is formatted, `document.activeElement` is `BODY.vscode-dark-modern`; after Cmd+Z the zoom still shows the formatted text. Red.
- Run 2, `probe3.tex`, the first edit a typed `x` instead of the format: `twox` shown, focus `BODY.vscode-dark-modern`. Red (the same focus loss on any first edit).
- Run 3, `probe4.tex`, typed `x`: the editor element found before the key is no longer in the document after it (`same editor element: false | old still in document: false`), focus `BODY`. Red.
- Run 4, `probe5.tex`, typed `x`: of the editor's 20 ancestors only the `.monaco-editor` element is gone; its host `.monaco` and every ancestor up to the workbench are kept. Red.
- Control, the tab already kept (`probe7.tex` after its first edit): typed `y`, Format, then Cmd+Z restores the unformatted text, focus stays `DIV.native-edit-context`, and no element is replaced. Green.

## Shrunk case

- The formatter is not needed: a typed first character gives the same focus loss and element replacement (runs 2 to 4).
- The language is not needed for the mechanism (it is the shared editor), though only LaTeX tabs format.
- What cannot be cut: the tab must be a preview tab, and the edit must be its first. On a kept tab the case is green.

## Hypotheses

1. If keeping the preview tab replaces the tab's instance object (`kept()`, `layout/open/preview.ts:57-60`), and the editor's model effect (`Editor.svelte:291-317`) depends on that object through the `model` prop, compiled in `Source.svelte` as `get instance() { return $$props.instance.id }`, then the effect tears down and makes a new model, losing the undo history and the focus; reading the name through `$derived` turns it green. Falsified if the effect's teardown is not on the stack at the replacement, or if a same-id instance copy does not re-run an effect reading the prop.
2. If the latex extension (`Source.svelte:204-210`) is made again and its effect rebuilds the editor, then the stack at the replacement names the extension effect (`Editor.svelte:378-382`). Falsified if the stack names another effect.
3. If `path` or the URI changes at the keep, the model effect re-runs on a real change. Falsified if the URI before and after is the same.
4. If the editor itself is made again (`build`, `Editor.svelte:189`), `editor.create` is on the stack. Falsified if it is not.

## Probes

- Probe 1 (in-page, tag DIAG-7a3c): `Node.prototype.appendChild`, `insertBefore`, `removeChild` and `Element.prototype.remove` wrapped in the page to log a stack whenever a `.monaco-editor` element is added or removed; `probe7.tex` opened fresh and `x` typed. Output:
  ```
  DIAG-7a3c remove d5e860bf-.../zz-look-d37/probe7.tex <- at ui/controls/editor/Editor.svelte:304:65  (StandaloneEditor._detachModel <- setModel <- execute_effect_teardown)
  DIAG-7a3c append  <- at $effect (ui/controls/editor/Editor.svelte:296:8)
  ```
  The model effect's teardown (`made.setModel(null)`, `created.dispose()`) and its re-run (`createModel`) are the replacement; the URI is the same (hypothesis 3 falsified); no `editor.create` and no extension effect on the stack (hypotheses 2 and 4 falsified). Hypothesis 1 standing.
- Probe 2 (compile): `svelte/compiler` on `Source.svelte` gives `get instance() { return $$props.instance.id; }` and on `source/Editor.svelte` gives `get model() { return instance(); }`, so a read of the name reads the instance object's signal. Hypothesis 1 standing.
- Probe 3 (scratch copy at main's head, `$TMPDIR/diagnose.v1gZON/tree`, client runtime of vitest): the same props shape, an effect reading the name, the instance replaced by a same-id copy as `kept()` does. Without the change: `DIAG-7a3c wrapped=false runs before keep=1 after keep=2` (red). With the change, the name read through `const named = $derived(props.model)`: the run count stays 1 (green). Diff of the change: `- void props.model;` `+ void named;` with `const named = $derived(props.model);`. Undone with the scratch copy's removal.

## Cause

Keeping a preview tab (a first keystroke, a Format Document, a double click) replaces the tab's instance object with a same-id copy without the preview flag (`kept()`, `src/lib/state/workbench/layout/open/preview.ts:57-60`). The source tab hands the editor its model name as `instance.id`, which Svelte compiles to a getter over the instance object, so the editor's model effect (`src/lib/ui/controls/editor/Editor.svelte:291-317`) depends on the object and re-runs: its teardown sets no model and disposes the model, and its body makes a new one from the text. The new model has no undo history, and Monaco's detach removes the focused input, so the focus goes to the body. Cmd+Z after a format that was the tab's first edit therefore undoes nothing; on a tab already kept it works. Shown by probe 1 (the teardown on the stack, the URI unchanged) and probe 3 (red without the change, green with it).

## Fix

In `Editor.svelte`, the model effect depends on the values that name the model, never on the objects they are read from: `const named = $derived(name)` and `const filed = $derived(path)` read in the effect in place of `name` and `path` (`modelUri(loaded.monaco, named, filed)`), so the model is made again only when the tab is pointed at another file, as the effect's comment says. The same holds for any other effect of `Editor.svelte` that reads a prop given as a member of an object.

## Test

The fix's test is a client-runtime test (`*.client.test.ts`, `tests/ui/frame/client-runtime.ts`) at the place: the editor's model effect with a fake kit, the instance replaced by a same-id copy, asserting the model is not made again, red on the tree without the fix. Its failure on the unchanged tree is quoted in D37's repair round report. Where a fake kit cannot reach the effect, the builder writes that under "No test reaches it" with the reason, and the look at D37's landing is the check: Format Document, then Cmd+Z, on a preview tab.

## Handed over

Joins D37 as a repair round (the closure of the open item on Format Document's undo, automode (a)). The red command above is the round's check at the look.
