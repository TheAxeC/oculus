// Layer 3, view helper. The scopes of one Settings view: the unsaved changes of every file
// (state/system/config/scopes/changes.ts) made reactive, the stage the rows' writers hold their
// changes through in the scope on screen, the Save of one file, of the scope on screen and of every
// file, and the name question the unsaved workspace asks before its changes can be written.
//
// A Save sends the changes of one file as one write (data/shapes/config-save.ts), which History
// records once; an answer that lands drops them, keeping a change or a secret typed while the Save
// was out, and holding again what the file held before the Save for a change edited back to it
// meanwhile (`withdraw` of state/system/config/scopes/write.ts, `withdrawApp`,
// `withdrawWorkspace`): a row's value, or the taking out of a key the file did not hold, an app
// setting's value, the primary, or a renamed folder's old name; nothing is held when that is what
// the Save wrote, as when the file's new value reached the view before the answer. A Discard while
// the Save is out drops the change and holds nothing. Each Save keeps its own record of what it
// sent, so two Saves of one file out at once each hold again only the edits back of their own
// changes, and a refused Save gives up an edit back only when no other Save still out sent it. A
// landed Save then tells the view the slots of the rows it wrote (`wrote`), each key it sent that
// no such change replaced, so the family editors end those drafts; a refusal keeps the changes with
// its sentence under the scope bar and tells nothing. Save All saves each file with changes in the
// order its first change was made. The changes of the unsaved workspace wait for a name: the Save
// of its scope, or a Save All with it among the files, asks the question, and once the workspace is
// saved under that name (as Save Workspace As saves it) its changes move to the new file, which is
// written as soon as it is read, with every other file after it for a Save All. The changes of a
// hub or a repository that left the workspace are kept, said under the bar, and never written while
// it is away.

import { isEqual } from 'lodash-es';
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
import type { Slot } from '$lib/state/system/config/editors/slots';
import { message, type Message } from '$lib/state/system/config/messages';
import { writtenWhole, type ConfigRow } from '$lib/state/system/config/rows';
import type { ScopeFile } from '$lib/state/system/config/scopes/rows';
import { saveTarget, type SaveTarget } from '$lib/state/system/config/scopes/save';
import {
    fileOf,
    scopeOfFile,
    type Scope,
    type ScopeGround
} from '$lib/state/system/config/scopes/scope';
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
    /**
     * Told, once a Save's answer lands, the slots of the rows it wrote, leaving out a row changed
     * again or edited back to its file's value while the Save was out.
     */
    wrote: (slots: Slot[]) => void;
};

/** A change of the workspace file itself: its primary, or a folder's name. */
type WorkspaceChange = { primary: string } | { folder: string; name: string };

/** A Save of a file whose answer has not landed, with each change it sent by its name. */
type Out = { file: string; sent: Map<string, SaveChange> };

/**
 * The change that puts back what the file held before a Save that was out when the reader edited
 * its change back, and whether its row is written whole, the change then carrying the value it
 * replaces.
 */
