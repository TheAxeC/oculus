// The session stores read from every account config/local.yml names: a second Claude account's
// registry and transcripts, a second Codex account's rollouts, and two accounts that share one
// folder through a symlink, read once.
//
// Every account folder is made here under the temporary directory, and the liveness probes are
// stubs: no test reads ~/.claude, ~/.claude-work, ~/.codex or ~/.oculus, and nothing is signalled.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { distinctFolders, sessionFolders } from '../../../src/lib/server/sessions/folders.ts';
import { scan } from '../../../src/lib/server/sessions/stores/transcripts.ts';
import type { Probe } from '../../../src/lib/server/sessions/registry.ts';
import type { SessionRecord, UsageAccountConfig } from '../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const SLUG = '-tmp-fixture-workspace';
const FIRST = 'aaaaaaaa-0000-0000-0000-000000000001';
const SECOND = 'aaaaaaaa-0000-0000-0000-000000000002';
const PID = 6161;

type Json = Record<string, unknown>;

/** One user prompt, stamped now, which is all a transcript needs to be a session. */
function prompt(text: string): string {
    const record: Json = {
        type: 'user',
        timestamp: new Date().toISOString(),
        cwd: '/tmp/fixture/workspace',
        origin: { kind: 'human' },
        message: { role: 'user', content: text }
    };
    return `${JSON.stringify(record)}\n`;
}

/** A home directory of account folders under the temporary directory. */
class Home {
    root = scratchDir('oculus-accounts-');
    alive = new Set<number>();

    constructor() {
        expect(resolve(this.root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    }

    /** An account folder under this home. */
    dir(name: string): string {
        const full = join(this.root, name);
        mkdirSync(full, { recursive: true });
        return full;
    }

    /** One Claude transcript in an account's store. */
    transcript(account: string, id: string, text: string): void {
        const folder = join(this.root, account, 'projects', SLUG);
        mkdirSync(folder, { recursive: true });
        writeFileSync(join(folder, `${id}.jsonl`), prompt(text));
    }

    /** One registry entry in an account's registry, for a process the probe says is running. */
    enrol(account: string, id: string, pid: number): void {
        const folder = join(this.root, account, 'sessions');
        mkdirSync(folder, { recursive: true });
        this.alive.add(pid);
        writeFileSync(
            join(folder, `${pid}.json`),
            JSON.stringify({ pid, sessionId: id, cwd: '/tmp/fixture/workspace', status: 'busy' })
        );
    }

    /** One Codex rollout in an account's store. */
    rollout(account: string, id: string): void {
        const folder = join(this.root, account, 'sessions', '2026', '09', '23');
        mkdirSync(folder, { recursive: true });
        const meta = {
            timestamp: new Date().toISOString(),
            type: 'session_meta',
            payload: { id, cwd: '/tmp/fixture/workspace' }
        };
        writeFileSync(
            join(folder, `rollout-2026-09-23T10-00-00-${id}.jsonl`),
            `${JSON.stringify(meta)}\n`
        );
    }

    probe(): Probe {
        return { running: (pid) => this.alive.has(pid), starts: () => new Map() };
    }

    scan(accounts: UsageAccountConfig[]): SessionRecord[] {
        return scan({
            ...sessionFolders(accounts),
            cachePath: join(this.root, 'oculus', 'transcript-cache.json'),
            overridesPath: join(this.root, 'oculus', 'sessions.json'),
            dispatchesPath: join(this.root, 'oculus', 'dispatches.json'),
            probe: this.probe(),
            codexProbe: { commands: () => [] }
        });
    }
}

function claude(dir: string, label: string): UsageAccountConfig {
    return { tool: 'claude', dir, label };
}

function codex(dir: string, label: string): UsageAccountConfig {
    return { tool: 'codex', dir, label };
}

describe('the account folders', () => {
    it('names the registry and the transcripts of a Claude account and the rollouts of a Codex one', () => {
        const home = new Home();
        const work = home.dir('claude-work');
        const cli = home.dir('codex');
        expect(sessionFolders([claude(work, 'work'), codex(cli, 'codex')])).toEqual({
            stores: [join(work, 'projects')],
            registries: [join(work, 'sessions')],
            codexStores: [join(cli, 'sessions')]
        });
    });

    it('keeps one folder per real path, under the path it was first named by', () => {
        const home = new Home();
        const real = home.dir('claude');
        const other = join(home.root, 'linked');
        symlinkSync(real, other);
        expect(distinctFolders([real, other, '', real])).toEqual([real]);
        expect(distinctFolders([other, real])).toEqual([other]);
    });
});

describe('the stores read every account', () => {
    it("reads a session live from a second Claude account's registry", () => {
        const home = new Home();
        const first = home.dir('claude');
        const second = home.dir('claude-work');
        home.transcript('claude-work', SECOND, 'from the second account');
        home.enrol('claude-work', SECOND, PID);
        const [record] = home.scan([claude(first, 'claude'), claude(second, 'work')]);
        expect(record.id).toBe(SECOND);
        expect(record.live).toBe(true);
        expect(record.pid).toBe(PID);
        expect(record.state).toBe('working');
    });

    it('lists the transcripts of two accounts with folders of their own', () => {
        const home = new Home();
        const first = home.dir('claude');
        const second = home.dir('claude-work');
        home.transcript('claude', FIRST, 'first account');
        home.transcript('claude-work', SECOND, 'second account');
        const ids = home.scan([claude(first, 'claude'), claude(second, 'work')]).map((r) => r.id);
        expect(ids.sort()).toEqual([FIRST, SECOND]);
    });

    it('lists a transcript once when two accounts share its folder through a symlink', () => {
        const home = new Home();
        const first = home.dir('claude');
        const second = home.dir('claude-work');
        home.transcript('claude', FIRST, 'shared');
        symlinkSync(join(first, 'projects'), join(second, 'projects'));
        const records = home.scan([claude(first, 'claude'), claude(second, 'work')]);
        expect(records.map((record) => record.id)).toEqual([FIRST]);
        expect(records[0].path).toBe(join(first, 'projects', SLUG, `${FIRST}.jsonl`));
    });

    it('lists the rollouts of two Codex accounts', () => {
        const home = new Home();
        const first = home.dir('codex');
        const second = home.dir('codex-work');
        home.rollout('codex', FIRST);
        home.rollout('codex-work', SECOND);
        const records = home.scan([codex(first, 'codex'), codex(second, 'work')]);
        expect(records.map((record) => record.id).sort()).toEqual([FIRST, SECOND]);
        expect(records.every((record) => record.tool === 'codex')).toBe(true);
        expect(records.map((record) => record.slug)).toEqual(['2026/09/23', '2026/09/23']);
    });

    it('audits that nothing is read when no account is named', () => {
        const home = new Home();
        home.transcript('claude', FIRST, 'unnamed');
        expect(home.scan([])).toEqual([]);
    });
});
