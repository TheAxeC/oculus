// Layer 2, client state. What a save of a LaTeX file asks of the builds (builds.ts): the build of
// the root it builds through when `latex.auto_build` is `on_save`, and the word count when
// `latex.texcount_autorun` is `on_save`. A save made inside `savingQuietly` asks for no build.
//
// A save can be made before the page holds its settings (the `config` message has not come, or its
// LaTeX settings did not read). Such a save is held, one per file, and the held saves are run
// together once a `config` message brings settings (`settingsMoved`): each held file's root is
// asked, and each main file they build through is counted and built once, so no save is lost and
// any number of saves made meanwhile, of one file or of several under one main, build once. A held
// file is quiet only when every save of it held was quiet, and a main builds when any of its held
// files is not quiet.
//
// The root a saved file builds through is asked of the server, and an answer to a save older than
// the newest of the same file is dropped, so a run of saves builds the newest one.

import { isLatexFile } from '../../../data/prose/latex.ts';
import type { LatexBuilding } from '../../../data/sources/config/settings/latex.ts';
import type { LatexTarget } from '../terminal/latex-target.ts';
import type { LatexCalls } from './calls.ts';

/** What the saves read of the rest of the page and of the builds. */
export type SaveDeps = {
    /** What a build and its follow-ups are set by, or null while the page holds no catalog. */
    settings: () => LatexBuilding | null;
    calls: Pick<LatexCalls, 'rootOf'>;
    /** Count the words of a main file. */
    count: (target: LatexTarget, main: string) => Promise<unknown>;
    /** Build a main file with no reader asking. */
    build: (target: LatexTarget, main: string) => Promise<void>;
    /** A quiet save of a file under `root` ended: a change on disk it made builds nothing. */
    quieted: (root: string) => void;
};

/** What one save asks for once its root is known: the main file it builds through and what. */
type Asked = { target: LatexTarget; main: string; builds: boolean; counts: boolean };

/** The saves of the LaTeX store. */
export type Saves = {
    /** Build the root a saved file builds through, when `latex.auto_build` says to. */
    onSaved: (root: string, path: string) => Promise<void>;
    /** A `config` message came: run the saves held while the page held no settings. */
    settingsMoved: () => void;
    /**
     * Run a save of a LaTeX file that starts no build: neither the `on_save` build nor the one a
     * change on disk would ask for.
     */
    savingQuietly: (root: string, path: string, save: () => Promise<void>) => Promise<void>;
};

export function createSaves(deps: SaveDeps): Saves {
    /** The newest save of each file, so an answer to an older one is dropped. */
    const saves = new Map<string, number>();

    /** The files being saved without a build, by root and path. */
    const quiet = new Set<string>();

    /** The saves made while the page held no settings, one per file by root and path. */
    const unsettled = new Map<string, { root: string; path: string; quiet: boolean }>();

    async function onSaved(root: string, path: string): Promise<void> {
        if (!isLatexFile(path)) return;
        const key = `${root}\n${path}`;
        const settings = deps.settings();
        if (settings === null) {
            const held = unsettled.get(key)?.quiet ?? true;
            unsettled.set(key, { root, path, quiet: held && quiet.has(key) });
            return;
        }
        await saved(settings, root, path, quiet.has(key));
    }

    /** What one save asks for under the settings: a build, a word count, both or neither. */
    async function saved(
        settings: LatexBuilding,
        root: string,
        path: string,
        quietly: boolean
    ): Promise<void> {
        const asked = await asks(settings, root, path, quietly);
        if (asked === null) return;
        if (asked.counts) void deps.count(asked.target, asked.main);
        if (asked.builds) await deps.build(asked.target, asked.main);
    }

    /**
     * What one save asks for, once its root is known: the main file it builds through and whether
     * it builds and counts; null when it asks for neither, when no root was found, or when a newer
     * save of the same file was made meanwhile.
     */
    async function asks(
        settings: LatexBuilding,
        root: string,
        path: string,
        quietly: boolean
    ): Promise<Asked | null> {
        const key = `${root}\n${path}`;
        const builds = settings.autoBuild === 'on_save' && !quietly;
        const counts = settings.texcountAutorun === 'on_save';
        if (!builds && !counts) return null;
        const mine = (saves.get(key) ?? 0) + 1;
        saves.set(key, mine);
        const found = await deps.calls.rootOf(root, path);
        if (found === null || saves.get(key) !== mine) return null;
        return { target: { root: found.root, path: found.path }, main: found.main, builds, counts };
    }

    function settingsMoved(): void {
        const settings = deps.settings();
        if (settings === null || unsettled.size === 0) return;
        const held = [...unsettled.values()];
        unsettled.clear();
        void runHeld(settings, held);
    }

    /**
     * The held saves run together: each file's root is asked, and each main file they build through
     * is counted once and built once, a build when any of its saves asks for one.
     */
    async function runHeld(
        settings: LatexBuilding,
        held: { root: string; path: string; quiet: boolean }[]
    ): Promise<void> {
        const answers = await Promise.all(
            held.map((one) => asks(settings, one.root, one.path, one.quiet))
        );
        const mains = new Map<string, Asked>();
        for (const asked of answers) {
            if (asked === null) continue;
            const key = `${JSON.stringify(asked.target)}\n${asked.main}`;
            const before = mains.get(key);
            mains.set(
                key,
                before === undefined ? asked : { ...before, builds: before.builds || asked.builds }
            );
        }
        for (const asked of mains.values()) {
            if (asked.counts) void deps.count(asked.target, asked.main);
            if (asked.builds) void deps.build(asked.target, asked.main);
        }
    }

    async function savingQuietly(
        root: string,
        path: string,
        save: () => Promise<void>
    ): Promise<void> {
        const key = `${root}\n${path}`;
        quiet.add(key);
        try {
            await save();
        } finally {
            quiet.delete(key);
            deps.quieted(root);
        }
    }

    return { onSaved, settingsMoved, savingQuietly };
}
