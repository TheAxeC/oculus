// Layer 2, client state. What the apps that act add to the shell, read from the rows of the `apps`
// channel: their commands, the entries of each menu, their views and custom editors. An app acts
// while it is enabled and its current files are approved (data/helpers/files/apps/apps.ts
// `appActive`); an app in any other state is not in any list here, so the moment its state changes
// everything it added goes. Every list keeps the Views list's order of the apps.

import { appActive, appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import { holds } from './context.ts';
import type { IContext } from '../../../../data/helpers/files/apps/when.ts';
import type {
    AppCommand,
    AppContainer,
    AppContainerKind,
    AppCustomEditor,
    AppMenuEntry,
    AppRow,
    AppViewEntry
} from '../../../../data/model/index.ts';

/** An app that acts, with the id it is known by in the Views list. */
export type Acting = { id: string; row: AppRow };

/** The apps that act, in the order of the rows. */
export function actingApps(rows: readonly AppRow[]): Acting[] {
    return rows
        .filter((row) => appActive(row))
        .map((row) => ({ id: appViewId(row.root, row.name), row }));
}

/** A command an acting app declares. */
export type CommandOffer = { app: string; appTitle: string; command: AppCommand };

/** The commands the acting apps declare. */
export function commandOffers(apps: readonly Acting[]): CommandOffer[] {
    return apps.flatMap(({ id, row }) =>
        row.contributes.commands.map((command) => ({ app: id, appTitle: row.title, command }))
    );
}

/** How Cmd-K and the menus word a command: its category, a colon and its title. */
export function commandLabel(command: AppCommand): string {
    return command.category === '' ? command.title : `${command.category}: ${command.title}`;
}

/** An entry of a menu with the command it runs and the app it belongs to. */
export type MenuOffer = {
    app: string;
    appTitle: string;
    entry: AppMenuEntry;
    command: AppCommand;
    /** The command an Alt press runs in its place, when the entry names one. */
    alt: AppCommand | null;
    /** The group without its `@<order>`. */
    group: string;
    order: number;
};

/** The group an entry names and the order after its `@`; entries without an order sort last. */
function groupOf(name: string): { group: string; order: number } {
    const at = name.indexOf('@');
    if (at < 0) return { group: name, order: Number.POSITIVE_INFINITY };
    const order = Number(name.slice(at + 1));
    return {
        group: name.slice(0, at),
        order: Number.isFinite(order) ? order : Number.POSITIVE_INFINITY
    };
}

/** The order VS Code gives groups: `navigation` first, the others by name. */
function byGroup(left: string, right: string): number {
    if (left === right) return 0;
    if (left === 'navigation') return -1;
    if (right === 'navigation') return 1;
    return left < right ? -1 : 1;
}

/**
 * The entries of one menu whose `when` holds in a context, in VS Code's order: group by group
 * (`navigation` first), inside a group by the order after `@` and then by the apps' order. An
 * entry whose command the app does not declare is left out.
 */
export function menuOffers(apps: readonly Acting[], menu: string, context: IContext): MenuOffer[] {
    const offers: MenuOffer[] = [];
    for (const { id, row } of apps) {
        for (const entry of row.contributes.menus[menu] ?? []) {
            const command = row.contributes.commands.find((one) => one.command === entry.command);
            if (command === undefined || !holds(entry.when, context)) continue;
            const alt = row.contributes.commands.find((one) => one.command === entry.alt) ?? null;
            offers.push({
                app: id,
                appTitle: row.title,
                entry,
                command,
                alt,
                ...groupOf(entry.group)
            });
        }
    }
    return offers
        .map((offer, at) => ({ offer, at }))
        .sort(
            (left, right) =>
                byGroup(left.offer.group, right.offer.group) ||
                left.offer.order - right.offer.order ||
                left.at - right.at
        )
        .map(({ offer }) => offer);
}

/** A view of an acting app with its container's title and the app. */
export type ViewOffer = {
    app: string;
    appTitle: string;
    view: AppViewEntry;
    /** The container's id: an `activitybar` or `panel` container of the app, or `explorer`. */
    container: string;
    /** The container's title, the Files view's for `explorer`. */
    containerTitle: string;
    kind: AppContainerKind | 'explorer';
};

/** The views the acting apps declare, container by container. */
export function viewOffers(apps: readonly Acting[]): ViewOffer[] {
    return apps.flatMap(({ id, row }) => {
        const containers = new Map<string, { container: AppContainer; kind: AppContainerKind }>();
        for (const kind of ['activitybar', 'panel'] as const) {
            for (const container of row.contributes.viewsContainers[kind]) {
                containers.set(container.id, { container, kind });
            }
        }
        return Object.entries(row.contributes.views).flatMap(([name, views]) => {
            const held = containers.get(name);
            const kind = held?.kind ?? 'explorer';
            return views.map((view) => ({
                app: id,
                appTitle: row.title,
                view,
                container: name,
                containerTitle: held?.container.title ?? '',
                kind
            }));
        });
    });
}

/** A custom editor of an acting app. */
export type EditorOffer = { app: string; appTitle: string; editor: AppCustomEditor };

/** The custom editors the acting apps declare. */
export function editorOffers(apps: readonly Acting[]): EditorOffer[] {
    return apps.flatMap(({ id, row }) =>
        row.contributes.customEditors.map((editor) => ({
            app: id,
            appTitle: row.title,
            editor
        }))
    );
}
