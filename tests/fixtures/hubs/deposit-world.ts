// Layer 4, test helper. What the deposit tests share: git over a throwaway path, a file written
// inside the throwaway tree and nowhere else, and the write target of a hub in it.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';

/** Run git in a repository with a committer of its own, and answer what it printed. */
export function gitIn(root: string, ...args: string[]): string {
    return execFileSync('git', ['-C', root, ...args], {
        encoding: 'utf8',
        env: {
            ...process.env,
            GIT_AUTHOR_NAME: 't',
            GIT_AUTHOR_EMAIL: 't@t',
            GIT_COMMITTER_NAME: 't',
            GIT_COMMITTER_EMAIL: 't@t'
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
        career: careerRules(loaded),
        overrides: join(dir, 'sessions.json'),
        projects: () => [],
        bookmarks: join(dir, 'bookmarks.yml'),
        behaviorFile: join(dir, 'behavior.yml'),
        layoutFile: join(dir, 'layout.yml'),
        glyphs: []
    };
}
