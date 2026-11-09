# O179 report: an absent list is told from an empty one

Everything the brief asks to build is built, and one line of the verify list is red in a file this step does not change: `npm run test:quick` fails two tests of `tests/checks/source/keys.test.ts`, both about `src/lib/server/content/audit/publications.ts`, which is identical to the base copy. Because that run is red, its row below is NOT DONE.

## Open items of the state file, verbatim

`sed -n 174,181p .scratch/migration/orchestrator-state.md` prints the heading "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)", then blank lines, then "An entry leaves this list for the closed log the moment Axel rules on it." with the rest of that paragraph. The list holds no entry.

## The cases' first run, on the unchanged tree

Run before any change, with `npx vitest run --config .agents/scratch/cases.config.ts --root . --reporter=dot`:

```
empty_undefined: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run
empty_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run
empty_one_item: Not set=no Empty list=no Clear=no Add=yes items=1 bytes=1443 sha=9db38e632856 same-as-first-run
plain_undefined: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run
plain_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run
parked_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=312 sha=8198d7a5cc16 same-as-first-run

plain_undefined markup: <div class="control svelte-dl424y" data-control="list"><div class="items svelte-cklm46"> <span class="tip svelte-17l0wfn"><button type="button" class="tool svelte-dvnwrf"><span class="glyph svelte-1ecfycl" data-glyph="add" aria-hidden="true"></span> <span class="label">Add</span></button></span></div>  </div>
```

Each line matches what the brief's "Unchanged tree" says for that case. No case was handed back.

The case-run program, removed before this report. `.agents/scratch/cases.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [sveltekit()],
    test: { include: ['.agents/scratch/o179.case.ts'], environment: 'node' }
});
```

`.agents/scratch/o179.case.ts`:

```ts
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { it } from 'vitest';
import FieldControl from '../../src/lib/views/system/workbench/editors/FieldControl.svelte';
import { clientContext, emptyClient } from '../../tests/fixtures/client.ts';
import { installRealText } from '../../tests/views/shared/real-text.ts';

installRealText();

const BASE = '.agents/scratch/base';
const lists = { config: {}, glyphs: [], hues: [] } as never;

type Case = { name: string; spec: Record<string, unknown>; value: unknown };

const CASES: Case[] = [
    { name: 'empty_undefined', spec: { control: 'list', empty: true }, value: undefined },
    { name: 'empty_held', spec: { control: 'list', empty: true }, value: [] },
    { name: 'empty_one_item', spec: { control: 'list', empty: true }, value: ['url'] },
    { name: 'plain_undefined', spec: { control: 'list' }, value: undefined },
    { name: 'plain_held', spec: { control: 'list' }, value: [] },
    { name: 'parked_held', spec: { control: 'parked', empty: true }, value: [] }
];

function markup(one: Case): string {
    const { body } = render(FieldControl, {
        context: clientContext(emptyClient()),
        props: { spec: one.spec, value: one.value, label: 'Field', lists, onpick: () => {} } as never
    });
    return body.replace(/<!--[^>]*-->/g, '');
}

function words(html: string): string {
    const said = (word: string): string => `${word}=${html.includes(`>${word}<`) ? 'yes' : 'no'}`;
    const boxes = (html.match(/class="item\b/g) ?? []).length;
    return [said('Not set'), said('Empty list'), said('Clear'), said('Add'), `items=${boxes}`].join(' ');
}

it('prints every case', () => {
    mkdirSync(BASE, { recursive: true });
    const lines: string[] = [];
    for (const one of CASES) {
        const html = markup(one);
        const file = `${BASE}/${one.name}.html`;
        if (!existsSync(file)) writeFileSync(file, html);
        const same = readFileSync(file, 'utf8') === html ? 'same-as-first-run' : 'differs-from-first-run';
        const sum = createHash('sha256').update(html).digest('hex').slice(0, 12);
        lines.push(`${one.name}: ${words(html)} bytes=${html.length} sha=${sum} ${same}`);
    }
    process.stdout.write(`\n${lines.join('\n')}\n`);
    process.stdout.write(`\nplain_undefined markup: ${markup(CASES[3])}\n`);
});
```

