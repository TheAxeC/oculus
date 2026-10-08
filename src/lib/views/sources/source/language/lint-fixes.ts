// Layer 3, view partial of Source.svelte. What the editor offers for a linter's finding: the
// linter's own fix as the preferred Quick Fix, a comment that disables the rule for the line (and
// for the whole file in ESLint), and Show documentation for the code. Each is one undoable edit of
// the tab's text and writes nothing to disk. A disable comment is merged into a suppression comment
// of its kind already on the line or above it (`# noqa: E501` becomes `# noqa: E501, F401`), and is
// not offered where the rule is already disabled.
//
// The rows are the linter's findings of the file on disk, so a fix is offered only while the tab
// holds exactly that text: the tab has no unsaved edit and its disk hash is the hash the rows were
// read from. A fix whose range is not inside the text is not offered either. The provider is
// registered for every language and answers for this editor's model alone.
//
// `Fix All Auto-fixable Problems` applies the linter's fixes that do not overlap as one undo step.
// The palette lists it as the tab's action (`lintActions`), which asks the editor through the lint
// store; this extension is what the editor registers there.

import type * as Monaco from 'monaco-editor';
import {
    LINT_IDS,
    type LintEdit,
    type LintFix,
    type LintId,
    webAddress
} from '$lib/state/system/machine/lint/lint-model';
import type { ClientState } from '$lib/state/client/context';
import { t } from '$lib/state/shared/words/text';
import { chktexFixTitle, lintName } from '$lib/state/system/machine/lint/lint-words';
import { lintOwner } from '$lib/state/system/problem-sources';
import { problemKey, type Problem } from '$lib/state/system/problems.svelte';
import type { EditorExtension, EditorOwnAction } from '$lib/ui/controls/editor/types';
import { rowRange } from './problem-marks.svelte';

/** The command the Show documentation action runs with the page's address. */
const DOCUMENTATION_COMMAND = 'oculus.lint.documentation';

/** A row with the linter it came from. */
type Found = { linter: LintId; row: Problem };

/** One edit as the text it replaces and the text that replaces it. */
type Change = { range: Monaco.IRange; text: string };

/** The linters' rows of a file, each with its linter. */
function lintRows(client: ClientState, file: { root: string; path: string }): Found[] {
    const place = client.lint.keyOf(file.root, file.path);
    if (place === null) return [];
    const key = problemKey(place.root, place.path);
    const held = client.problems.fold().files.find((one) => one.key === key);
    return (held?.rows ?? []).flatMap((row): Found[] => {
        const linter = LINT_IDS.find((id) => lintOwner(id) === row.owner);
        return linter === undefined ? [] : [{ linter, row }];
    });
}

/** Whether the tab holds the text the linter's rows were read from. */
function fresh(
    client: ClientState,
    instance: string,
    file: { root: string; path: string },
    linter: LintId
): boolean {
    const draft = client.source.sourceDraft(instance);
    return (
        draft.loaded &&
        draft.text === draft.saved &&
        client.lint.hashOf(file.root, file.path, linter) === draft.base
    );
}

function rangeOf(edit: LintEdit): Monaco.IRange {
    return {
        startLineNumber: edit.line,
        startColumn: edit.column,
        endLineNumber: edit.endLine,
        endColumn: edit.endColumn
    };
}

/** Whether a range is inside the model's text as it is. */
function inside(model: Monaco.editor.ITextModel, range: Monaco.IRange): boolean {
    const valid = model.validateRange(range);
    return (
        valid.startLineNumber === range.startLineNumber &&
        valid.startColumn === range.startColumn &&
        valid.endLineNumber === range.endLineNumber &&
        valid.endColumn === range.endColumn
    );
}

/** The text before the first non-blank character of a line. */
function indentOf(line: string): string {
    return /^\s*/.exec(line)?.[0] ?? '';
}

/** An insertion of `text` at a place. */
function insertion(line: number, column: number, text: string): Change {
    return {
        range: {
            startLineNumber: line,
            startColumn: column,
            endLineNumber: line,
            endColumn: column
        },
        text
    };
}

