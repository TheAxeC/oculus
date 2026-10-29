// Layer 2, server. The four readers of what a linter writes, each into rows in the editor's places
// (text.ts) with VS Code's severities, sources' codes and the page that documents the rule.
//
// ChkTeX prints text: one line per warning, `line:column:length:kind:number:message`, its column
// counted in bytes with a tab as the width `TabSize` of its rc file (8 by default), converted to
// characters as LaTeX Workshop converts it. ruff, ESLint and ShellCheck print JSON, read through a
// zod schema; ruff and ShellCheck count columns in code points and ESLint addresses a fix by
// offsets into the text without its byte order mark and breaks lines at U+2028 and U+2029 too. A
// reader answers null for an output it cannot read, and the route words that as a failed run.
//
// Severity is VS Code's: ChkTeX `Error` an error, `Warning` a warning, `Message` an info; ruff
// `F821`, `E902` and a syntax error an error and every other rule a warning; ESLint 2 an error, 1 a
// warning and a fatal message an error; ShellCheck `error` an error, `warning` a warning and `info`
// and `style` an info. A row with no rule (a ruff syntax error, an ESLint parse error) has no code,
// no documentation and no fix. A documentation address a linter names is kept only when it is an
// `http:` or `https:` address (`webAddress`), since the page opens it; ShellCheck names none, and
// its rows' address is the primary hub's `shellcheck` row of `links`.

import { z } from 'zod';
import { webAddress } from '../../../../data/places/hub-address.ts';
import type { LinkRow } from '../../../../data/sources/config/settings/rows/grammar.ts';
import { linkAddress } from '../../../../data/sources/config/settings/rows/links.ts';
import { CHKTEX_FIXABLE } from '../../../../data/model/index.ts';
import type { LintEdit, LintFix, LintRow } from '../../../../data/model/index.ts';
import { chktexFix } from './chktex-fixes.ts';
import { lineStarts, linesOf, pointAt, utf16Column, withoutMark } from './text.ts';

/** A file's text as the readers need it: whole, by line, and the offset each line starts at. */
export type Source = { text: string; lines: string[]; starts: number[] };

/** The text of a file as the editor holds it, without a byte order mark. */
export function sourceOf(content: string): Source {
    const text = withoutMark(content);
    return { text, lines: linesOf(text), starts: lineStarts(text) };
}

/** The bytes a character takes in UTF-8. */
function utf8Size(code: number): number {
    if (code < 0x80) return 1;
    if (code < 0x800) return 2;
    return code < 0x10000 ? 3 : 4;
}

/**
 * A ChkTeX column, counted in bytes with a tab as `tabSize` columns, as the column of the line's
 * characters in UTF-16 units, both from one.
 */
function convertColumn(column: number, line: string, tabSize: number): number {
    const target = column - 1;
    let position = 0;
    let at = 0;
    while (at < line.length && position < target) {
        const code = line.codePointAt(at) ?? 0;
        position += code === 9 ? tabSize : utf8Size(code);
        at += code > 0xffff ? 2 : 1;
    }
    return at + 1;
}

const CHKTEX_LINE = /^(\d+):(\d+):(\d+):([A-Za-z]+):(\d+):(.*)$/;

const CHKTEX_SEVERITY: Record<string, LintRow['severity']> = {
    Error: 'error',
    Warning: 'warning',
    Message: 'info'
};

/**
 * ChkTeX's rows for a file. `lines` of the output that are not a warning are left out; an output
 * with text and no warning in it is unreadable. A file that starts with a byte order mark gives
 * ChkTeX a first line three bytes longer than the editor's.
 */
export function readChktex(
    stdout: string,
    file: Source,
    tabSize: number,
    marked: boolean
): LintRow[] | null {
    const rows: LintRow[] = [];
    let seen = 0;
    for (const printed of stdout.split('\n')) {
        const found = CHKTEX_LINE.exec(printed);
        if (found === null) continue;
        seen += 1;
        const line = Number(found[1]);
        const text = file.lines[line - 1] ?? '';
        const shown = marked && line === 1 ? `\uFEFF${text}` : text;
        const converted = convertColumn(Number(found[2]), shown, tabSize);
        const column = marked && line === 1 ? Math.max(1, converted - 1) : converted;
        const number = Number(found[5]);
        const range = { line, column, endLine: line, endColumn: column + Number(found[3]) };
        const edits = CHKTEX_FIXABLE.some((one) => one === number)
            ? chktexFix(number, range, found[6], file)
            : null;
        rows.push({
            ...range,
            severity: CHKTEX_SEVERITY[found[4]] ?? 'warning',
            message: found[6],
            code: String(number),
            fixes: edits === null ? [] : [{ kind: 'fix', title: '', edits }]
        });
    }
    return seen === 0 && stdout.trim() !== '' ? null : rows;
}