The markup is compared with Svelte's comment markers taken out, as `tests/shell/rail/schedule-dialog.test.ts` does (`body.replace(/<!--[^>]*-->/g, '')`). Those markers are not compared.

## DONE / NOT DONE

| Deliverable or check | State | Command and its output |
| --- | --- | --- |
| Item 1, absent key draws `Not set` and Add, no `Empty list`, no `Clear` | DONE | cases program, final run: `empty_undefined: Not set=yes Empty list=no Clear=no Add=yes items=0 bytes=397 sha=6ef22ced9061 differs-from-first-run` |
| Item 1, held empty draws `Empty list`, `Clear` and Add, no `Not set` | DONE | `empty_held: Not set=no Empty list=yes Clear=yes Add=yes items=0 bytes=531 sha=62b5451cd918 differs-from-first-run` |
| Item 1, one item draws one box and Add, no note, no button | DONE | `empty_one_item: Not set=no Empty list=no Clear=no Add=yes items=1 bytes=1443 sha=9db38e632856 same-as-first-run` |
| Item 1, spec without `empty`, value undefined, byte for byte | DONE | `plain_undefined: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run` |
| Item 1, spec without `empty`, value `[]`, byte for byte | DONE | `plain_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run` |
| Item 1, `parked` with `empty`, value `[]`, none of the three words | DONE | `parked_held: Not set=no Empty list=no Clear=no Add=yes items=0 bytes=312 sha=8198d7a5cc16 same-as-first-run` |
| Item 1, Clear calls `onpick(undefined)` | DONE, by reading; the press is seen at the look on landing | `FieldControl.svelte:425` passes `onclear={heldEmpty ? () => onpick(undefined) : undefined}`; `InlineItems.svelte:86` draws `<ToolButton label={t('settings.list_clear')} onclick={onclear} />` |
| Item 1, removing the last item hands `onpick([])`, the held empty state | DONE, by reading; seen at the look on landing | `InlineItems.svelte:78` `onclick={() => onpick(items.filter((_, place) => place !== at))}`; `draft.ts:270` keeps `[]` as the value and takes the field out for undefined |
| Item 2, the words | DONE | `config/text/views/system/workbench.yml:93-94`, `list_empty: Empty list` and `list_clear: Clear`; `grep -rn --exclude=local.yml -E "list_empty\|list_clear" config` prints those two lines and the unrelated `config/text/server.yml:310` |
| Item 3, the comments | DONE | read in the diff, listed under "Comments and documents re-read" |
| Verify 1, `npm run test:quick` | NOT DONE: red, in a file this step does not change | Last lines: `test:quick: 63.4 s; failed: vitest checks`, with `Test Files  1 failed \| 11 passed (12)`, `Tests  2 failed \| 106 passed (108)`. The only failed task is vitest checks, so prettier, eslint, svelte-check and the ASCII gate passed. |
| Verify 1, the red file run alone | Run, still red | `npx vitest run tests/checks/source/keys.test.ts --reporter=dot`: `Test Files  1 failed (1)`, `Tests  2 failed \| 9 passed (11)`. Named below. |
| Verify 2, `npx vitest run tests/checks/config --reporter=dot` | DONE | `Test Files  5 passed (5)`, `Tests  117 passed \| 9 skipped (126)` |
| Verify 3, the cases' program | DONE | the rows above; `Test Files  1 passed (1)`, `Tests  1 passed (1)` |
| Verify 4, the ASCII gate over the changed files | DONE | the gate's `perl` command over the five changed files printed nothing |
| Verify 5, `sh utils/unused-exports.sh` against `../O179-base/unused-exports.txt` | DONE | `diff` exit 0, 335 lines each, no added line |

The red tests, from the run alone:

- `tests/checks/source/keys.test.ts > text keys > uses literals except at the documented computed prefixes`: `"lib/server/content/audit/publications.ts: sentence("` twice.
- `tests/checks/source/keys.test.ts > text keys > has a reader for every catalog key`: `audit.msg_site_differs`, `audit.msg_site_differs_whole`, `audit.msg_site_differs_no_cv`, `audit.msg_site_differs_whole_no_cv`.