/** The line a ruff `# noqa` comment for the row goes on, and the comment to add or extend. */
function ruffDisable(model: Monaco.editor.ITextModel, found: Problem, code: string): Change | null {
    const line = Math.min(found.noqa ?? found.line, model.getLineCount());
    const text = model.getLineContent(line);
    const existing = /#\s*noqa(?::[ \t]*([A-Za-z0-9]+(?:[ \t]*,?[ \t]*[A-Za-z0-9]+)*))?/i.exec(
        text
    );
    if (existing === null) return insertion(line, text.length + 1, `  # noqa: ${code}`);
    const listed = existing.at(1);
    if (listed === undefined) return null;
    if (listed.split(/[\s,]+/).includes(code)) return null;
    return insertion(line, existing.index + existing[0].length + 1, `, ${code}`);
}

/** Which part of a Svelte file a line is in: its script, its style, or its markup. */
function svelteBlock(model: Monaco.editor.ITextModel, line: number): 'script' | 'style' | 'markup' {
    let block: 'script' | 'style' | null = null;
    for (let at = 1; at <= line; at += 1) {
        let text = model.getLineContent(at);
        for (;;) {
            const open = block === null ? /<(script|style)\b[^>]*>/.exec(text) : null;
            const close = block === null ? null : new RegExp(`</${block}>`).exec(text);
            if (block === null && open !== null) {
                block = open[1] as 'script' | 'style';
                text = text.slice(open.index + open[0].length);
            } else if (block !== null && close !== null) {
                if (at === line && close.index > 0) return block;
                block = null;
                text = text.slice(close.index + close[0].length);
            } else break;
        }
    }
    return block ?? 'markup';
}

/** An ESLint comment that disables `rule` for the next line, extended when one is above. */
function eslintDisableLine(
    model: Monaco.editor.ITextModel,
    found: Problem,
    rule: string,
    svelte: boolean
): Change | null {
    const markup = svelte && svelteBlock(model, found.line) === 'markup';
    if (svelte && svelteBlock(model, found.line) === 'style') return null;
    const above = found.line > 1 ? model.getLineContent(found.line - 1) : '';
    const merge = markup
        ? /^\s*<!--\s*eslint-disable-next-line\s+(.*?)\s*-->\s*$/.exec(above)
        : /^\s*\/\/\s*eslint-disable-next-line\s+(.*?)\s*$/.exec(above);
    if (merge !== null) {
        const rules = merge[1].split(/\s+--\s+/, 1)[0];
        if (rules.split(/\s*,\s*/).includes(rule)) return null;
        const start = above.indexOf(rules, above.indexOf('eslint-disable-next-line'));
        return insertion(found.line - 1, start + rules.length + 1, `, ${rule}`);
    }
    const indent = indentOf(model.getLineContent(found.line));
    const comment = markup
        ? `<!-- eslint-disable-next-line ${rule} -->`
        : `// eslint-disable-next-line ${rule}`;
    return insertion(found.line, 1, `${indent}${comment}\n`);
}

/** An ESLint comment that disables `rule` for the whole file, extended when one is at the top. */
function eslintDisableFile(
    model: Monaco.editor.ITextModel,
    rule: string,
    svelte: boolean
): Change | null {
    const shebang = model.getLineContent(1).startsWith('#!') ? 1 : 0;
    const top = model.getLineCount() > shebang ? model.getLineContent(shebang + 1) : '';
    const merge = svelte
        ? /^\s*<!--\s*eslint-disable\s+(.*?)\s*-->\s*$/.exec(top)
        : /^\s*\/\*\s*eslint-disable\s+(.*?)\s*\*\/\s*$/.exec(top);
    if (merge !== null) {
        if (merge[1].split(/\s*,\s*/).includes(rule)) return null;
        const start = top.indexOf(merge[1], top.indexOf('eslint-disable'));
        return insertion(shebang + 1, start + merge[1].length + 1, `, ${rule}`);
    }
    const comment = svelte ? `<!-- eslint-disable ${rule} -->` : `/* eslint-disable ${rule} */`;
    return insertion(shebang + 1, 1, `${comment}\n`);
}

