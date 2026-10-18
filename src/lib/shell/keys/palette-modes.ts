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
// is a list mode too, its rows state/workbench/palette.ts's `cloneRows`; so is `:folder-remove`,
// whose rows are the folders of the open workspace, made here (`folderRemovals`). The rows of the
// command mode itself are here too (`commandRows`): the commands and the views that match what is
// typed.

import type { LintConfig } from '$lib/state/system/machine/lint/lint-model';
import {
    byScore,
    fuzzyMatches,
    textParts,
    wordsHold,
    type PaletteCommand,
    type PaletteMatch,
    type PaletteView,
    type ParsedCommand,
    type TextPart
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
    choiceOfCommand,
    choicesOfLanguage,
    type LspChoiceKind
} from '$lib/data/prose/lsp-servers';

/**
 * What a request to open the palette installs: the text, whether it is the file mode, and whether
 * it is Go to Line, which the status bar's caret item opens and whose bare colon says the caret's
 * line; the command mode, a colon too, says nothing of lines.
 */
export type PaletteStart = { text: string; files: boolean; line: boolean };

/**
 * One row of the command mode: a colon command with its name and its words in matched and unmatched
 * runs, and whether it was typed by its whole name; or a view, by its label, which the row opens in
 * a tab.
 */
export type CommandRow =
    | {
          kind: 'command';
          command: PaletteCommand;
          name: TextPart[];
          words: TextPart[];
          named: boolean;
      }
    | { kind: 'view'; view: PaletteView; label: TextPart[] };

/** A command's row with no letter matched. */
function plainRow(command: PaletteCommand, named: boolean): CommandRow {
    return {
        kind: 'command',
        command,
        name: [{ text: command.name, hit: false }],
        words: [{ text: command.description, hit: false }],
        named
    };
}

/**
 * The rows of the command mode for what follows the colon, as VS Code's Show All Commands lists
 * them. A command's whole name followed by a space and words is that command with those words as
 * its argument, as `:theme dark` and `:tab processes` are. Otherwise the typed words are matched
 * fuzzily against each command's name and words together and against each view's label and id,
 * ranked by the match, the matched letters marked; with nothing typed every command is listed,
 * then every view.
 */
export function commandRows(
    list: PaletteCommand[],
    views: PaletteView[],
    parsed: ParsedCommand
): CommandRow[] {
    const named = list.find((one) => one.name === parsed.name);
    if (named !== undefined && parsed.argument !== '') return [plainRow(named, true)];
    const typed = `${parsed.name} ${parsed.argument}`.trim();
    if (typed === '') {
        return [
            ...list.map((one) => plainRow(one, false)),
            ...views.map((view) => ({
                kind: 'view' as const,
                view,
                label: [{ text: view.label, hit: false }]
            }))
        ];
    }
    const rows: ({ command: PaletteCommand } | { view: PaletteView })[] = [
        ...list.map((command) => ({ command })),
        ...views.map((view) => ({ view }))
    ];
    return fuzzyMatches(typed, rows, [
        (row) => ('command' in row ? row.command.name : row.view.label),
        (row) => ('command' in row ? row.command.description : row.view.id)
    ])
        .sort(byScore)
        .map((found): CommandRow => {
            const [first, second] = found.keys;
            if ('view' in found.row) {
                return {
                    kind: 'view',
                    view: found.row.view,
                    label: textParts(first, found.row.view.label)
                };
            }
            const { command } = found.row;
            return {
                kind: 'command',
                command,
                name: textParts(first, command.name),
                words: textParts(second, command.description),
                named: command.name === parsed.name
            };
        });
}

/** The value of a command mode row, which the list selects it by. */
export function commandRowValue(row: CommandRow): string {
    return row.kind === 'view' ? `view:${row.view.id}` : `command:${row.command.name}`;
}

/** One folder `:folder-remove` lists: the root's key, and its folder on the machine. */
export type FolderRow = { value: string; key: string; dir: string };

/** The folders of the open workspace whose name or folder holds every word typed. */
export function folderRemovals(
    argument: string,
    roots: readonly { key: string; dir: string }[]
): FolderRow[] {
    return roots
        .filter((root) => wordsHold(`${root.key} ${root.dir}`, argument))
        .map((root) => ({ value: `folder:${root.key}`, key: root.key, dir: root.dir }));
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
    /**
     * The workspace commands' lists: the workspace files, whether the query makes a workspace under
     * the name typed after it, and the folders of `:folder-remove`.
     */
    workspace: {
        choices: { path: string }[] | null;
        saving: boolean;
        folders: { value: string }[] | null;
    };
    choiceMode: ChoiceMode | null;
    commandList: CommandRow[];
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
    const { parsed, line, languageMode, workspace, choiceMode } = facts;
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
    if (workspace.choices !== null) {
        return {
            count: workspace.choices.length,
            values: workspace.choices.map((one) => `workspace:${one.path}`)
        };
    }
    if (workspace.saving) return { count: 1, values: [parsed.name] };
    if (workspace.folders !== null) {
        return {
            count: workspace.folders.length,
            values: workspace.folders.map((row) => row.value)
        };
    }
    if (facts.modeList !== null) {
        return { count: facts.modeList.length, values: facts.modeList.map((row) => row.value) };
    }
    if (choiceMode !== null) {
        return { count: facts.choiceList.length, values: facts.choiceList.map((row) => row.value) };
    }
    return {
        count: facts.commandList.length,
        values: facts.commandList
            .filter((row) => row.kind === 'view' || row.command.available)
            .map(commandRowValue)
    };
}