Those four keys are read at `src/lib/server/content/audit/publications.ts:138-143` and declared at `config/text/views/system/audit.yml:59-62`. `diff ../O179-base/src/lib/server/content/audit/publications.ts src/lib/server/content/audit/publications.ts` prints nothing, and no file of this step holds those keys or that call. Whether the base tree fails the same way is not verified by a run: the base copy has no `node_modules`.

`npm run test:quick` ran once, right after `npm run diagrams`, with the paths of the five changed files as arguments. No whole-suite command ran. `npm run diagrams` changed no tracked file (`git status --short` lists only the five files below).

## Files changed

`git diff --stat` and `diff -rq` against the base copy over `src`, `config`, `tests` and `utils` give the same five paths, all on the write list:

| File | Lines |
| --- | --- |
| `config/options/appearance.yml` | 1 changed |
| `config/text/views/system/workbench.yml` | 2 added |
| `src/lib/data/sources/config/catalog/options.ts` | 28 changed lines in the diff stat, 869 lines in the file |
| `src/lib/views/system/workbench/editors/FieldControl.svelte` | 20 added, 495 lines in the file |
| `src/lib/views/system/workbench/editors/InlineItems.svelte` | 33 in the diff stat, 123 lines in the file |

Plus this report. `.agents/scratch` and `.agents/worktrees/tmp-O179` are removed (`ls -a .agents` shows `plan.yaml` alone; `ls -d ../tmp-O179` says no such file).

## Host- or user-visible changes, before and after

The look on landing, in the Settings view, on `website.cv_sections`, field `record_fields` of a row (the one `control: list` field carrying `empty:`, read with a walk of `config/options/*.yml`):

| State to put it in | Before | After |
| --- | --- | --- |
| A row whose record does not hold `record_fields` | Add alone | The words `Not set`, small and muted, above the Add; no Clear |
| A row holding `record_fields: []`, or a list whose last item was just removed | Add alone, the same as the row above | The words `Empty list` with a text button `Clear` beside them, above the Add |
| Press `Clear` on that row | not available | The key is out of the record and the row draws `Not set`; Save leaves the key out |
| A row holding one or more items | Item boxes and Add | The same, with no note and no button |
| Any other `list` field, and a `parked` field | Item boxes or nothing, and Add | The same (`plain_*` and `parked_held` cases above) |

Tab order gains the one Clear button while it is drawn, before the Add. New words: `settings.list_empty`, `settings.list_clear`; the brief names both.

## Comments and documents re-read

| Text | State |
| --- | --- |
| Head comment of `FieldControl.svelte` | rewritten: a new paragraph says what `empty` does on a list |
| `FieldControl.svelte:17`, `onpick` takes undefined for a field taken out of its record | still true |
| Doc comments of the props and functions touched in `FieldControl.svelte` | still true; the three new `$derived` have their own |
| Head comment of `InlineItems.svelte` | rewritten |
| Prop doc comments of `InlineItems.svelte` | two added for `note` and `onclear` |
| `src/lib/data/sources/config/catalog/options.ts:78-98`, the doc comment of `FieldSpec` | rewritten and rewrapped as a whole paragraph at 100 columns |
| `config/options/appearance.yml:11` | rewritten |
| `src/lib/state/system/config/editors/draft.ts:17-18`, a field the record does not hold is left out on Save | still true |
| `config/options/behavior.yml:158`, help of `record_fields` | still true |
| `docs/templates.md:330`, nothing for an empty list | still true |
| `docs/HELP.md`, `docs/data-map.md`, `docs/decks.md`, `README.md` | `grep -rn -E "Not set\|Empty list\|empty list" docs README.md` and `grep -n "InlineItems\|FieldControl" -r docs README.md` find no sentence about this control |

