// Layer 3, shell, partial of Palette.svelte. Which colon commands open a list of their own and what
// the list of the language-server commands holds. `:language`, `:workspace`, `:workspace-save` and
// `:workspace-new` are list modes of the palette, as are the commands of the choices a server asks
// for (data/prose/lsp-servers.ts): `:interpreter`, `:compile-database` and `:svelte-config`. Each
// lists the choices of the source tab's root with the one in force marked, and a typed path is
// offered as a new interpreter. The compile database list opens with a row for each finding of the
// repository's `.oculus/cpp.yml`, which no press acts on. The Svelte configuration list names the
// configuration files the Svelte server would run, which no press acts on, and one row that
// approves them or, once approved, takes the approval back. `:eslint-config` lists the same for the
// ESLint configuration file of the source tab's file, whether or not a server serves it. `:clone`
// is a list mode too; its rows are state/workbench/palette.ts's `cloneRows`.

import type { LintConfig } from '$lib/state/system/machine/lint/lint-model';
import {
    wordsHold,
    type PaletteCommand,
    type PaletteMatch,
    type ParsedCommand
} from '$lib/state/workbench/palette';
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

/** What a request to open the palette installs: the text, and whether it is the file mode. */
export type PaletteStart = { text: string; files: boolean };

/** The commands that, chosen, open the list of their own instead of running. */
const MODE_COMMANDS = [
    'language',
    'workspace',
    'workspace-save',
    'workspace-new',
    'eslint-config',
    'clone',
    ...Object.values(LSP_CHOICES).map((one) => one.command)
];

/** Whether choosing a command types its name and a space, which opens its list. */
export function opensAsMode(name: string): boolean {
    return MODE_COMMANDS.includes(name);
}

/** The file whose ESLint configuration the query lists, when it is `:eslint-config`. */
export function lintConfigOf(
    parsed: ParsedCommand | null,
    linters: { at: { root: string; path: string } } | undefined
): { root: string; path: string } | null {
    return parsed?.name === 'eslint-config' && linters !== undefined ? linters.at : null;
}

/** One row of the `:eslint-config` list; a file row is shown and not pressed. */
export type LintConfigRow = {
    value: string;
    /** The word the row is of: the configuration file, or the approval. */
    kind: string;
    label: string;
    active: boolean;
    /** What a press does: approve or take back the approval of the text with this key. */
    change: { approve: boolean; key: string } | null;
};

/** The rows for the configuration file: the file, then the row that approves or revokes it. */
export function lintConfigRows(config: LintConfig | null | undefined): LintConfigRow[] {
    if (config === null || config === undefined) return [];
    return [
        ...config.files.map((file): LintConfigRow => ({
            value: `eslint-config:${file}`,
            kind: t('app.palette.kind_config_file'),
            label: file,
            active: false,
            change: null
        })),
        {
            value: config.approved ? 'eslint-config:revoke' : 'eslint-config:approve',
            kind: t('app.palette.kind_eslint_config'),
            label: config.approved
                ? t('app.palette.eslint_config_revoke')
                : t('app.palette.eslint_config_approve'),
            active: config.approved,
            change: { approve: !config.approved, key: config.key }
        }
    ];
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
            .filter((one) => wordsHold(`${one.name} ${one.folder}`, argument))
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
        .filter((one) => typed || wordsHold(`${interpreterLabel(one)} ${one.path}`, argument))
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

/** What the list of the palette is made of, whichever mode the query puts it in. */
export type ListedFacts = {
    parsed: ParsedCommand | null;
    matches: PaletteMatch[];
    /** The values of the file mode's rows, or null while the palette is in another mode. */
    files: string[] | null;
    /** The line a go-to-line query names, or null for another query. */
    line: number | null;
    /** Whether the source tab on screen has a caret, which a go-to-line needs. */
    hasCaret: boolean;
    languageMode: boolean;
    languageEntries: { kind: string }[];
    languages: { choice: { name: string } }[];
    workspaceMode: boolean;
    choices: { path: string }[];
    /** Whether the query is a command that makes a workspace under the name typed after it. */
    saveMode: boolean;
    choiceMode: ChoiceMode | null;
    commandList: PaletteCommand[];
    choiceList: { value: string }[];
    /** The rows of `:eslint-config` or `:clone` while the query is that command, else null. */
    modeList: { value: string }[] | null;
};

/**
 * How many rows the list draws and the value of each row a press can run, in the order drawn: the
 * files of the file mode, the fuzzy matches with no command, the go-to-line row, the language
 * entries and languages, the workspaces, the save row, the choices of a server, else the colon
 * commands, among which one that is unavailable is drawn and has no value.
 */
export function listedRows(facts: ListedFacts): { count: number; values: string[] } {
    const { parsed, line, languageMode, workspaceMode, saveMode, choiceMode } = facts;
    if (facts.files !== null) return { count: facts.files.length, values: facts.files };
    if (parsed === null) {
        const chosen = facts.matches.filter((one) => one.item.disabled !== true);
        return { count: chosen.length, values: chosen.map((one) => one.item.id) };
    }
    if (line !== null)
        return facts.hasCaret ? { count: 1, values: ['line'] } : { count: 0, values: [] };
    if (languageMode) {
        return {
            count: facts.languageEntries.length + facts.languages.length,
            values: [
                ...facts.languageEntries.map((one) => `language-action:${one.kind}`),
                ...facts.languages.map((one) => `language:${one.choice.name}`)
            ]
        };
    }
    if (workspaceMode) {
        return {
            count: facts.choices.length,
            values: facts.choices.map((one) => `workspace:${one.path}`)
        };
    }
    if (saveMode) return { count: 1, values: [parsed.name] };
    if (facts.modeList !== null) {
        return { count: facts.modeList.length, values: facts.modeList.map((row) => row.value) };
    }
    if (choiceMode !== null) {
        return { count: facts.choiceList.length, values: facts.choiceList.map((row) => row.value) };
    }
    return {
        count: facts.commandList.length,
        values: facts.commandList
            .filter((command) => command.available)
            .map((command) => `command:${command.name}`)
    };
}
