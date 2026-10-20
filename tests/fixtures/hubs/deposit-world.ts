// Layer 4, test helper. What the deposit tests share: git over a throwaway path, a file written
// inside the throwaway tree and nowhere else, the write target of a hub in it, and the git
// configuration and committer the cases run under.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { isolateGit } from '../../server/git/refs/repo.ts';
import { test } from '../scratch.ts';

/** The committer of every commit of the deposit tests, theirs and the deposit's own. */
const COMMITTER = {
    GIT_AUTHOR_NAME: 't',
    GIT_AUTHOR_EMAIL: 't@t',
    GIT_COMMITTER_NAME: 't',
    GIT_COMMITTER_EMAIL: 't@t'
};

/** Run git in a repository with a committer of its own, and answer what it printed. */
export function gitIn(root: string, ...args: string[]): string {
    return execFileSync('git', ['-C', root, ...args], {
        encoding: 'utf8',
        env: { ...process.env, ...COMMITTER }
    });
}

/**
 * Replace the machine's git configuration by an empty file around every case of the calling file
 * (`isolateGit`), and name the committer in `process.env`, which the deposit's own commit reads,
 * since the empty configuration holds no identity.
 */
export function isolateDepositGit(): void {
    isolateGit();
    const held: Record<string, string | undefined> = {};
    test.beforeAll(() => {
        for (const [key, value] of Object.entries(COMMITTER)) {
            held[key] = process.env[key];
            process.env[key] = value;
        }
    });
    test.afterAll(() => {
        for (const [key, value] of Object.entries(held)) {
            if (value === undefined) Reflect.deleteProperty(process.env, key);
            else process.env[key] = value;
        }
    });
}

/** A file under a directory inside the throwaway tree `dir`, and nowhere else. */
export function writeInside(dir: string, root: string, name: string, body: string): void {
    const full = join(root, name);
    expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

/** The write target of the hub `hub` in the throwaway tree `dir`, its config's keys replaced. */
export function depositTarget(
    dir: string,
    hub: string,
    over: Partial<ReturnType<typeof portfolioConfigFrom>>
): WriteTarget {
    const loaded = loadConfig(engineDir()).config;
    return {
        hub,
        primary: 'hub',
        config: { ...portfolioConfigFrom(loaded), ...over },
        engine: engineDir(),
        engineConfig: () => loadConfig(engineDir()).config,
        career: careerRules(loaded),
        overrides: join(dir, 'sessions.json'),
        projects: () => [],
        bookmarks: join(dir, 'bookmarks.yml'),
        glyphs: []
    };
}