The name grep, `grep -rn --exclude=local.yml -E "tellsEmpty|heldEmpty|emptyListNote|list_empty|list_clear|onclear" src tests config docs README.md`: the new names appear only at `FieldControl.svelte:205-213,424-425`, `InlineItems.svelte:7,27,30,85-86` and `workbench.yml:93-94`. The other hits are `onclear` props of `CloseQuestions`, `FolderLine`, `WorkbenchMenu`, `Pages`, `Workbenches`, `SessionList`, `Repositories`, `Problems` and `Query`, and `server.edit.list_empty` (`why.ts:32`, `server.yml:310`, a refusal of manifest list edits at `entry-edit/merge.ts:349`), which are unrelated to this control. No helper, type or schema is added; the props join the existing `Props` of `InlineItems`, and `onclear` is the name the tree already uses for such a prop.

The history-word grep over the added lines, `git diff -U0 -- src config | grep '^+' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package"`, prints nothing.

No line of `src/lib/views/system/workbench/editors/FieldControl.svelte`, `InlineItems.svelte` or `options.ts` passes 100 columns (`awk 'length > 100'` prints nothing).

## Edits to existing tests

None. This step adds or changes no test, and no allow list or predicate.

## Judgment calls the orchestrator may reverse

1. The note and the Clear sit in the `{:else}` of `InlineItems`'s `{#each}`. They can only draw with no item, and a list with no note gives the same markup as on the tree, which an `{#if}` placed between the `{#each}` and the Add would not, since it adds a space.
2. Held empty is `Array.isArray(value) && value.length === 0`, as the brief writes it, rather than `wordsOf(value).length === 0`, so an array of non-text entries is not called empty.
3. A list field whose value is a string, such as `''`, is neither state: it draws as on the tree, with no note.
4. A spec with `empty: <words>` on a list behaves as `empty: true`, and its words are drawn nowhere. The doc comment and `appearance.yml` say so. No field of `config/options` does this.
5. Clear is a `ToolButton` with its label as text and no glyph. Clear changes the draft and asks no confirmation, like Remove on an item.
6. `npm run test:quick` and the cases' program ran with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/worktrees/tmp-O179`, as the launch instructions require. `agents/spec.md` says the list runs with `TMPDIR` unset; the launch instructions name no such exception, and the permission system refused the run with `TMPDIR` unset.

## Limitations

- What a press does, and how the note and Clear look, are checked by reading and at the look on landing; a builder opens no page.
- The byte-for-byte comparison leaves out Svelte's comment markers, per the method the brief points at.
- The red `tests/checks/source/keys.test.ts` stays red in this worktree. The step changes no file it names.

## Repair round 1

All four findings are closed. `npm run test:quick` is still red, and none of its red tests is in a file this step changes; the rows are below. The open items of the state file hold no entry (`sed -n 174,181p .scratch/migration/orchestrator-state.md`).

**Correction to the section above.** The line "`npm run test:quick` ran once ... with the paths of the five changed files as arguments" is wrong as to its effect. zsh passed the five paths as one argument, so that run covered 12 test files and 108 tests. The figures in the first DONE table are from that narrower run. The run below is the one with five separate paths: `test:quick: 5 changed file(s), from the given paths` and `test:quick: 75 test file(s)`.

### Findings

| Finding | What changed | File and line |
| --- | --- | --- |
| S1 | Both sentences now say the behaviour holds for "a list field of a record, drawn by a family card" | `src/lib/data/sources/config/catalog/options.ts:84-85`, `config/options/appearance.yml:11` |
| S2 | Both paragraphs rewrapped to 100 columns | `FieldControl.svelte:29-30`, `options.ts:84-98` |
| B1 | A press of Clear focuses the Add of the same list, then calls `onclear`. The Add stays drawn, so the focus never falls to the body. Removing the last item is unchanged | `InlineItems.svelte:33` (`box`), `36-39` (`clear`), `53` (`bind:this`), `95` (`onclick={clear}`); head comment at `2-9` says so |
| B2 | `list_clear: 'Clear {0}'`, read as `t('settings.list_clear', label)` | `config/text/views/system/workbench.yml:94`, `InlineItems.svelte:95` |

### Checks, after the last change

Cases program, same six cases as above with the check for the label added and the first run's shas held as constants, `npx vitest run --config .agents/scratch/cases.config.ts --root . --reporter=dot` (`Test Files  1 passed (1)`):

