// Layer 3, shell, partial of Palette.svelte. Which colon commands open a list of their own and what
// the list of the language-server commands holds. `:language`, `:workspace` and `:workspace-save`
// are list modes of the palette, as are the commands of the choices a server asks for
// (data/prose/lsp-servers.ts): `:interpreter`, `:compile-database` and `:svelte-config`. Each lists
// the choices of the source tab's root with the one in force marked, and a typed path is offered as
// a new interpreter. The compile database list opens with a row for each finding of the
// repository's `.oculus/cpp.yml`, which no press acts on. The Svelte configuration list names the
// configuration files the Svelte server would run, which no press acts on, and one row that
// approves them or, once approved, takes the approval back.

import type { ParsedCommand } from '$lib/state/workbench/palette';
import {
    databaseInForce,
    findingLine,
    interpreterInForce,
    interpreterLabel,
    type ChoicesView
} from '$lib/state/system/machine/lsp/lsp.svelte';
import { t } from '$lib/state/shared/words/text';
import {
    LSP_CHOICES,
    choiceOfCommand,
    choicesOfLanguage,
    type LspChoiceKind
} from '$lib/data/prose/lsp-servers';

/** The commands that, chosen, open the list of their own instead of running. */
const MODE_COMMANDS = [
    'language',
    'workspace',
    'workspace-save',
    ...Object.values(LSP_CHOICES).map((one) => one.command)
];

/** Whether choosing a command types its name and a space, which opens its list. */
export function opensAsMode(name: string): boolean {
    return MODE_COMMANDS.includes(name);
}

/** The list a language-server command shows: the kind of choice it lists. */
export type ChoiceMode = LspChoiceKind;

/** The list the query is, when a server that asks for the choice serves the tab on screen. */
export function choiceModeOf(parsed: ParsedCommand | null, served: string): ChoiceMode | null {
    if (parsed === null) return null;
    const kind = choiceOfCommand(parsed.name);
    return kind !== undefined && choicesOfLanguage(served).includes(kind) ? kind : null;
}

/** What a press on a row does. */
type ChoicePick =
    | { kind: 'interpreter'; path: string; approve: boolean }
    | { kind: 'database'; key: string }
    | { kind: 'config'; approve: boolean; key: string };

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
    if (mode === 'config') {
        if (view.config === null) return [];
        const files: ChoiceRow[] = view.config.files.map((file) => ({
            value: `config:${file}`,
            label: file,
            hint: '',
            active: false,
            pick: null
        }));
        const approved = view.config.approved;
        return [
            ...files,
            {
                value: approved ? 'config:revoke' : 'config:approve',
                label: approved ? t('app.palette.config_revoke') : t('app.palette.config_approve'),
                hint: '',
                active: approved,
                pick: { kind: 'config', approve: !approved, key: view.config.key }
            }
        ];
    }
    if (mode === 'database') {
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
