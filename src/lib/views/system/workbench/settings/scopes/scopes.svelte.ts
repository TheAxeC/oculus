// Layer 3, view helper. The scopes of one Settings view: the unsaved changes of every file
// (state/system/config/scopes/changes.ts) made reactive, the stage the rows' writers hold their
// changes through in the scope on screen, the Save of one file, of the scope on screen and of every
// file, and the name question the unsaved workspace asks before its changes can be written.
//
// A Save sends the changes of one file as one write (data/shapes/config-save.ts), which History
// records once; an answer that lands drops them, keeping a change or a secret typed while the Save
// was out, and a refusal keeps them with its sentence under the scope bar. Save All saves each file
// with changes in the order its first change was made. The changes of the unsaved workspace wait
// for a name: the Save of its scope, or a Save All with it among the files, asks the question, and
// once the workspace is saved under that name (as Save Workspace As saves it) its changes move to
// the new file, which is written as soon as it is read, with every other file after it for a Save
// All. The changes of a hub or a repository that left the workspace are kept, said under the bar,
// and never written while it is away.

import { tick } from 'svelte';
import { createSubscriber } from 'svelte/reactivity';
import type { WriteAnswer } from '$lib/state/shared/stores/shapes';
import {
    PRIMARY_NAME,
    appName,
    createChanges,
    folderName,
    keyName,
    saveOf,
    type Changes,
    type SaveBody,
    type SaveChange
} from '$lib/state/system/config/scopes/changes';
import { message, type Message } from '$lib/state/system/config/messages';
import { writtenWhole, type ConfigRow } from '$lib/state/system/config/rows';
import type { ScopeFile } from '$lib/state/system/config/scopes/rows';
import { saveTarget, type SaveTarget } from '$lib/state/system/config/scopes/save';
import { fileOf, type Scope, type ScopeGround } from '$lib/state/system/config/scopes/scope';
import { answered, type Held, type Stage } from '$lib/state/system/config/scopes/write';

/** What the scopes read and send through. */
export type ScopesDeps = {
    /** The scope on screen. */
    scope: () => Scope;
    ground: () => ScopeGround;
    /** The file of a scope as the view reads it. */
    read: (scope: Scope) => ScopeFile;
    /** The `downloads` rows of a hub's `local.yml` as the page holds them, by the file's name. */
    downloads: (file: string) => unknown;
    send: (body: SaveBody) => Promise<WriteAnswer>;
    saveWorkspace: (name: string) => Promise<WriteAnswer>;
};

/** A change of the workspace file itself: its primary, or a folder's name. */
type WorkspaceChange = { primary: string } | { folder: string; name: string };

/** What a Save waiting on the name question goes on to save: the workspace's scope, or all. */
type Asking = 'scope' | 'all';

/** The scopes of one view. */
export type Scopes = {
    /** The unsaved changes, every read of which redraws what read it when they move. */
    changes: Changes;
    /** How the writers hold a row's change in the scope on screen. */
    stage: Stage;
    /** The name the scope on screen keeps its changes under. */
    file: () => string;
    /** Where the changes of a file go now, or why they do not. */
    target: (file: string) => SaveTarget;
    /** The sentence the last Save of a file left, or null. */
    said: (file: string) => Message | null;
    /** What the name question waits to save, or null while it is not asked. */
    asking: () => Asking | null;
    /** Save the scope on screen; whether every change of it was written. */
    save: () => Promise<boolean>;
    /** Save every file with changes; whether every one was written. */
    saveAll: () => Promise<boolean>;
    /** The name the question is answered with: save the workspace under it and go on. */
    named: (name: string) => Promise<void>;
    /** Close the name question, keeping the changes. */
    cancelName: () => void;
    /** Drop every change of a file. */
    discard: (file: string) => void;
    /** Hold the value of a setting an app declares, or its taking out. */
    stageApp: (key: string, change: Held | null) => void;
    /** The change held for a setting an app declares. */
    heldApp: (key: string) => Held | undefined;
    /**
     * Hold a change of the workspace file itself under its name (`PRIMARY_NAME`, `folderName`), or
     * drop it with null.
     */
    stageWorkspace: (name: string, change: WorkspaceChange | null) => void;
    /** The change of the workspace file itself held under a name. */
    heldWorkspace: (name: string) => WorkspaceChange | undefined;
    /** Run the Save that waits for the workspace file to be read, once it is. */
    resume: () => void;
};

/** The name the unsaved workspace's changes are kept under, its file having no path. */
const UNSAVED = fileOf({ kind: 'workspace' }, { folders: [], primary: null, workspaceFile: null });

/** The change a row's held value or reset is sent as. */
function heldOfChange(change: unknown): Held | undefined {
    if (typeof change !== 'object' || change === null) return undefined;
    if ('reset' in change) return { reset: true };
    if ('value' in change) return { value: change.value };
    return undefined;
}