type Back = { change: SaveChange; whole: boolean };

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
    /**
     * Drop the change of a setting an app declares, an edit having brought it back to what the
     * file holds (`back`), which is held again once a Save already out with the change lands.
     */
    withdrawApp: (key: string, back: Held) => void;
    /** The change held for a setting an app declares. */
    heldApp: (key: string) => Held | undefined;
    /**
     * Hold a change of the workspace file itself under its name (`PRIMARY_NAME`, `folderName`), or
     * drop it with null.
     */
    stageWorkspace: (name: string, change: WorkspaceChange | null) => void;
    /**
     * Drop the change of the workspace file held under a name, an edit having brought it back to
     * what the file holds, which is held again once a Save already out with the change lands.
     */
    withdrawWorkspace: (name: string) => void;
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
    /** The Saves whose answer has not landed. */
    const out: Out[] = [];
    /** By file and name, the changes edited back while a Save that sent them was out. */
    const backs = new Map<string, Map<string, Back>>();

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

    /** Forget that a change was edited back, a later change or a Discard being the newer word. */
    function unback(at: string, name: string): void {
        backs.get(at)?.delete(name);
        if (backs.get(at)?.size === 0) backs.delete(at);
    }

    /** The change a Save of a file still out sent under a name, the latest Save's first. */
    function outWith(at: string, name: string): SaveChange | undefined {
        return out.findLast((one) => one.file === at && one.sent.has(name))?.sent.get(name);
    }

    /** Keep what an edit back puts back, when a Save of the file is out with the change. */
    function keepBack(
        at: string,
        name: string,
        back: (sent: SaveChange) => Back | undefined
    ): void {
        const sent = outWith(at, name);
        const kept = sent === undefined ? undefined : back(sent);
        if (kept !== undefined) backs.set(at, new Map(backs.get(at)).set(name, kept));
    }

    const stage: Stage = {
        set: (row: ConfigRow, value: unknown) => {
            const name = keyName(row.file, row.key);
            const base = writtenWhole(row.control) ? { base: row.value } : {};
            unback(file(), name);
            inner.stage(file(), name, { file: row.file, key: row.key, value, ...base });
            ask();
        },
        reset: (row) => {
            const name = keyName(row.file, row.key);
            unback(file(), name);
            inner.stage(file(), name, { file: row.file, key: row.key, reset: true });
            ask();
        },
        drop: (row) => {
            const name = keyName(row.file, row.key);
            unback(file(), name);
            inner.drop(file(), name);
        },
        withdraw: (row) => {
            const at = file();
            const name = keyName(row.file, row.key);
            // While the row's change is out with a Save, the row holds what the file held before
            // that Save, the value the reader's edit brought it back to.
            const where = { file: row.file, key: row.key };
            keepBack(at, name, () => ({
                change: row.own ? { ...where, value: row.value } : { ...where, reset: true },
                whole: writtenWhole(row.control)
            }));
            inner.drop(at, name);
        },
        held: (row) => heldOfChange(changes.get(file(), keyName(row.file, row.key)))
    };

    /**
     * The change an edit back holds once the Save that was out with the change lands: what the
     * file held before that Save, over the value the Save wrote for a row written whole; none when
     * it is what the Save wrote, as when the file's new value reached the view before the answer.
     */
    function heldBack(back: Back, sent: Map<string, SaveChange>): SaveChange[] {
        const wrote = sent.get(nameOf(back.change)[0]);
        if (wrote !== undefined && isEqual(bare(wrote), bare(back.change))) return [];
        if (!back.whole || !('key' in back.change) || !('value' in back.change)) {
            return [back.change];
        }
        return [
            wrote !== undefined && 'value' in wrote
                ? { ...back.change, base: wrote.value }
                : back.change
        ];
    }

    /** A change without the value it replaces. */
    function bare(change: SaveChange): SaveChange {
        if (!('base' in change)) return change;
        const { base: _base, ...rest } = change;
        return rest;
    }

    /**
     * The edits back of a file's Save once its answer is in, taken out of `backs`: those of the
     * names it sent when it landed; when it was refused, none, a name another Save of the file
     * still out sent keeping its edit back for that Save.
     */
    function takeBacks(at: string, sent: Map<string, SaveChange>, landed: boolean): Back[] {
        const held = backs.get(at);
        if (held === undefined) return [];
        const taken: Back[] = [];
        for (const name of sent.keys()) {
            const back = held.get(name);
            if (back === undefined || (!landed && outWith(at, name) !== undefined)) continue;
            held.delete(name);
            if (landed) taken.push(back);
        }
        if (held.size === 0) backs.delete(at);
        return taken;
    }

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
        const mine: Out = {
            file: name,
            sent: new Map([...sent].map((change) => [nameOf(change)[0], change]))
        };
        out.push(mine);
        const answer = await deps.send(body);
        out.splice(out.indexOf(mine), 1);
        const refused = answered(answer, going.name);
        const edited = takeBacks(name, mine.sent, refused === null);
        if (refused !== null) {
            say(name, refused);
            return false;
        }
        // A change or a secret typed while the Save was out, and a change edited back to what
        // the file held meanwhile, are the reader's newer word and are kept.
        const left = inner.of(name).filter((one) => !sent.has(one));
        const back = edited.flatMap((one) => heldBack(one, mine.sent));
        const typed = [...inner.secretsOf(name)].filter(
            ([service, secret]) => !sentSecrets.has(service) || sentSecrets.get(service) !== secret
        );
        inner.drop(name);
        for (const change of [...left, ...back]) restage(name, change);
        for (const [service, secret] of typed) inner.stageSecret(name, service, secret);
        deps.wrote(writtenSlots(name, [...sent], [...left, ...back]));
        say(name, message('scopeSaved', going.name));
        return true;
    }

    /** The name a change is held under, as a list of one. */
    function nameOf(change: SaveChange): string[] {
        if ('key' in change) return [keyName(change.file, change.key)];
        if ('app' in change) return [appName(change.app)];
        if ('primary' in change) return [PRIMARY_NAME];
        return [folderName(change.folder)];
    }

    /**
     * The slots of the rows a landed Save of a file wrote: each key it sent that no change held
     * again after it replaced, under the hub or folder the file's scope keeps its drafts under.
     */
    function writtenSlots(name: string, sent: SaveChange[], kept: SaveChange[]): Slot[] {
        const hub = slotHub(name);
        const again = new Set(kept.flatMap(nameOf));
        return sent.flatMap((change) =>
            'key' in change && !again.has(keyName(change.file, change.key))
                ? [{ file: change.file, key: change.key, ...(hub === undefined ? {} : { hub }) }]
                : []
        );
    }

    /**
     * The hub or folder the rows of a file's scope keep their drafts under (`row.slot`): none for
     * the primary's files and the workspace file. It must agree with the three places that give a
     * row its slot: `localRows` in state/system/config/rows.ts (`slot` unless the hub is the
     * primary), `repoRow` in the same file (`slot: root`), and `withHubs` in
     * state/system/config/view/hub-settings.svelte.ts (`slot: of.hub`).
     */
    function slotHub(name: string): string | undefined {
        const primary = deps.ground().primary;
        const scope = scopeOfFile(name, primary);
        if (scope?.kind === 'repo') return scope.root;
        if (scope?.kind === 'hub' || scope?.kind === 'local') {
            return scope.hub === primary ? undefined : scope.hub;
        }
        return undefined;
    }

    /**
     * Hold again, once its file's Save lands, a change made while the Save was out or the change
     * of a row edited back meanwhile.
     */
    function restage(name: string, change: SaveChange): void {
        inner.stage(name, nameOf(change)[0], change);
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
            backs.delete(name);
            say(name, null);
            if (name === UNSAVED) asking = null;
        },
        stageApp: (key, change) => {
            const name = file();
            unback(name, appName(key));
            if (change === null) inner.drop(name, appName(key));
            else if ('reset' in change) inner.stage(name, appName(key), { app: key, reset: true });
            else inner.stage(name, appName(key), { app: key, value: change.value });
        },
        withdrawApp: (key, back) => {
            const name = file();
            const change: SaveChange =
                'reset' in back ? { app: key, reset: true } : { app: key, value: back.value };
            keepBack(name, appName(key), () => ({ change, whole: false }));
            inner.drop(name, appName(key));
        },
        heldApp: (key) => heldOfChange(changes.get(file(), appName(key))),
        stageWorkspace: (name, change) => {
            const workspace = fileOf({ kind: 'workspace' }, deps.ground());
            unback(workspace, name);
            if (change === null) inner.drop(workspace, name);
            else inner.stage(workspace, name, change);
            ask();
        },
        withdrawWorkspace: (name) => {
            const workspace = fileOf({ kind: 'workspace' }, deps.ground());
            // The primary goes back to the one the file holds; a folder renamed by the Save gets
            // its old name back, the file then naming it by the new one.
            const primary = deps.ground().primary;
            keepBack(workspace, name, (sent) => {
                if ('folder' in sent) {
                    return { change: { folder: sent.name, name: sent.folder }, whole: false };
                }
                return primary === null ? undefined : { change: { primary }, whole: false };
            });
            inner.drop(workspace, name);
        },
        heldWorkspace: (name) => {
            const held = changes.get(fileOf({ kind: 'workspace' }, deps.ground()), name);
            return held === undefined || 'key' in held || 'app' in held ? undefined : held;
        },
        resume
    };
}