```
empty_undefined: Not set=yes Empty list=no Clear=no >Clear Field<=no >Add<=yes items=0 bytes=397 sha=6ef22ced9061
empty_held: Not set=no Empty list=yes Clear=yes >Clear Field<=yes >Add<=yes items=0 bytes=537 sha=6b57b9bed7c5
empty_one_item: Not set=no Empty list=no Clear=no >Clear Field<=no >Add<=yes items=1 bytes=1443 sha=9db38e632856 same-as-first-run
plain_undefined: Not set=no Empty list=no Clear=no >Clear Field<=no >Add<=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run
plain_held: Not set=no Empty list=no Clear=no >Clear Field<=no >Add<=yes items=0 bytes=310 sha=59df985b4067 same-as-first-run
parked_held: Not set=no Empty list=no Clear=no >Clear Field<=no >Add<=yes items=0 bytes=312 sha=8198d7a5cc16 same-as-first-run
```

`>Clear Field<` is `Clear` followed by the label given to the render. The markup is compared with Svelte's comment markers taken out, as above.

| Check | State | Output |
| --- | --- | --- |
| `npm run test:quick` with the five paths | NOT DONE: red, in files this step does not change | `test:quick: 219.7 s; failed: vitest, vitest checks, vitest slow`. The other tasks print `ok`: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check (`0 ERRORS 0 WARNINGS`) |
| `npx vitest run tests/checks/config --reporter=dot` | DONE | `Test Files  5 passed (5)`, `Tests  117 passed \| 9 skipped (126)` |
| ASCII gate over the five files | DONE | prints nothing, exit 0 |
| `sh utils/unused-exports.sh` against `../O179-base/unused-exports.txt` | DONE | `diff` exit 0, 335 lines |
| History-word grep over the added lines | DONE | prints nothing |
| `awk 'length > 100'` over the three source files | DONE | prints nothing |

The red tests of that run:

| File | Tests | In the list run | Run alone |
| --- | --- | --- | --- |
| `tests/checks/source/keys.test.ts` | 2 | the known red over `audit.msg_site_differs*` and the `sentence(` calls of `publications.ts`, which the round brief names as not this step's | not rerun, as the round brief says |
| `tests/data/hubs/hub-portfolio.test.ts` | 2 | `Test timed out in 20000ms` | not run: the round brief says not to touch it |
| `tests/data/hubs/workspace-projects.test.ts` | 2 | `Test timed out in 5000ms` | `Tests  5 passed (5)` |
| `tests/routes/docs/primary-key.test.ts` | 1 | `Test timed out in 5000ms` | `Tests  7 passed (7)` |
| `tests/state/system/settings/editor-saved.test.ts` | 1 | `glyph not in config/catalogs/glyphs.yml: more` | `Tests  11 passed (11)` |

The step changes none of these test files. Why `editor-saved.test.ts` fails in the list run and passes alone is not verified; the step adds no glyph and no glyph lookup.

`npm run test:quick` ran twice in this round, each right after `npm run diagrams`: once with the five paths as one argument, whose output is not used, and once as above. No whole-suite command ran. `.agents/scratch` and `.agents/worktrees/tmp-O179` are removed (`ls -a .agents` shows `plan.yaml` alone; `ls -d ../tmp-O179` says no such file).

### Before and after, changed by this round

| View and state | Before the round | After the round |
| --- | --- | --- |
| Settings, `website.cv_sections`, a row with `record_fields: []`: the words on the button | `Clear` | `Clear Entry 1, record_fields` for the first row, since `Cards.svelte:216-221` builds the label from the entry's place and the field's name |
| Press Clear by keyboard on that row | not specified | The focus is on the Add of that list, and the row draws `Not set` |

The focus move is read in the diff and seen at the look on landing.

### Decision the orchestrator may reverse

The round asks that the accessible name carry the field, and `ToolButton` draws `label` as its visible words, so the visible words carry the field as well. Keeping the visible word `Clear` with the longer accessible name would take a `ToolButton` child snippet and a second catalog key, which the round does not name. The look on landing shows whether the longer words fit the row.

Edits to existing tests, allow lists and predicates in this round: none. This round adds or changes no test.