const point = z.object({ row: z.number().int().min(1), column: z.number().int().min(1) });

const ruffRows = z.array(
    z.object({
        code: z.string().nullable(),
        message: z.string(),
        location: point,
        end_location: point,
        fix: z
            .object({
                applicability: z.string(),
                message: z.string().nullable().optional(),
                edits: z.array(
                    z.object({ content: z.string(), location: point, end_location: point })
                )
            })
            .nullable()
            .optional(),
        url: z.string().nullable().optional(),
        noqa_row: z.number().int().nullable().optional()
    })
);

/** Whether a ruff code is an error, as in VS Code: an undefined name or an unreadable file. */
function isRuffError(code: string | null | undefined): boolean {
    return code === 'F821' || code === 'E902';
}

/** The documentation address a linter named, when the page may open it. */
function documented(address: string | null | undefined): string | undefined {
    return webAddress(address) ?? undefined;
}

/** A place counted in code points as the editor's place. */
function codePointPlace(file: Source, row: number, column: number): [number, number] {
    return [row, utf16Column(file.lines[row - 1] ?? '', column)];
}

/** ruff's rows for a file; only a fix ruff calls safe is offered. */
export function readRuff(stdout: string, file: Source): LintRow[] | null {
    let found: z.infer<typeof ruffRows>;
    try {
        const parsed = ruffRows.safeParse(JSON.parse(stdout));
        if (!parsed.success) return null;
        found = parsed.data;
    } catch {
        return null;
    }
    return found.map((one): LintRow => {
        const [line, column] = codePointPlace(file, one.location.row, one.location.column);
        const [endLine, endColumn] = codePointPlace(
            file,
            one.end_location.row,
            one.end_location.column
        );
        const syntax = one.code === null || one.code === 'invalid-syntax';
        const href = syntax ? undefined : documented(one.url);
        const fixes: LintFix[] = [];
        if (!syntax && one.fix?.applicability === 'safe') {
            fixes.push({
                kind: 'fix',
                title: one.fix.message ?? '',
                edits: one.fix.edits.map((edit) => {
                    const [from, fromColumn] = codePointPlace(
                        file,
                        edit.location.row,
                        edit.location.column
                    );
                    const [to, toColumn] = codePointPlace(
                        file,
                        edit.end_location.row,
                        edit.end_location.column
                    );
                    return {
                        line: from,
                        column: fromColumn,
                        endLine: to,
                        endColumn: toColumn,
                        text: edit.content
                    };
                })
            });
        }
        return {
            line,
            column,
            endLine,
            endColumn,
            severity: syntax || isRuffError(one.code) ? 'error' : 'warning',
            message: one.message,
            ...(syntax ? {} : { code: one.code ?? '' }),
            ...(href === undefined ? {} : { href }),
            ...(one.noqa_row === null || one.noqa_row === undefined || syntax
                ? {}
                : { noqa: one.noqa_row }),
            fixes
        };
    });
}

const shellcheckComments = z.object({
    comments: z.array(
        z.object({
            line: z.number().int().min(1),
            endLine: z.number().int().min(1),
            column: z.number().int().min(1),
            endColumn: z.number().int().min(1),
            level: z.string(),
            code: z.number().int(),
            message: z.string(),
            fix: z
                .object({
                    replacements: z.array(
                        z.object({
                            line: z.number().int().min(1),
                            endLine: z.number().int().min(1),
                            column: z.number().int().min(1),
                            endColumn: z.number().int().min(1),
                            replacement: z.string()
                        })
                    )
                })
                .nullable()
                .optional()
        })
    )
});

const SHELLCHECK_SEVERITY: Record<string, LintRow['severity']> = {
    error: 'error',
    warning: 'warning',
    info: 'info',
    style: 'info'
};

/**
 * ShellCheck's rows for a file; a fix of one or two replacements is offered, as VS Code's is. A
 * row's documentation is the address the `shellcheck` row of `links` builds from its code, and
 * none without that row.
 */
