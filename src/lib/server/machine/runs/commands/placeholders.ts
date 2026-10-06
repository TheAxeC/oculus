// Layer 2, server. The placeholders of a chain's command lines. `${file}` and its relatives are
// never written into a line as text: each one becomes `${OCULUS_ARG_<n>+"$OCULUS_ARG_<n>"}`, and
// its value is set in the task terminal's environment under that name. The shell reads the line,
// finds a variable and puts its value in as data, so a selection that holds quotes, `;` or `$(...)`
// stays the text it is wherever the line writes the placeholder: bare, inside double quotes, in a
// here-doc body or inside `$(...)`. The form is quoted both outside double quotes and inside them,
// where a bare `"$NAME"` would close the line's own quotes and split the value at its blanks.
// Inside single quotes the line prints the form as written, as any `$NAME` is there. Any other
// `${...}` is left as written, for the shell to read as its own.
//
// What still reads a value as code is a line that evaluates text itself (`eval`, `sh -c`, and
// `$((...))` arithmetic in bash), which the approved line shows.
//
// The lines are read once: a value that itself holds a placeholder is not read again. One
// placeholder name is one variable across the whole chain, numbered by where it first appears.

import { basename, dirname, extname } from 'node:path';
import type { CommandContext, TerminalRefusal } from '../../../../data/model/index.ts';
import { TASK_ENV_PREFIX } from '../../pty/sessions.ts';

const NAMES = [
    'file',
    'fileDirname',
    'fileBasename',
    'fileBasenameNoExtension',
    'lineNumber',
    'selectedText',
    'workspaceFolder'
] as const;

type Name = (typeof NAMES)[number];

const PLACEHOLDER = new RegExp(`\\$\\{(${NAMES.join('|')})\\}`, 'g');

/** The value of a placeholder, or null when the page gave nothing for it. */
function valueOf(name: Name, context: CommandContext, repo: string): string | null {
    const file = context.file === undefined || context.file === '' ? null : context.file;
    switch (name) {
        case 'workspaceFolder':
            return repo;
        case 'file':
            return file;
        case 'fileDirname':
            return file === null ? null : dirname(file);
        case 'fileBasename':
            return file === null ? null : basename(file);
        case 'fileBasenameNoExtension':
            return file === null ? null : basename(file, extname(file));
        case 'lineNumber':
            return file === null || context.line === undefined ? null : String(context.line);
        case 'selectedText':
            return context.selectedText === undefined || context.selectedText === ''
                ? null
                : context.selectedText;
    }
}

/** The text that stands for a variable in a line, its value whole in every quoting context. */
function reference(variable: string): string {
    return `\${${variable}+"$${variable}"}`;
}

/** The lines with their placeholders replaced, and the environment that holds the values. */
export type Filled = { lines: string[]; env: Record<string, string> };

/**
 * The chain's lines with every placeholder replaced by its variable, and the variables' values, or
 * the word that refuses the first placeholder with no value or a value no environment can hold,
 * with the placeholder it is about.
 */
export function fillPlaceholders(
    runs: readonly string[],
    context: CommandContext,
    repo: string
): Filled | { error: TerminalRefusal; names: string[] } {
    const numbered = new Map<Name, string>();
    const env: Record<string, string> = {};
    const refused: { error: TerminalRefusal; names: string[] }[] = [];
    const lines = runs.map((run) =>
        run.replace(PLACEHOLDER, (text, name: Name) => {
            const known = numbered.get(name);
            if (known !== undefined) return reference(known);
            const value = valueOf(name, context, repo);
            if (value === null) {
                refused.push({
                    error: name === 'selectedText' ? 'no-selection' : 'no-file',
                    names: [text]
                });
                return text;
            }
            if (value.includes('\u0000')) {
                refused.push({ error: 'nul-value', names: [text] });
                return text;
            }
            const variable = `${TASK_ENV_PREFIX}${numbered.size + 1}`;
            numbered.set(name, variable);
            env[variable] = value;
            return reference(variable);
        })
    );
    return refused.length === 0 ? { lines, env } : refused[0];
}