/** Open the scopes of a view. */
export function createScopes(deps: ScopesDeps): Scopes {
    // Each read of the changes subscribes whatever reads it, and every change of them redraws it.
    let changed = (): void => undefined;
    const subscribe = createSubscriber((update) => {
        changed = update;
        return () => {
            changed = () => undefined;
        };
    });
    const inner = createChanges(() => changed());
    let saying = $state<Record<string, Message | null>>({});
    let asking = $state<Asking | null>(null);
    /** The Save that waits for the workspace file it was named as to be read. */
    let waiting = $state<Asking | null>(null);

    /** A read of the changes, which redraws whatever read it when they move. */
    function read<T>(get: () => T): T {
        subscribe();
        return get();
    }

    const changes: Changes = {
        ...inner,
        get: (file, name) => read(() => inner.get(file, name)),
        secret: (file, service) => read(() => inner.secret(file, service)),
        count: (file) => read(() => inner.count(file)),
        files: () => read(() => inner.files()),
        of: (file) => read(() => inner.of(file)),
        secretsOf: (file) => read(() => inner.secretsOf(file))
    };

    const file = (): string => fileOf(deps.scope(), deps.ground());
    const target = (name: string): SaveTarget => saveTarget(name, deps.ground(), deps.read);

    function say(name: string, said: Message | null): void {
        saying = { ...saying, [name]: said };
    }

    /** The first change of the unsaved workspace asks for its name. */
    function ask(): void {
        if (asking === null && needsName(file())) asking = 'scope';
    }

    const stage: Stage = {
        set: (row: ConfigRow, value: unknown) => {
            const name = keyName(row.file, row.key);
            const base = writtenWhole(row.control) ? { base: row.value } : {};
            inner.stage(file(), name, { file: row.file, key: row.key, value, ...base });
            ask();
        },
        reset: (row) => {
            const name = keyName(row.file, row.key);
            inner.stage(file(), name, { file: row.file, key: row.key, reset: true });
            ask();
        },
        drop: (row) => inner.drop(file(), keyName(row.file, row.key)),
        held: (row) => heldOfChange(changes.get(file(), keyName(row.file, row.key)))
    };

    /** Save the changes of one file; whether they were written or there were none. */
    async function saveFile(name: string): Promise<boolean> {
        const going = target(name);
        if (going.kind === 'name') return false;
        if (going.kind === 'gone') {
            say(name, message('scopeGone', going.name));
            return false;
        }
        if (going.kind === 'blocked') {
            say(name, going.said);
            return false;
        }
        const body = saveOf(inner, name, {
            scope: going.scope,
            ...(going.root === undefined ? {} : { root: going.root }),
            digest: going.digest,
            downloads: () => deps.downloads(name)
        });
        if (body === null) return true;
        const sent = new Set(inner.of(name));
        const sentSecrets = new Map(inner.secretsOf(name));
        const answer = await deps.send(body);
        const refused = answered(answer, going.name);
        if (refused !== null) {
            say(name, refused);
            return false;
        }
        // A change or a secret typed while the Save was out is the reader's newer word and is kept.
        const left = inner.of(name).filter((one) => !sent.has(one));
        const typed = [...inner.secretsOf(name)].filter(
            ([service, secret]) => !sentSecrets.has(service) || sentSecrets.get(service) !== secret
        );
        inner.drop(name);
        for (const change of left) restage(name, change);
        for (const [service, secret] of typed) inner.stageSecret(name, service, secret);
        say(name, message('scopeSaved', going.name));
        return true;
    }

    /** Hold again a change made while its file's Save was out. */
    function restage(name: string, change: SaveChange): void {
        if ('key' in change) inner.stage(name, keyName(change.file, change.key), change);
        else if ('app' in change) inner.stage(name, appName(change.app), change);
        else if ('primary' in change) inner.stage(name, PRIMARY_NAME, change);
        else inner.stage(name, folderName(change.folder), change);
    }

    /** Whether a file's changes wait on the name question. */
    function needsName(name: string): boolean {
        return target(name).kind === 'name';
    }

    async function save(): Promise<boolean> {
        // A box's typed text is held by the save key's other saves, which run in the same turn.
        await tick();
        const name = file();
        if (inner.count(name) === 0) return true;
        if (needsName(name)) {
            asking = 'scope';
            return false;
        }
        return saveFile(name);
    }

    async function saveAll(): Promise<boolean> {
        await tick();
        const names = inner.files();
        if (names.some(needsName)) {
            asking = 'all';
            return false;
        }
        let all = true;
        for (const name of names) all = (await saveFile(name)) && all;
        return all;
    }

    async function named(name: string): Promise<void> {
        const going = asking;
        if (going === null || name.trim() === '') return;
        const answer = await deps.saveWorkspace(name.trim());
        const refused = answered(answer, name.trim());
        if (refused !== null) {
            say(UNSAVED, refused);
            return;
        }
        asking = null;
        waiting = going;
    }

    function resume(): void {
        const going = waiting;
        const ground = deps.ground();
        if (going === null || ground.workspaceFile === null) return;
        const saved = fileOf({ kind: 'workspace' }, ground);
        if (inner.count(UNSAVED) > 0) inner.move(UNSAVED, saved);
        // The file the workspace was saved as is written once the page has read it.
        if (target(saved).kind !== 'ready') return;
        waiting = null;
        void (going === 'all' ? saveAll() : saveFile(saved));
    }

    return {
        changes,
        stage,
        file,
        target,
        said: (name) => saying[name] ?? null,
        asking: () => asking,
        save,
        saveAll,
        named,
        cancelName: () => {
            asking = null;
        },
        discard: (name) => {
            inner.drop(name);
            say(name, null);
            if (name === UNSAVED) asking = null;
        },
        stageApp: (key, change) => {
            const name = file();
            if (change === null) inner.drop(name, appName(key));
            else if ('reset' in change) inner.stage(name, appName(key), { app: key, reset: true });
            else inner.stage(name, appName(key), { app: key, value: change.value });
        },
        heldApp: (key) => heldOfChange(changes.get(file(), appName(key))),
        stageWorkspace: (name, change) => {
            const workspace = fileOf({ kind: 'workspace' }, deps.ground());
            if (change === null) inner.drop(workspace, name);
            else inner.stage(workspace, name, change);
            ask();
        },
        heldWorkspace: (name) => {
            const held = changes.get(fileOf({ kind: 'workspace' }, deps.ground()), name);
            return held === undefined || 'key' in held || 'app' in held ? undefined : held;
        },
        resume
    };
}
