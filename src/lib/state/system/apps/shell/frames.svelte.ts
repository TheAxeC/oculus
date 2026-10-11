// Layer 2, client state. What the frames of the open tabs registered in the shell: the command
// handlers a frame answers (`oculus.register('command', id)`) and the status bar items it draws
// (`oculus.register('statusItem', id, options)`). A command belongs to the tab whose frame
// registered it and ends with `unregister` or when that tab's frame ends; one id is held once per
// tab. A status item belongs to the app: it ends with `unregister`, or when the app's last tab
// closes, and any of the app's tabs may change or unregister it. A command id starts with the
// app's name and a dot.

import { SvelteMap } from 'svelte/reactivity';
import { blankItem, changeItem } from '../../../../data/helpers/files/apps/status-items.ts';
import type { AppStatusItem } from '../../../../data/model/index.ts';

/** The kinds of thing a frame registers. */
export type FrameKind = 'command' | 'statusItem';

/** A status item of an app's frames with the app it belongs to. */
export type FrameItem = { app: string; item: AppStatusItem };

export function createFrameShell() {
    /** The command ids each open tab's frame answers. */
    const commands = new SvelteMap<string, Set<string>>();
    /** The app each open tab shows. */
    const appOf = new SvelteMap<string, string>();
    /** The status items of each app that has an open tab. */
    const items = new SvelteMap<string, AppStatusItem[]>();

    /** A tab of an app opened. */
    function attach(instance: string, app: string): void {
        appOf.set(instance, app);
    }

    /** Hold a registration; the word the frame is refused with, or null. */
    function register(
        instance: string,
        app: { id: string; name: string },
        kind: FrameKind,
        id: string,
        options: Record<string, unknown>
    ): string | null {
        attach(instance, app.id);
        if (kind === 'command') {
            const now = commands.get(instance) ?? new Set<string>();
            if (!id.startsWith(`${app.name}.`)) return 'refused:id';
            if (now.has(id)) return 'refused:registered';
            commands.set(instance, new Set([...now, id]));
            return null;
        }
        const now = items.get(app.id) ?? [];
        if (now.some((one) => one.id === id)) return 'refused:registered';
        const alignment = options.alignment === 'right' ? 'right' : 'left';
        const priority = typeof options.priority === 'number' ? options.priority : 0;
        items.set(app.id, [...now, blankItem(id, alignment, priority)]);
        return null;
    }

    function unregister(instance: string, kind: FrameKind, id: string): void {
        if (kind === 'command') {
            const now = commands.get(instance);
            if (now !== undefined)
                commands.set(instance, new Set([...now].filter((one) => one !== id)));
            return;
        }
        const app = appOf.get(instance);
        const now = app === undefined ? undefined : items.get(app);
        if (app === undefined || now === undefined) return;
        items.set(
            app,
            now.filter((one) => one.id !== id)
        );
    }

    /** Fold a change of a registered status item. */
    function changed(instance: string, id: string, options: Record<string, unknown>): void {
        const app = appOf.get(instance);
        const now = app === undefined ? undefined : items.get(app);
        if (app === undefined || !now?.some((one) => one.id === id)) return;
        items.set(
            app,
            now.map((one) => {
                if (one.id !== id) return one;
                const next = { ...one };
                changeItem(next, options);
                return next;
            })
        );
    }

    /** A tab's frame ended: its commands go, and its app's items go with the app's last tab. */
    function drop(instance: string): void {
        const app = appOf.get(instance);
        commands.delete(instance);
        appOf.delete(instance);
        if (app !== undefined && ![...appOf.values()].includes(app)) items.delete(app);
    }

    return {
        attach,
        register,
        unregister,
        changed,
        drop,
        /** The tab of an app whose frame registered a handler for the command. */
        tabFor: (app: string, command: string): string | undefined =>
            [...commands].find(
                ([instance, ids]) => appOf.get(instance) === app && ids.has(command)
            )?.[0],
        /** The status items of every app that has an open tab. */
        items: (): FrameItem[] =>
            [...items].flatMap(([app, held]) => held.map((item) => ({ app, item })))
    };
}
