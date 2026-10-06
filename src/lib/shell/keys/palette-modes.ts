// Layer 3, shell, partial of Palette.svelte. Which colon commands open a list of their own and what
// the list of the two language-server commands holds. `:language`, `:workspace` and
// `:workspace-save` are list modes of the palette, as are `:interpreter` and `:compile-database`:
// each lists the choices of the source tab's root with the one in force marked, and a typed path is
// offered as a new interpreter. The compile database list opens with a row for each finding of the
// repository's `.oculus/cpp.yml`, which no press acts on.

import type { ParsedCommand } from '$lib/state/workbench/palette';
import {
    databaseInForce,
    findingLine,
    interpreterInForce,
    interpreterLabel,
    type ChoicesView
} from '$lib/state/system/machine/lsp/lsp.svelte';
import { t } from '$lib/state/shared/words/text';

/** The commands that, chosen, open the list of their own instead of running. */
const MODE_COMMANDS = [
    'language',
    'workspace',
    'workspace-save',
    'interpreter',
    'compile-database'
];

/** Whether choosing a command types its name and a space, which opens its list. */
export function opensAsMode(name: string): boolean {
    return MODE_COMMANDS.includes(name);
}

/** The list a language-server command shows. */
export type ChoiceMode = 'interpreter' | 'compile-database';

/** The list the query is, when a server serves the language of the tab on screen. */
export function choiceModeOf(parsed: ParsedCommand | null, served: string): ChoiceMode | null {
    if (parsed === null) return null;
    if (parsed.name === 'interpreter' && served === 'python') return 'interpreter';
    if (parsed.name === 'compile-database' && (served === 'c' || served === 'cpp')) {
        return 'compile-database';
    }
    return null;
}

/** What a press on a row does. */
type ChoicePick =
    { kind: 'interpreter'; path: string; approve: boolean } | { kind: 'database'; key: string };

/** One row of a choice list; a row with no `pick` is a finding, which a press does not act on. */
export type ChoiceRow = {
    value: string;
    label: string;
    hint: string;
    active: boolean;
    pick: ChoicePick | null;
};

/** Whether a typed word is a path to an interpreter rather than words narrowing the list. */
function pathLike(word: string): boolean {
    return word.startsWith('/') || word.startsWith('~') || word.startsWith('.');
}

/** Whether a row's words hold every word of the query, in any case. */
function holds(words: string, query: string): boolean {
    const low = words.toLowerCase();
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word !== '')
        .every((word) => low.includes(word));
}

/** The rows of a choice list for what the query says after the command. */
export function choiceRows(
    mode: ChoiceMode,
    view: ChoicesView | null,
    argument: string
): ChoiceRow[] {
    if (view === null) return [];
    if (mode === 'compile-database') {
        const inForce = databaseInForce(view);
        const findings: ChoiceRow[] = view.findings.map((one, at) => ({
            value: `finding:${at}`,
            label: findingLine(one),
            hint: '',
            active: false,
            pick: null
        }));
        const databases: ChoiceRow[] = view.databases
            .filter((one) => holds(`${one.name} ${one.folder}`, argument))
            .map((one) => ({
                value: `database:${one.key}`,
                label: one.name,
                hint: one.configuration ? t('app.palette.database_configuration') : one.folder,
                active: inForce?.key === one.key,
                pick: { kind: 'database', key: one.key }
            }));
        return [...findings, ...databases];
    }
    const inForce = interpreterInForce(view);
    const typed = pathLike(argument) && !view.interpreters.some((one) => one.path === argument);
    const rows: ChoiceRow[] = view.interpreters
        .filter((one) => typed || holds(`${interpreterLabel(one)} ${one.path}`, argument))
        .map((one) => ({
            value: `interpreter:${one.path}`,
            label: one.approved
                ? interpreterLabel(one)
                : t('statusbar.interpreter_unapproved', interpreterLabel(one)),
            hint: one.path,
            active: inForce?.path === one.path,
            pick: { kind: 'interpreter', path: one.path, approve: !one.approved }
        }));
    if (typed) {
        rows.unshift({
            value: `interpreter:${argument}`,
            label: t('app.palette.interpreter_typed', argument),
            hint: '',
            active: false,
            pick: { kind: 'interpreter', path: argument, approve: false }
        });
    }
    return rows;
}
