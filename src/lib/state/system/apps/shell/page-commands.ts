// Layer 2, client state. The commands of oculus's own that an app may run, as the page runs them:
// `oculus.theme`, `oculus.crt`, `oculus.tab` and `oculus.goto`, the palette's colon commands that
// change what a page shows. The server decides which ids an app may name
// (data/helpers/files/apps/commands.ts) and hands a page the ones it must run; each takes one text
// argument, as the colon command takes. What a command changes is this page's alone.

import type { CommandResult } from './requests.svelte.ts';

/** What the commands change on the page. */
export type PageCommandDeps = {
    /** The name of the theme a text stands for, or null. */
    themeNamed: (text: string) => string | null;
    setTheme: (name: string) => void;
    /** Whether the CRT overlay is on, and turn it on or off. */
    crt: () => boolean;
    setCrt: (on: boolean) => void;
    /** Whether a view of this id exists, and open it. */
    hasView: (id: string) => boolean;
    openView: (id: string) => void;
    /** The title to open a project by, or null for an id that names none. */
    projectLabel: (id: string) => string | null;
    openProject: (id: string, label: string) => void;
};

/** The page's stores the commands act through, as the client object (state/client) holds them. */
export type PageStores = {
    ui: { setTheme: (name: string) => void; crt: () => boolean; setCrt: (on: boolean) => void };
    themeNamed: (text: string) => string | null;
    views: () => { id: string }[];
    openView: (view: string, state?: Record<string, string>) => unknown;
    projectOf: (id: string) => { title: string; short?: string } | null;
};

/** What the commands change, over the page's stores. */
export function pageCommandDeps(stores: PageStores): PageCommandDeps {
    return {
        themeNamed: stores.themeNamed,
        setTheme: stores.ui.setTheme,
        crt: stores.ui.crt,
        setCrt: stores.ui.setCrt,
        hasView: (view) => stores.views().some((one) => one.id === view),
        openView: (view) => void stores.openView(view),
        projectLabel: (id) => {
            const project = stores.projectOf(id);
            return project === null ? null : (project.short ?? project.title);
        },
        openProject: (id, label) => void stores.openView('project', { id, label })
    };
}

const OK: CommandResult = { ok: true, value: null };
const BAD: CommandResult = { ok: false, word: 'refused:argument' };

/** The text of the first argument, or the empty string. */
function textOf(args: unknown[]): string {
    return typeof args[0] === 'string' ? args[0] : '';
}

/** Run one of oculus's page commands by its id. */
export function runPageCommand(deps: PageCommandDeps, id: string, args: unknown[]): CommandResult {
    const text = textOf(args);
    if (id === 'oculus.theme') {
        const name = deps.themeNamed(text);
        if (name === null) return BAD;
        deps.setTheme(name);
        return OK;
    }
    if (id === 'oculus.crt') {
        const wanted = text.trim().toLowerCase();
        if (wanted !== '' && wanted !== 'on' && wanted !== 'off') return BAD;
        deps.setCrt(wanted === '' ? !deps.crt() : wanted === 'on');
        return OK;
    }
    if (id === 'oculus.tab') {
        if (!deps.hasView(text)) return BAD;
        deps.openView(text);
        return OK;
    }
    if (id === 'oculus.goto') {
        const label = deps.projectLabel(text);
        if (label === null) return BAD;
        deps.openProject(text, label);
        return OK;
    }
    return { ok: false, word: 'missing' };
}
