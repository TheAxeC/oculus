// Layer 2, client state. The sources that give the problems store its rows: the language servers'
// diagnostics, the errors a project command printed, the errors and warnings of a LaTeX build, and
// the findings of the linters (ChkTeX, Ruff, ESLint, ShellCheck and the writing rules). Each is a
// function the store calls inside its fold, so it reads reactive stores and the store folds again
// whenever they change.

import type { Diagnostic } from 'vscode-languageserver-protocol';
import type { CommandDiagnostic, LintId } from '../../data/model/index.ts';
import { tabOfFile } from '../sources/repositories/file-git.ts';
import type { FileDiagnostics } from './machine/lsp/documents.svelte.ts';
import type { LintedRows } from './machine/lint/lint.svelte.ts';
import type { Problem, ProblemSeverity, ProblemSource } from './problems.svelte.ts';

/**
 * The owners a problem's marker is filed under in a Monaco model: every project command's markers
 * share one, a LaTeX build's markers have one, and each linter has its own, `lint-<id>`. A
 * language server's is `lsp-<language>`, built here for its rows and by `markerOwner` in
 * `ui/controls/editor/kit/lsp/markers.ts` for its markers; the two are written twice since
 * `state/` and `ui/` may not import each other.
 */
export const COMMAND_OWNER = 'command';
export const LATEX_OWNER = 'oculus-latex';

/** The owner of one linter's rows and markers. */
export function lintOwner(linter: LintId): string {
    return `lint-${linter}`;
}

/** The name a linter's rows show as their source, as the linter's VS Code extension writes it. */
const LINT_SOURCES: Record<LintId, string> = {
    chktex: 'ChkTeX',
    ruff: 'Ruff',
    eslint: 'eslint',
    shellcheck: 'shellcheck',
    writing: 'writing'
};

/** A root the page serves, by its key and the folder it is. */
type Served = { key: string; dir: string };

/** One problem of a LaTeX build, the file against the root the build is of. */
type LatexFound = {
    root: string;
    file: string;
    line?: number;
    severity: 'error' | 'warning';
    message: string;
    source: string;
};

/**
 * A language server's severity as a problem's: a missing severity is an error, as the documents
 * store counts it, and a hint is none, as VS Code's Problems view leaves hints out.
 */
function severityOf(severity: Diagnostic['severity']): ProblemSeverity | null {
    if (severity === undefined || severity === 1) return 'error';
    if (severity === 2) return 'warning';
    return severity === 3 ? 'info' : null;
}

/** The language servers' diagnostics of every file they hold, each language's listed once. */
export function languageProblems(documents: {
    listDiagnostics: () => FileDiagnostics[];
}): ProblemSource {
    return () =>
        documents.listDiagnostics().flatMap((file) =>
            file.items.flatMap((item): Problem[] => {
                const severity = severityOf(item.severity);
                if (severity === null) return [];
                const { start, end } = item.range;
                return [
                    {
                        root: file.root,
                        path: file.path,
                        ...(file.library === undefined ? {} : { library: file.library }),
                        language: file.language,
                        owner: `lsp-${file.language}`,
                        severity,
                        line: start.line + 1,
                        column: start.character + 1,
                        endLine: end.line + 1,
                        endColumn: end.character + 1,
                        message:
                            typeof item.message === 'string' ? item.message : item.message.value,
                        source: item.source ?? file.language,
                        ...(item.code === undefined ? {} : { code: String(item.code) })
                    }
                ];
            })
        );
}

/**
 * The errors project commands printed. A file is mapped to the root key that serves it, the
 * deepest root holding it; one in no served root keeps its path as written and opens nothing.
 */
export function commandProblems(
    commands: { commandDiagnostics: () => CommandDiagnostic[] },
    served: () => Served[]
): ProblemSource {
    return () =>
        commands.commandDiagnostics().map((found): Problem => {
            const outside = found.file.startsWith('/');
            const tab = tabOfFile(
                served(),
                outside
                    ? { root: '/', path: found.file.slice(1) }
                    : { root: found.root, path: found.file }
            );
            return {
                root: tab?.root ?? '',
                path: tab?.path ?? found.file,
                owner: COMMAND_OWNER,
                severity: found.severity,
                line: found.line,
                column: found.column ?? 0,
                endLine: 0,
                endColumn: 0,
                message: found.message,
                source: found.source.replace(/^command:/, '')
            };
        });
}

/** The errors and warnings of the latest LaTeX build of every folder the page holds. */
export function latexProblems(latex: { latexDiagnostics: () => LatexFound[] }): ProblemSource {
    return () =>
        latex.latexDiagnostics().map((found): Problem => ({
            root: found.root,
            path: found.file,
            owner: LATEX_OWNER,
            severity: found.severity,
            line: found.line ?? 1,
            column: 0,
            endLine: 0,
            endColumn: 0,
            message: found.message,
            source: found.source
        }));
}

/** The findings of every file the page lints, each under its linter's owner. */
export function lintProblems(lint: { rows: () => LintedRows[] }): ProblemSource {
    return () =>
        lint.rows().flatMap((held) =>
            held.rows.map((row): Problem => ({
                root: held.root,
                path: held.path,
                owner: lintOwner(held.linter),
                severity: row.severity,
                line: row.line,
                column: row.column,
                endLine: row.endLine,
                endColumn: row.endColumn,
                message: row.message,
                source: LINT_SOURCES[held.linter],
                ...(row.code === undefined ? {} : { code: row.code }),
                ...(row.href === undefined ? {} : { href: row.href }),
                ...(row.noqa === undefined ? {} : { noqa: row.noqa }),
                ...(row.fixes.length === 0 ? {} : { fixes: row.fixes })
            }))
        );
}
