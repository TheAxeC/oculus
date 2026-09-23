// Layer 4, test. The launch note's writer run as the process a launcher runs: start, transcript and
// end; writers at one moment; a lock held by a live writer and one left by a dead one; a
// garbled note; and the refusals.
//
// Every run gets a home directory of its own under the temporary directory through HOME, so the
// note it writes is that home's ~/.oculus/dispatches.json and never the owner's.

import { spawn, spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    statSync,
    utimesSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

// A case that waits on a lock runs the writer's own wait, and the many-writer case runs 150
// rounds of 24 processes.
vi.setConfig({ testTimeout: 600000 });

const SCRIPT = resolve('bin/dispatch-note.mjs');

type Ran = { out: string; err: string; status: number | null };

/** A home directory under the temporary directory, and where its note is. */
function home(): { dir: string; note: string; lock: string } {
    const dir = scratchDir('oculus-dispatch-note-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const note = join(dir, '.oculus', 'dispatches.json');
    return { dir, note, lock: `${note}.lock` };
}

/** The flags of one launch, with a label of the case's choosing. */
function launch(label: string): string[] {
    return [
        'start',
        '--launcher',
        'plan-orchestration',
        '--label',
        label,
        '--harness',
        'codex',
        '--model',
        'gpt-test',
        '--parent',
        'parent-session',
        '--cwd',
        '/tmp/fixture/worktree'
    ];
}

/** Run the writer under this home and wait for it. */
function run(dir: string, args: string[]): Promise<Ran> {
    return new Promise((done) => {
        const child = spawn(process.execPath, [SCRIPT, ...args], {
            env: { PATH: process.env.PATH ?? '', HOME: dir },
            timeout: 25000
        });
        let out = '';
        let err = '';
        child.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()));
        child.stderr.on('data', (chunk: Buffer) => (err += chunk.toString()));
        child.on('close', (status) => done({ out, err, status }));
    });
}

type Note = Record<string, string>;

function records(note: string): Note[] {
    return JSON.parse(readFileSync(note, 'utf8')) as Note[];
}

function sleep(ms: number): Promise<void> {
    return new Promise((done) => setTimeout(done, ms));
}

