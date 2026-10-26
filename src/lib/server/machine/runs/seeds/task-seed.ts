// Layer 2, server. What a hub task seeds an agent with: the task named by a reference
// (data/model/model-agents.ts `TaskRef`) read from the hub's files, answered as the seed text, the
// folder the agent starts in and the name of its terminal, or as the word that refuses it.
//
// The seed is built here and nowhere else. The page shows the text this module answers and sends it
// back with the start, and the start is refused when the text built again differs, so what runs is
// what the reader was shown. A task is an entry of a collection, a subtask of a manifest, or a
// subtask of an entry; the subtask is found by its key in the host's own list and must hold the
// `do` text the page drew, so a list whose items shifted never seeds the line that moved into its
// place. A line of a list is read by the keys the ticker uses (the position in a list, the key of a
// map) and, unlike the ticker's, a line with a blank `do` is kept, since a reference to it is
// answered with the task's id in place of its text.
//
// Every value that reaches the seed or the name has its control characters replaced by a space,
// because the seed becomes an argument of a process and the name a tmux option; the line feeds
// between the lines are the seed's own.

import { statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import { scalar, str, strings } from '../../../../data/helpers/guards.ts';
import { PROMPT_MAX } from '../../../../data/helpers/run/schedules.ts';
import type { PortfolioConfig, TaskRef } from '../../../../data/model/index.ts';
import { keyedRowsShape, readAs, wordShape } from '../../../../data/shapes/shapes.ts';
import { manifestDir } from '../../../../data/sources/manifests.ts';
import { hubManifests } from '../../../files/roots.ts';
import { entryOf, identityOf, readCollection } from '../../../files/fs/collections.ts';
import { inside, realPath } from '../../../core/paths.ts';
import { words } from '../../../core/words.ts';
import { NAME_MAX } from '../../pty/sessions.ts';

/** What a task reference is answered with. */
export type SeedAnswer =
    | { ok: true; seed: string; cwd: string; name: string }
    | { ok: false; word: 'task-unknown' | 'task-too-long' };

/** One line of a checklist: its key, its text, its deadline and whether it is done. */
type Line = { key: string; do: string; deadline: string; done: boolean };

const lineShape = z.union([
    z.string().transform((line) => ({ do: line, deadline: '', done: false })),
    z.object({ do: wordShape, deadline: wordShape, done: z.boolean().catch(false) })
]);

/** The lines of a `subtasks:` value, keyed as the ticker keys them. */
function linesOf(value: unknown): Line[] {
    return (readAs(keyedRowsShape, value) ?? []).flatMap(([key, held]) => {
        const line = readAs(lineShape, held);
        return line === null ? [] : [{ key, ...line }];
    });
}

/** The task's host, read from the hub: its title, its checklist, its fields and its file. */
type Host = {
    title: string;
    lines: Line[];
    fields: Record<string, unknown>;
    file: string;
    /** The absolute folder of the project the host is, or the empty string for an entry. */
    folder: string;
};

/** A value with each control character a space and its ends trimmed. */
function plain(value: string): string {
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
}

/** The projects of the hub's manifests by id, with their absolute folder. */
function projectFolders(hub: string, config: PortfolioConfig): Record<string, string> {
    const found: Record<string, string> = {};
    for (const manifest of hubManifests(hub, config)) {
        found[manifest.id] = manifestDir(hub, manifest);
    }
    return found;
}

/** The host a reference names, or null when the hub does not hold it. */
function hostOf(ref: TaskRef, hub: string, config: PortfolioConfig): Host | null {
    if (ref.collection === undefined) {
        if (ref.subtask === undefined) return null;
        const manifest = hubManifests(hub, config).find((one) => one.id === ref.id);
        if (manifest === undefined) return null;
        return {
            title: str(manifest.title) ?? '',
            lines: linesOf(manifest.subtasks),
            fields: manifest,
            file: manifest.file,
            folder: manifestDir(hub, manifest)
        };
    }
    const held = readCollection(hub, config, ref.collection);
    if (held === null) return null;
    const identity = identityOf(held, ref.id);
    const entry = identity === null ? undefined : entryOf(held, identity);
    if (identity === null || entry === undefined) return null;
    return {
        title: str(entry.title) ?? identity,
        lines: linesOf(entry.subtasks),
        fields: entry,
        file: held.file,
        folder: ''
    };
}

/**
 * The folder a funding scheme's `link:` names, or null: a folder inside the hub, or the folder of
 * a file inside it. A URL, a missing path and a path that leaves the hub name none.
 */
function linkFolder(hub: string, link: unknown): string | null {
    const named = typeof link === 'string' ? link.trim() : '';
    if (named === '' || /^[a-z][a-z0-9+.-]*:/i.test(named)) return null;
    const top = realPath(hub);
    const full = realPath(resolve(hub, named));
    if (top === null || full === null || !inside(full, top)) return null;
    let folder = full;
    try {
        if (!statSync(full).isDirectory()) folder = dirname(full);
    } catch {
        return null;
    }
    return inside(folder, top) ? join(hub, relative(top, folder)) : null;
}

/**
 * The folder the agent starts in: the project's, the scheme's (the entries of the collection whose
 * entry names the `funding` registry name their folder in `link:`), or the hub root.
 */
function folderOf(ref: TaskRef, host: Host, hub: string, config: PortfolioConfig): string {
    if (host.folder !== '') return host.folder;
    const listed = config.collections.find((one) => one.key === ref.collection);
    if (listed?.registry === 'funding') {
        if (ref.subtask === undefined) return hub;
        return linkFolder(hub, host.fields.link) ?? hub;
    }
    const projects = projectFolders(hub, config);
    const named = strings(host.fields.related).filter((id) => Object.hasOwn(projects, id));
    const only = new Set(named);
    return only.size === 1 ? projects[[...only][0]] : hub;
}

/** The name of a terminal: the catalog's sentence, cut at NAME_MAX units but never mid-pair. */
function nameOf(catalog: Record<string, string>, text: string): string {
    const whole = words(catalog, 'server.task.name', text);
    if (whole.length <= NAME_MAX) return whole;
    const last = whole.charCodeAt(NAME_MAX - 1);
    const splits = last >= 0xd800 && last <= 0xdbff;
    return whole.slice(0, splits ? NAME_MAX - 1 : NAME_MAX);
}

/**
 * The seed, folder and name of the task a reference names, or `task-unknown` when the hub does not
 * hold it (or holds a different line at its key) and `task-too-long` when the seed passes the
 * longest prompt a start carries.
 */
export function taskSeed(
    ref: TaskRef,
    hub: string,
    config: PortfolioConfig,
    catalog: Record<string, string>
): SeedAnswer {
    const unknown = { ok: false, word: 'task-unknown' } as const;
    if (ref.id === '') return unknown;
    const host = hostOf(ref, hub, config);
    if (host === null) return unknown;
    let own: string;
    let deadline = scalar(host.fields.deadline);
    let id = ref.id;
    if (ref.subtask !== undefined) {
        const line = host.lines.find((one) => one.key === ref.subtask?.key);
        if (line?.do !== ref.subtask.do) return unknown;
        own = line.do;
        deadline = line.deadline;
        id = line.key;
    } else {
        own = host.title;
    }
    const text = plain(own) === '' ? id : plain(own);
    const lines = [words(catalog, 'server.task.seed_title', text)];
    if (ref.subtask !== undefined && plain(host.title) !== '') {
        lines.push(words(catalog, 'server.task.seed_part_of', plain(host.title)));
    }
    if (plain(deadline) !== '') {
        lines.push(words(catalog, 'server.task.seed_deadline', plain(deadline)));
    }
    const note = plain(scalar(host.fields.note));
    if (ref.subtask === undefined && note !== '') {
        lines.push(words(catalog, 'server.task.seed_note', note));
    }
    const open = host.lines.filter((one) => !one.done && plain(one.do) !== '');
    if (ref.subtask === undefined && open.length > 0) {
        const listed = open.map((one) => plain(one.do)).join('; ');
        lines.push(words(catalog, 'server.task.seed_subtasks', listed));
    }
    lines.push(words(catalog, 'server.task.seed_file', relative(hub, host.file)));
    const seed = lines.join('\n');
    if (seed.length > PROMPT_MAX) return { ok: false, word: 'task-too-long' };
    return {
        ok: true,
        seed,
        cwd: folderOf(ref, host, hub, config),
        name: nameOf(catalog, text)
    };
}