/** A ShellCheck directive above the first line of the command the row is in. */
function shellcheckDisable(
    model: Monaco.editor.ITextModel,
    found: Problem,
    code: string
): Change | null {
    let first = found.line;
    while (first > 1 && /\\$/.test(model.getLineContent(first - 1))) first -= 1;
    if (first === 1 && model.getLineContent(1).startsWith('#!')) {
        return insertion(2, 1, `# shellcheck disable=${code}\n`);
    }
    const above = first > 1 ? model.getLineContent(first - 1) : '';
    const merge = /^\s*#\s*shellcheck\s+disable=([A-Za-z0-9,]+)\s*$/.exec(above);
    if (merge !== null) {
        if (merge[1].split(',').includes(code)) return null;
        return insertion(first - 1, above.trimEnd().length + 1, `,${code}`);
    }
    const indent = indentOf(model.getLineContent(first));
    return insertion(first, 1, `${indent}# shellcheck disable=${code}\n`);
}

/** A ChkTeX `% chktex <number>` comment at the end of the row's line. */
function chktexDisable(
    model: Monaco.editor.ITextModel,
    found: Problem,
    code: string
): Change | null {
    const text = model.getLineContent(found.line);
    const existing = /%\s*chktex\s+\d+(?:\s+chktex\s+\d+)*/.exec(text);
    if (existing !== null) {
        const numbers = [...existing[0].matchAll(/chktex\s+(\d+)/g)].map((one) => one[1]);
        if (numbers.includes(code)) return null;
        return insertion(found.line, existing.index + existing[0].length + 1, ` chktex ${code}`);
    }
    const end = text.length + 1;
    return insertion(
        found.line,
        end,
        /(?<!\\)%/.test(text) ? ` chktex ${code}` : `  % chktex ${code}`
    );
}

/** The edit that disables the row's rule for its line, or null where it cannot be. */
function disableLine(
    model: Monaco.editor.ITextModel,
    { linter, row }: Found,
    code: string
): Change | null {
    if (linter === 'ruff') return ruffDisable(model, row, code);
    if (linter === 'eslint') {
        return eslintDisableLine(model, row, code, model.getLanguageId() === 'svelte');
    }
    return linter === 'shellcheck'
        ? shellcheckDisable(model, row, code)
        : chktexDisable(model, row, code);
}

/** The title of a linter's fix, in the linter's words where it has them. */
function titleOf(linter: LintId, fix: LintFix, code: string): string {
    if (fix.title !== '') return fix.title;
    if (linter === 'chktex') return chktexFixTitle(Number(code));
    if (linter === 'eslint') return t('lint.fix_rule', code);
    return linter === 'shellcheck' ? t('lint.fix_shellcheck', code) : t('lint.fix_code', code);
}

/** The edits of a fix as changes, or null when one of them is not inside the text. */
function changesOf(model: Monaco.editor.ITextModel, fix: LintFix): Change[] | null {
    const changes = fix.edits.map((edit) => ({ range: rangeOf(edit), text: edit.text }));
    return changes.every((change) => inside(model, change.range)) ? changes : null;
}

/** The workspace edit that makes the changes in the model as it is now. */
function editOf(
    model: Monaco.editor.ITextModel,
    changes: Change[]
): Monaco.languages.WorkspaceEdit {
    return {
        edits: changes.map((change) => ({
            resource: model.uri,
            versionId: model.getVersionId(),
            textEdit: { range: change.range, text: change.text }
        }))
    };
}

