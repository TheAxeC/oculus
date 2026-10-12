// Layer 2, server. Find Claude transcripts and Codex rollouts once for every server consumer.

import { readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

export type TranscriptFile = {
    path: string;
    size: number;
    mtimeMs: number;
    ino: number;
};

export type ClaudeTranscriptOptions = {
    nested?: boolean;
};

/** A rollout is named `rollout-<stamp>-<uuid>.jsonl`, which distinguishes it from a transcript. */
export function isRollout(path: string): boolean {
    const name = basename(path);
    return name.startsWith('rollout-') && name.endsWith('.jsonl');
}

/** Every Claude transcript in the store, newest first, inside the window and capped. */
export function claudeTranscripts(
    store: string,
    windowDays: number,
    maxSessions: number,
    options: ClaudeTranscriptOptions = {}
): TranscriptFile[] {
    const cutoff = windowDays ? Date.now() - windowDays * 86400 * 1000 : null;
    const found: TranscriptFile[] = [];
    let projects;
    try {
        projects = readdirSync(store, { withFileTypes: true });
    } catch {
        return found;
    }
    for (const project of projects) {
        if (!project.isDirectory()) continue;
        collectClaude(join(store, project.name), found, cutoff, options.nested === true);
    }
    found.sort(newestFirst);
    return maxSessions ? found.slice(0, maxSessions) : found;
}

/** Newest first; files of one mtime keep a fixed order, so a longer listing extends a shorter. */
function newestFirst(a: TranscriptFile, b: TranscriptFile): number {
    return b.mtimeMs - a.mtimeMs || (a.path < b.path ? -1 : 1);
}

function collectClaude(
    folder: string,
    found: TranscriptFile[],
    cutoff: number | null,
    nested: boolean
): void {
    let entries;
    try {
        entries = readdirSync(folder, { withFileTypes: true });
    } catch {
        return;
    }
    for (const entry of entries) {
        const path = join(folder, entry.name);
        if (entry.isDirectory()) {
            if (nested) collectClaude(path, found, cutoff, true);
            continue;
        }
        if (!entry.name.endsWith('.jsonl')) continue;
        add(path, found, cutoff);
    }
}

/** Every Codex rollout under the store, newest first, inside the window and capped. */
export function codexRollouts(
    store: string,
    windowDays: number,
    maxSessions: number
): TranscriptFile[] {
    const cutoff = windowDays ? Date.now() - windowDays * 86400 * 1000 : null;
    const found: TranscriptFile[] = [];
    walk(store, found, cutoff);
    found.sort(newestFirst);
    return maxSessions ? found.slice(0, maxSessions) : found;
}

function walk(folder: string, found: TranscriptFile[], cutoff: number | null): void {
    let entries;
    try {
        entries = readdirSync(folder, { withFileTypes: true });
    } catch {
        return;
    }
    for (const entry of entries) {
        const path = join(folder, entry.name);
        if (entry.isDirectory()) {
            walk(path, found, cutoff);
            continue;
        }
        if (!isRollout(entry.name)) continue;
        add(path, found, cutoff);
    }
}

function add(path: string, found: TranscriptFile[], cutoff: number | null): void {
    try {
        const stat = statSync(path);
        if (cutoff === null || stat.mtimeMs >= cutoff) {
            found.push({ path, size: stat.size, mtimeMs: stat.mtimeMs, ino: stat.ino });
        }
    } catch {
        return;
    }
}