export function readShellcheck(
    stdout: string,
    file: Source,
    links: readonly LinkRow[]
): LintRow[] | null {
    let found: z.infer<typeof shellcheckComments>['comments'];
    try {
        const parsed = shellcheckComments.safeParse(JSON.parse(stdout));
        if (!parsed.success) return null;
        found = parsed.data.comments;
    } catch {
        return null;
    }
    return found.map((one): LintRow => {
        const [line, column] = codePointPlace(file, one.line, one.column);
        const [endLine, endColumn] = codePointPlace(file, one.endLine, one.endColumn);
        const replacements = one.fix?.replacements ?? [];
        const edits: LintEdit[] = replacements.map((replacement) => {
            const [from, fromColumn] = codePointPlace(file, replacement.line, replacement.column);
            const [to, toColumn] = codePointPlace(file, replacement.endLine, replacement.endColumn);
            return {
                line: from,
                column: fromColumn,
                endLine: to,
                endColumn: toColumn,
                text: replacement.replacement
            };
        });
        const code = `SC${String(one.code)}`;
        const href = linkAddress(links, 'shellcheck', code);
        return {
            line,
            column,
            endLine,
            endColumn,
            severity: SHELLCHECK_SEVERITY[one.level] ?? 'warning',
            message: one.message,
            code,
            ...(href === undefined ? {} : { href }),
            fixes:
                edits.length === 1 || edits.length === 2 ? [{ kind: 'fix', title: '', edits }] : []
        };
    });
}

const fixShape = z.object({
    range: z.tuple([z.number().int(), z.number().int()]),
    text: z.string()
});

/** What the held ESLint answers for one file: its messages and the documentation of each rule. */
const eslintAnswer = z.object({
    messages: z.array(
        z.object({
            ruleId: z.string().nullable(),
            severity: z.number(),
            message: z.string(),
            fatal: z.boolean().optional(),
            line: z.number().int().optional(),
            column: z.number().int().optional(),
            endLine: z.number().int().optional(),
            endColumn: z.number().int().optional(),
            fix: fixShape.optional(),
            suggestions: z.array(z.object({ desc: z.string(), fix: fixShape })).optional()
        })
    ),
    docs: z.record(z.string(), z.string())
});

const ESLINT_BREAK = /\r\n|[\r\n\u2028\u2029]/g;

/** ESLint's rows for a file. `answer` is the child's message, checked here. */
export function readEslint(answer: unknown, file: Source): LintRow[] | null {
    const parsed = eslintAnswer.safeParse(answer);
    if (!parsed.success) return null;
    // ESLint breaks lines at U+2028 and U+2029, which the editor does not.
    const odd = /[\u2028\u2029]/.test(file.text);
    const eslintStarts = odd ? [0, ...[...file.text.matchAll(ESLINT_BREAK)].map(after)] : [];
    const place = (line: number, column: number): [number, number] => {
        if (!odd) return [line, column];
        const offset = (eslintStarts[line - 1] ?? 0) + column - 1;
        const there = pointAt(file.starts, offset);
        return [there.line, there.column];
    };
    const edit = (fix: { range: [number, number]; text: string }): LintEdit => {
        const from = pointAt(file.starts, fix.range[0]);
        const to = pointAt(file.starts, fix.range[1]);
        return {
            line: from.line,
            column: from.column,
            endLine: to.line,
            endColumn: to.column,
            text: fix.text
        };
    };
    return parsed.data.messages.map((one): LintRow => {
        const [line, column] = place(one.line ?? 1, one.column ?? 1);
        const [endLine, endColumn] =
            one.endLine === undefined || one.endColumn === undefined
                ? [0, 0]
                : place(one.endLine, one.endColumn);
        const rule = one.ruleId;
        const fixes: LintFix[] = [];
        if (rule !== null && one.fix !== undefined) {
            fixes.push({ kind: 'fix', title: '', edits: [edit(one.fix)] });
        }
        for (const suggestion of rule === null ? [] : (one.suggestions ?? [])) {
            fixes.push({
                kind: 'suggestion',
                title: suggestion.desc,
                edits: [edit(suggestion.fix)]
            });
        }
        const href = rule === null ? undefined : documented(parsed.data.docs[rule]);
        return {
            line,
            column,
            endLine,
            endColumn,
            severity: one.fatal === true || one.severity === 2 ? 'error' : 'warning',
            message: one.message,
            ...(rule === null ? {} : { code: rule }),
            ...(href === undefined ? {} : { href }),
            fixes
        };
    });
}

/** The offset after a match of a line break. */
function after(found: RegExpExecArray): number {
    return found.index + found[0].length;
}