describe('the launch note writer', () => {
    it('starts a record, sets its transcript, and stamps its end', async () => {
        const { dir, note } = home();
        const started = await run(dir, launch('O99'));
        expect(started.status).toBe(0);
        const id = started.out.trim();
        expect(id).toMatch(/^[0-9a-f-]{36}$/);
        const [record] = records(note);
        expect(record).toMatchObject({
            id,
            launcher: 'plan-orchestration',
            label: 'O99',
            harness: 'codex',
            model: 'gpt-test',
            parent: 'parent-session',
            cwd: '/tmp/fixture/worktree',
            transcript: '',
            endedAt: ''
        });
        expect(Date.parse(record.startedAt)).not.toBeNaN();

        const rollout = join(dir, 'rollout.jsonl');
        expect((await run(dir, ['transcript', id, rollout])).status).toBe(0);
        expect(records(note)[0].transcript).toBe(rollout);

        // revert: bin/dispatch-note.mjs:326 => delete
        const ended = await run(dir, ['end', id]);
        expect(ended.status).toBe(0);
        const stamp = records(note)[0].endedAt;
        expect(Date.parse(stamp)).not.toBeNaN();
        // A second end keeps the first stamp.
        await run(dir, ['end', id]);
        expect(records(note)[0].endedAt).toBe(stamp);
        expect(existsSync(`${note}.lock`)).toBe(false);
    });

    it('writers started at once all land their record', async () => {
        const { dir, note } = home();
        // Eight rather than two, so that without the lock two of them overwrite each other on every
        // run rather than on most.
        const labels = Array.from({ length: 8 }, (_, at) => `writer ${at}`);
        // revert: bin/dispatch-note.mjs:185 => return content;
        const all = await Promise.all(labels.map((label) => run(dir, launch(label))));
        expect(all.map((one) => one.status)).toEqual(labels.map(() => 0));
        expect(
            records(note)
                .map((record) => record.label)
                .sort()
        ).toEqual(labels);
    });

    it('waits for a lock a live writer holds, and keeps what that writer wrote', async () => {
        const { dir, note, lock } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        // This process is the live holder, so the writer must wait for it.
        writeFileSync(lock, `${process.pid} held-by-the-test`);
        // revert: bin/dispatch-note.mjs:185 => return content;
        const pending = run(dir, launch('waited'));
        await sleep(600);
        expect(existsSync(note)).toBe(false);
        writeFileSync(note, JSON.stringify([{ id: 'held', label: 'written under the lock' }]));
        rmSync(lock);
        const done = await pending;
        expect(done.status).toBe(0);
        expect(records(note).map((record) => record.label)).toEqual([
            'written under the lock',
            'waited'
        ]);
    });

    it('clears a lock whose holder is gone', async () => {
        const { dir, note, lock } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        // A process that has already exited is the holder the lock names.
        const gone = spawnSync(process.execPath, ['-e', '']).pid;
        writeFileSync(lock, `${gone} left-behind`);
        // revert: bin/dispatch-note.mjs:200 => if (false) {
        const done = await run(dir, launch('after a dead holder'));
        expect(done.status).toBe(0);
        expect(records(note).map((record) => record.label)).toEqual(['after a dead holder']);
        expect(existsSync(lock)).toBe(false);
    });

    it('lands every record of many writers started at once against a lock a dead writer left', async () => {
        // Two writers holding the lock at once lose a record in a few rounds of a hundred, so the
        // case runs 150 rounds, each with a fresh note and a lock a dead writer left. Its revert is
        // a clearer that moves the lock aside and links it back when it took a live writer's.
        const labels = Array.from({ length: 24 }, (_, at) => `writer ${at}`);
        const lost: string[] = [];
        for (let round = 0; round < 150; round += 1) {
            const { dir, note, lock } = home();
            mkdirSync(join(dir, '.oculus'), { recursive: true });
            writeFileSync(lock, `${spawnSync(process.execPath, ['-e', '']).pid} left-behind`);
            // revert: bin/dispatch-note.mjs:126-142 => const aside = `${lock}.aside-${process.pid}-${Math.random()}`; try { renameSync(lock, aside); } catch { return; } if (readText(aside) !== judged) { try { linkSync(aside, lock); } catch { /* taken */ } } rmSync(aside, { force: true });
            const all = await Promise.all(labels.map((label) => run(dir, launch(label))));
            const landed = records(note).length;
            if (all.some((one) => one.status !== 0) || landed !== labels.length) {
                lost.push(`round ${round}: ${landed} of ${labels.length}`);
            }
            rmSync(dir, { recursive: true, force: true });
        }
        expect(lost).toEqual([]);
    });

    it('clears a lock older than any write holds one, whatever process its pid now names', async () => {
        const { dir, note, lock } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        // This process is alive, so only the lock's age can say it is stale.
        writeFileSync(lock, `${process.pid} reused-pid`);
        const long = Date.now() / 1000 - 60;
        utimesSync(lock, long, long);
        const began = Date.now();
        // revert: bin/dispatch-note.mjs:113 => return !alive(holderOf(state.content));
        const done = await run(dir, launch('after a reused pid'));
        expect(done.status).toBe(0);
        expect(Date.now() - began).toBeLessThan(5000);
        expect(records(note).map((record) => record.label)).toEqual(['after a reused pid']);
    });

    it("removes what a killed writer left beside the note, and keeps a live writer's files", async () => {
        const { dir, note } = home();
        const folder = join(dir, '.oculus');
        mkdirSync(folder, { recursive: true });
        const gone = spawnSync(process.execPath, ['-e', '']).pid;
        const leftLock = join(folder, `dispatches.json.lock.${gone}-abcd1234`);
        const leftNote = join(folder, `dispatches.json.${gone}-abcdef123456.tmp`);
        const liveLock = join(folder, `dispatches.json.lock.${process.pid}-beef0000`);
        for (const file of [leftLock, leftNote, liveLock]) writeFileSync(file, 'x');
        // revert: bin/dispatch-note.mjs:171 => delete
        expect((await run(dir, launch('sweeps'))).status).toBe(0);
        expect(existsSync(leftLock)).toBe(false);
        expect(existsSync(leftNote)).toBe(false);
        expect(existsSync(liveLock)).toBe(true);
        expect(records(note)).toHaveLength(1);
    });

    it('starts a new list over a garbled note rather than failing the launch', async () => {
        const { dir, note } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        writeFileSync(note, '{ half a write');
        // revert: bin/dispatch-note.mjs:226 => throw new Error('garbled');
        const done = await run(dir, launch('over garble'));
        expect(done.status).toBe(0);
        expect(records(note).map((record) => record.label)).toEqual(['over garble']);
    });

    it('refuses a launch without a required flag or with an unknown harness or flag, and an unknown id', async () => {
        const { dir, note } = home();
        // The model is the one field a launch may leave out.
        const unmodelled = launch('x').filter((word) => word !== '--model' && word !== 'gpt-test');
        expect((await run(dir, unmodelled)).status).toBe(0);
        expect(records(note)[0].model).toBe('');
        // revert: bin/dispatch-note.mjs:277 => if (false) {
        const refused = [
            launch('x').filter((word) => word !== '--parent' && word !== 'parent-session'),
            launch('x').map((word) => (word === 'codex' ? 'gemini' : word)),
            [...launch('x'), '--colour', 'blue'],
            ['end', 'no-such-id'],
            ['transcript', 'no-such-id'],
            ['stop']
        ];
        for (const args of refused) {
            const done = await run(dir, args);
            expect(done.status).toBe(1);
            expect(done.err).toMatch(/^dispatch-note: /);
        }
        expect(records(note)).toHaveLength(1);
    });
});

describe('the lock beside the note', () => {
    it('is taken fresh by a writer that waited, so the others do not clear it while it writes', async () => {
        const { dir, lock } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        // A lock held by this live process, which ages out after the short wait the case passes.
        writeFileSync(lock, `${process.pid} held`);
        const { takeLock } = (await import(SCRIPT)) as {
            takeLock: (lock: string, waitMs: number) => string;
        };
        // revert: bin/dispatch-note.mjs:184 => delete
        takeLock(lock, 300);
        const { mtimeMs } = statSync(lock);
        expect(Date.now() - mtimeMs).toBeLessThan(300);
        rmSync(dir, { recursive: true, force: true });
    });

    it('is removed by a clearer only while it is still the lock the clearer judged dead', async () => {
        const { dir, lock } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        // The dead writer's lock was cleared and a live writer took a fresh one before the clearer
        // got to it: the clearer re-reads the lock and leaves the live one in place.
        writeFileSync(lock, `${process.pid} taken-since`);
        const { breakStale } = (await import(SCRIPT)) as {
            breakStale: (lock: string, judged: string) => void;
        };
        // revert: bin/dispatch-note.mjs:139 => rmSync(lock, { force: true });
        breakStale(lock, '1 judged-dead');
        expect(readFileSync(lock, 'utf8')).toBe(`${process.pid} taken-since`);
        expect(existsSync(`${lock}.break`)).toBe(false);
        rmSync(dir, { recursive: true, force: true });
    });
});
