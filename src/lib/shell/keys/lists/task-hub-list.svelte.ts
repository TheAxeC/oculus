// Layer 3, shell, partial of Palette.svelte. The second list of `:task-add`: the hubs a task can be
// added to, asked after the title when more than one hub holds the tasks collection, the primary
// first and selected, as `:language`'s second list asks the language of an association. The hubs
// are read live (`taskHubOrder` of state/forms/new-entry.ts), so a hub that leaves the workspace
// leaves the list. The list belongs to the title it was asked for, with whether Shift was held at
// that press, and is left once the query is another, so a palette opened again starts at the
// command.

import type { ClientState } from '$lib/state/client/context';
import { taskHubOrder } from '$lib/state/forms/new-entry';
import type { ParsedCommand } from '$lib/state/workbench/palette';

/** The command whose second list this is. */
const COMMAND = 'task-add';

/** What the list is made over: the query, and the hubs that hold the tasks collection. */
export type TaskHubListInput = {
    parsed: () => ParsedCommand | null;
    hubs: () => readonly string[];
};

/** One row of the list: a hub, by its name. */
type TaskHubRow = { value: string; hub: string };

/** The second list of `:task-add`. */
export type TaskHubList = {
    /** Whether the hubs are asked: a title was pressed and the query is that command and title. */
    readonly active: boolean;
    /** The hubs a task can be added to, the primary first, asked or not. */
    readonly hubs: readonly string[];
    /** One row per hub while the hubs are asked, else none. */
    readonly rows: TaskHubRow[];
    /** The title the hubs are asked for, and whether Shift was held at its press. */
    readonly asked: { title: string; open: boolean } | null;
    /** Ask the hubs for a title. */
    ask: (title: string, open: boolean) => void;
};

/** The hubs that hold the tasks collection, the primary first. */
export function taskHubs(client: Pick<ClientState, 'selectors' | 'fs'>): string[] {
    return taskHubOrder(client.selectors.collectionsOfKey('tasks'), client.fs.primary());
}

export function createTaskHubList(input: TaskHubListInput): TaskHubList {
    let asked = $state<{ title: string; open: boolean } | null>(null);
    const active = $derived.by(() => {
        const parsed = input.parsed();
        return asked !== null && parsed?.name === COMMAND && parsed.argument === asked.title;
    });
    const rows = $derived(
        active ? input.hubs().map((hub) => ({ value: `task-hub:${hub}`, hub })) : []
    );

    // A query other than the title the hubs were asked for leaves the list.
    $effect(() => {
        if (!active) asked = null;
    });

    return {
        get active() {
            return active;
        },
        get hubs() {
            return input.hubs();
        },
        get rows() {
            return rows;
        },
        get asked() {
            return asked;
        },
        ask: (title, open) => {
            asked = { title, open };
        }
    };
}
