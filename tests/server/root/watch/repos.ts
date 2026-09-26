// Layer 4, test helper. What the git watcher's cases share: a throwaway repository and a git
// command confined to the system temporary directory, a sessions payload naming workspaces, the
// git channel's payloads as a recording received them, and a clock whose ticks the case runs. The
// git reader's cases make their repositories and run their git commands through these too.
//
// The cases over the saved workspaces file are a file of their own beside the git watcher's other
// cases, and both read these, so a repository, a payload and a tick are made one way. The mail
// poller's cases over its notes poll run on the same clock.

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect } from 'vitest';
import type { Hub } from '../../../../src/lib/server/core/channels.ts';
import type { Clock } from '../../../../src/lib/server/core/file-poll.ts';
import type { GitPayload, Message, SessionsPayload } from '../../../../src/lib/data/model/index.ts';

/** A git command inside the throwaway directory, and nowhere else, whatever it answers. */
function spawnGit(root: string, args: string[]): ReturnType<typeof spawnSync> {
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Test',
            '-c',
            'commit.gpgsign=false',
            '-C',
            root,
            ...args
        ],
        { encoding: 'utf8', timeout: 30000 }
    );
}

/** A git command that may fail, as a merge that stops on conflicts does; answers its status. */
export function tryGit(root: string, ...args: string[]): number | null {
    return spawnGit(root, args).status;
}

/** A git command that must succeed; answers what it printed. */
export function gitText(root: string, ...args: string[]): string {
    const done = spawnGit(root, args);
    expect(done.status).toBe(0);
    return String(done.stdout);
}

/** A git command that must succeed, for a case that reads nothing it printed. */
function git(root: string, ...args: string[]): void {
    gitText(root, ...args);
}

export function put(root: string, rel: string, body: string): void {
    const full = join(root, rel);
    expect(resolve(full).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/** One repository with a single commit on branch `work`, made in the given directory. */
export function repositoryIn(dir: string, name: string): string {
    const root = join(dir, name);
    mkdirSync(root);
    git(root, 'init', '--initial-branch=work');
    put(root, 'kept.txt', 'one\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'first');
    return root;
}

/** Commit everything the repository's worktree holds now, for a case whose setup tracks more. */
export function commitAll(root: string, message: string): void {
    git(root, 'add', '-A');
    git(root, 'commit', '-m', message);
}

/** Every payload the `git` channel sent, in order. */
export function payloads(got: Message[]): GitPayload[] {
    return got
        .filter((message) => message.channel === 'git')
        .map((message) => message.payload as GitPayload);
}

/** The newest payload the `git` channel sent; a case with none fails here. */
export function latest(got: Message[]): GitPayload {
    const found = payloads(got);
    expect(found.length).toBeGreaterThan(0);
    return found[found.length - 1];
}

/**
 * A clock whose window the test closes: nothing the watcher scheduled runs until fire() runs it.
 */
export type Manual = { clock: Clock; fire(): void; pending(): number };

/**
 * The timer pair a watcher is handed instead of the globals. A read scheduled on it waits for the
 * test rather than for the wall clock, so a machine under load cannot end a throttle window between
 * two writes the case makes inside it.
 */
export function manual(): Manual {
    const scheduled = new Map<number, () => void>();
    let next = 0;
    return {
        clock: {
            setTimeout: (run: () => void): number => {
                next += 1;
                scheduled.set(next, run);
                return next;
            },
            clearTimeout: (timer) => {
                scheduled.delete(timer as number);
            }
        },
        fire(): void {
            const held = [...scheduled.values()];
            scheduled.clear();
            for (const run of held) run();
        },
        pending(): number {
            return scheduled.size;
        }
    };
}

/** A sessions payload naming the given roots, which is all of one this watcher reads. */
export function announce(hub: Hub, roots: string[]): void {
    const payload: SessionsPayload = {
        records: [],
        terminals: [],
        workspaces: roots.map((root) => ({
            key: root,
            name: root.split(sep).pop() ?? root,
            lastActivity: null,
            areas: []
        }))
    };
    hub.publish('sessions', payload);
}
