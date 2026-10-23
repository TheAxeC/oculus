// Layer 3, shell, partial of Palette.svelte. The list of `:theme`, `:file-icons`, `:tab` and
// `:goto`: the choices their argument picks from, narrowed by the words typed after the command,
// the one in force marked and the themes in their groups (palette-modes.ts `argumentRows`), the row
// the selection starts on (palette-modes.ts `startRow`), and what the palette says when Enter is
// pressed on a list with no row, in the words a typed argument naming nothing is refused with
// (state/workbench/palette.ts `argumentRefusal`).

import {
    argumentCommandOf,
    argumentRefusal,
    type ArgumentCommand,
    type PaletteView,
    type ParsedCommand
} from '$lib/state/workbench/palette';
import type { ClientState } from '$lib/state/client/context';
import { fileIconThemes, themes } from '$lib/state/shared/words/appearance';
import { stateRecord } from '$lib/state/workbench/layout';
import { argumentRows, startRow, type ArgumentChoices, type ArgumentRow } from '../palette-modes';

/** What the list is made over: the query, the choices, and the hint of each command. */
export type ArgumentListInput = {
    parsed: () => ParsedCommand | null;
    choices: () => ArgumentChoices;
    /** The words a command's argument is named by, which an empty argument is refused with. */
    hint: (command: ArgumentCommand) => string;
};

/** The list of an argument command. */
export type ArgumentList = {
    /** The command the query is, or null when it is none of the four. */
    readonly command: ArgumentCommand | null;
    /** Whether the query is one of the four. */
    readonly active: boolean;
    readonly rows: ArgumentRow[];
    /**
     * The value of the row the selection starts on (`startRow`); null when the query is none of the
     * four or the list is empty.
     */
    readonly start: string | null;
    /** What Enter on the list says when it holds no row; the empty string while it holds one. */
    readonly refusal: string;
};

export function createArgumentList(input: ArgumentListInput): ArgumentList {
    const command = $derived(argumentCommandOf(input.parsed()));
    const argument = $derived(input.parsed()?.argument ?? '');
    const rows = $derived(command === null ? [] : argumentRows(command, input.choices(), argument));
    const start = $derived(startRow(rows, argument)?.value ?? null);
    const refusal = $derived.by(() => {
        if (command === null || rows.length > 0) return '';
        const choices = input.choices();
        const named = (list: { name: string; label: string }[], text: string): boolean =>
            list.some((one) => [one.name, one.label].some((word) => same(word, text)));
        return argumentRefusal({ name: command, hint: input.hint(command) }, argument, {
            view: (id) => choices.views.some((one) => one.id === id),
            project: (id) => choices.projects.some((one) => one.id === id),
            theme: (text) => named(choices.themes, text),
            fileIcons: (text) => named(choices.fileIcons, text)
        });
    });
    return {
        get command() {
            return command;
        },
        get active() {
            return command !== null;
        },
        get rows() {
            return rows;
        },
        get start() {
            return start;
        },
        get refusal() {
            return refusal;
        }
    };
}

/**
 * The choices of the four lists: the themes and file icon themes the acting apps add among them,
 * the theme the option `theme` names (the Settings view's option, written into the workspace
 * file's `settings:`, which a preview does not change) and the file icon theme the option
 * `file_icons` names, the views, the hub's projects by id and short title, and the view and the
 * project of the tab on screen.
 */
export function argumentChoices(
    client: Pick<ClientState, 'appShell' | 'ui'>,
    views: PaletteView[],
    tab: { view: string; state?: unknown } | null,
    hub: Readonly<Record<string, { id: string; title: string; short?: string }>> = {}
): ArgumentChoices {
    const offers = client.appShell.offers();
    const projects = Object.values(hub);
    return {
        themes: themes(offers).map((one) => ({
            name: one.name,
            label: one.label,
            group: one.group
        })),
        theme: client.ui.chosenTheme(),
        fileIcons: fileIconThemes(offers),
        fileIcon: client.appShell.fileIcons(),
        views,
        view: tab?.view ?? null,
        projects: projects.map((one) => ({ id: one.id, title: one.short ?? one.title })),
        project: tab?.view === 'project' ? stateRecord(tab.state) : null
    };
}

/** Whether two words are one, without regard to case or the spaces around them. */
function same(word: string, text: string): boolean {
    return word.toLowerCase() === text.trim().toLowerCase();
}