/** The quick fixes, the disable comments and the documentation link for the rows under a range. */
function actionsFor(
    monaco: typeof Monaco,
    model: Monaco.editor.ITextModel,
    found: Found[],
    range: Monaco.Range
): Monaco.languages.CodeAction[] {
    const actions: Monaco.languages.CodeAction[] = [];
    const fileRules = new Set<string>();
    for (const one of found) {
        if (!monaco.Range.areIntersectingOrTouching(range, rowRange(model, one.row))) continue;
        const code = one.row.code;
        if (code === undefined) continue;
        one.row.fixes?.forEach((fix, at) => {
            const changes = changesOf(model, fix);
            if (changes === null) return;
            actions.push({
                title: titleOf(one.linter, fix, code),
                kind: 'quickfix',
                isPreferred: fix.kind === 'fix' && at === 0,
                edit: editOf(model, changes)
            });
        });
        const line = disableLine(model, one, code);
        if (line !== null) {
            actions.push({
                title: t('lint.disable_line', code),
                kind: 'quickfix',
                edit: editOf(model, [line])
            });
        }
        if (one.linter === 'eslint' && !fileRules.has(code)) {
            fileRules.add(code);
            const file = eslintDisableFile(model, code, model.getLanguageId() === 'svelte');
            if (file !== null) {
                actions.push({
                    title: t('lint.disable_file', code),
                    kind: 'quickfix',
                    edit: editOf(model, [file])
                });
            }
        }
        const address = webAddress(one.row.href);
        if (address !== null) {
            actions.push({
                title: t('lint.documentation', code),
                kind: 'quickfix',
                command: {
                    id: DOCUMENTATION_COMMAND,
                    title: t('lint.documentation', code),
                    arguments: [address]
                }
            });
        }
    }
    return actions;
}

/** The extension that offers a file's linter fixes and takes Fix All for its tab. */
export function lintFixes(
    client: ClientState,
    instance: string,
    file: { root: string; path: string }
): EditorExtension {
    return (kit, editor, model) => {
        const { monaco } = kit;
        const fixAll = (linter: LintId): void => {
            if (!fresh(client, instance, file, linter)) return;
            const accepted: Monaco.IRange[] = [];
            const changes: Change[] = [];
            for (const one of lintRows(client, file)) {
                const fix =
                    one.linter === linter
                        ? one.row.fixes?.find((f) => f.kind === 'fix')
                        : undefined;
                const made = fix === undefined ? null : changesOf(model, fix);
                if (made === null) continue;
                const ranges = made.map((change) => change.range);
                const overlaps = ranges.some((range) =>
                    accepted.some((held) => monaco.Range.areIntersecting(held, range))
                );
                if (overlaps) continue;
                accepted.push(...ranges);
                changes.push(...made);
            }
            if (changes.length === 0) return;
            editor.pushUndoStop();
            editor.executeEdits('oculus.lint', changes);
            editor.pushUndoStop();
        };
        const owned = [
            monaco.editor.registerCommand(DOCUMENTATION_COMMAND, (_accessor, href: unknown) => {
                const address = webAddress(href);
                if (address !== null) window.open(address, '_blank', 'noopener,noreferrer');
            }),
            monaco.languages.registerCodeActionProvider(
                '*',
                {
                    provideCodeActions: (target, range) => {
                        const found =
                            target === model
                                ? lintRows(client, file).filter((one) =>
                                      fresh(client, instance, file, one.linter)
                                  )
                                : [];
                        return {
                            actions: actionsFor(monaco, model, found, monaco.Range.lift(range)),
                            dispose: () => undefined
                        };
                    }
                },
                { providedCodeActionKinds: ['quickfix'] }
            ),
            { dispose: client.lint.registerFixer(instance, fixAll) }
        ];
        return () => {
            for (const one of owned) one.dispose();
        };
    };
}

/**
 * The tab's linter actions: Run Again for the linters that take the file, and a Fix All for each
 * linter that has answered ok, listed by the palette in the linter's name and runnable while the
 * tab holds the text the findings were read from and they hold a fix.
 */
export function lintActions(
    client: ClientState,
    instance: string,
    file: { root: string; path: string }
): EditorOwnAction[] {
    if (client.lint.keyOf(file.root, file.path) === null) return [];
    const statuses = client.lint.statuses(file.root, file.path);
    const rows = lintRows(client, file);
    return [
        {
            id: 'oculus.lint.rerun',
            label: t('source.cmd_lint_rerun'),
            run: () => client.lint.rerun(file.root, file.path)
        },
        ...statuses
            .filter((one) => one.status.state === 'ok')
            .map(({ linter }) => ({
                id: `oculus.lint.fix_all.${linter}`,
                label: t('source.cmd_lint_fix_all', lintName(linter)),
                disabled:
                    !fresh(client, instance, file, linter) ||
                    !rows.some(
                        (one) =>
                            one.linter === linter &&
                            one.row.fixes?.some((fix) => fix.kind === 'fix')
                    ),
                run: () => client.lint.fixAll(instance, linter)
            }))
    ];
}
