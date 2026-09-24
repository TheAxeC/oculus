// Layer 4, test. The launch note's writer run as the process a launcher runs: start, transcript and
// end; the builder's pid and its start time; writers at one moment; a lock held by a live writer
// and one left by a dead one; a garbled note; and the refusals.
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
import { parseStamp, systemProbe } from '../../../src/lib/server/sessions/registry.ts';
import {
    builderProcesses,
    pendingBuilders,
    readDispatches
} from '../../../src/lib/server/sessions/stores/dispatches.ts';
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

/** Run the writer under this home, with any further environment given, and wait for it. */
function run(dir: string, args: string[], env: Record<string, string> = {}): Promise<Ran> {
    return new Promise((done) => {
        const child = spawn(process.execPath, [SCRIPT, ...args], {
            env: { PATH: process.env.PATH ?? '', HOME: dir, ...env },
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

/** A file's text, or '' while it is not there. */
function readText(path: string): string {
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/** Poll until the predicate holds or the time runs out; the caller asserts what it wanted. */
async function waitFor(holds: () => boolean, ms: number): Promise<void> {
    const deadline = Date.now() + ms;
    while (!holds() && Date.now() < deadline) await sleep(50);
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
        // revert: bin/dispatch-note.mjs:377 => delete
        expect(record.pid).toBe(0);
        expect(record.pidStart).toBe('');
        expect(Date.parse(record.startedAt)).not.toBeNaN();

        const rollout = join(dir, 'rollout.jsonl');
        expect((await run(dir, ['transcript', id, rollout])).status).toBe(0);
        expect(records(note)[0].transcript).toBe(rollout);

        // revert: bin/dispatch-note.mjs:414 => delete
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
        // revert: bin/dispatch-note.mjs:239 => return content;
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
        // revert: bin/dispatch-note.mjs:239 => return content;
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
        // revert: bin/dispatch-note.mjs:259 => if (false) {
        const done = await run(dir, launch('after a dead holder'));
        expect(done.status).toBe(0);
        expect(records(note).map((record) => record.label)).toEqual(['after a dead holder']);
        expect(existsSync(lock)).toBe(false);
    });

    it('lands every record of many writers started at once against a lock a dead writer left', async () => {
        // Two writers holding the lock at once lose a record in some rounds and not others, so the
        // case runs 150 rounds, each with a fresh note and a lock a dead writer left. Its revert
        // judges every lock stale, live or not; a clearer that moves a live lock aside is proven by
        // one fixed interleaving in dispatch-note-race.test.ts.
        const labels = Array.from({ length: 24 }, (_, at) => `writer ${at}`);
        const lost: string[] = [];
        for (let round = 0; round < 150; round += 1) {
            const { dir, note, lock } = home();
            mkdirSync(join(dir, '.oculus'), { recursive: true });
            writeFileSync(lock, `${spawnSync(process.execPath, ['-e', '']).pid} left-behind`);
            // revert: bin/dispatch-note.mjs:166 => return true;
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
        // revert: bin/dispatch-note.mjs:166 => return !alive(holderOf(state.content));
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
        // revert: bin/dispatch-note.mjs:225 => delete
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
        // revert: bin/dispatch-note.mjs:289 => throw new Error('garbled');
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
        // revert: bin/dispatch-note.mjs:360 => if (false) {
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

describe("the builder's pid", () => {
    it('records the pid with the start time the reader reads for it', async () => {
        const { dir, note } = home();
        // The builder is pid 1, which runs from boot, so its start is apart from the writer's own;
        // nothing is sent to it but the signal 0 both sides ask with.
        // revert: bin/dispatch-note.mjs:110 => const done = spawnSync('ps', ['-o', 'lstart=', '-p', String(process.pid)], {
        const done = await run(dir, [...launch('with a pid'), '--pid', '1']);
        expect(done.status).toBe(0);
        const [record] = JSON.parse(readFileSync(note, 'utf8')) as Record<string, unknown>[];
        expect(record.pid).toBe(1);
        const recorded = parseStamp(String(record.pidStart));
        expect(recorded).not.toBeNull();
        expect(recorded?.utc).toBe(systemProbe.starts([1]).get(1));
    });

    it("records the start time in the C locale's words whatever locale the launcher runs in", async () => {
        const { dir, note } = home();
        const dutch = { LC_ALL: 'nl_NL.UTF-8', LANG: 'nl_NL.UTF-8' };
        // revert: bin/dispatch-note.mjs:113 => env: { ...process.env, TZ: 'UTC' }
        const done = await run(dir, [...launch('dutch'), '--pid', String(process.pid)], dutch);
        expect(done.status).toBe(0);
        expect(parseStamp(records(note)[0].pidStart)).not.toBeNull();
    });

    it('records a running pid whose start time `ps` cannot give, with an empty start', async () => {
        const { dir, note } = home();
        // A PATH that holds nothing, so the writer's `ps` fails while signal 0 answers; the writer
        // itself is started by node's own path and needs no PATH.
        const empty = join(dir, 'no-ps');
        mkdirSync(empty);
        const path = { PATH: empty };
        expect(spawnSync('ps', ['-p', '1'], { env: path }).error).toBeDefined();
        // revert: bin/dispatch-note.mjs:365 => const pidStart = pid === 0 ? '' : startOf(pid); if (pid !== 0 && pidStart === '') throw new Error(`--pid ${pid} names no running process`);
        const done = await run(dir, [...launch('no ps'), '--pid', '1'], path);
        expect(done.err).toBe('');
        expect(done.status).toBe(0);
        const [record] = JSON.parse(readFileSync(note, 'utf8')) as Record<string, unknown>[];
        expect(record.pid).toBe(1);
        expect(record.pidStart).toBe('');
    });

    it('refuses a pid no process has, and writes nothing', async () => {
        const { dir, note } = home();
        const gone = spawnSync(process.execPath, ['-e', '']).pid;
        // revert: bin/dispatch-note.mjs:364 => delete
        const done = await run(dir, [...launch('dead'), '--pid', String(gone)]);
        expect(done.status).toBe(1);
        expect(done.err).toBe(`dispatch-note: --pid ${gone} names no running process\n`);
        expect(existsSync(note)).toBe(false);
        expect(existsSync(join(dir, '.oculus'))).toBe(false);
    });

    it('refuses a pid that is empty, not a whole number above zero, or given twice', async () => {
        const { dir, note } = home();
        const live = String(process.pid);
        // revert: bin/dispatch-note.mjs:123 => if (false) {
        for (const value of [
            '',
            '0',
            '-3',
            'abc',
            '12x',
            '1.5',
            ' 7',
            '0x10',
            '99999999999999999999'
        ]) {
            const done = await run(dir, [...launch('bad'), '--pid', value]);
            expect(done.status).toBe(1);
            expect(done.err).toBe(`dispatch-note: --pid must be a process id: ${value}\n`);
        }
        const twice = await run(dir, [...launch('twice'), '--pid', live, '--pid', live]);
        expect(twice.status).toBe(1);
        expect(twice.err).toBe('dispatch-note: --pid is given twice\n');
        expect(existsSync(note)).toBe(false);
    });
});

describe('a launcher and a server in different time zones', () => {
    /** The writer records pid 1 in one zone, and the reader reads it back in another. */
    async function readAcrossZones(): Promise<boolean | undefined> {
        const { dir, note } = home();
        const writer = await run(dir, [...launch('zones'), '--pid', '1'], {
            TZ: 'Pacific/Kiritimati'
        });
        expect(writer.status).toBe(0);
        const saved = process.env.TZ;
        process.env.TZ = 'America/Los_Angeles';
        try {
            const pending = pendingBuilders(readDispatches(note));
            const starts = systemProbe.starts([1]);
            expect(starts.has(1)).toBe(true);
            return builderProcesses(pending, new Set([1]), starts).live.get(pending[0].id);
        } finally {
            if (saved === undefined) delete process.env.TZ;
            else process.env.TZ = saved;
        }
    }

    it('reads a running builder as running when the writer asked `ps` in UTC', async () => {
        // revert: bin/dispatch-note.mjs:113 => env: { ...process.env, LC_ALL: 'C' }
        expect(await readAcrossZones()).toBe(true);
    });

    it("reads a running builder as running when the reader takes the stamp's UTC reading", async () => {
        // revert: src/lib/server/sessions/stores/dispatches.ts:165 => return Math.abs(recorded.local - actual) <= PROC_START_SLACK ? 'running' : 'reused';
        expect(await readAcrossZones()).toBe(true);
    });
});

describe('the launch recipe', () => {
    it('records a detached builder under its own pid, takes its transcript later, and ends it', async () => {
        const { dir, note } = home();
        const idFile = join(dir, 'O99.id');
        const pidFile = join(dir, 'O99.pid');
        const exitFile = join(dir, 'O99.exit');
        const rollout = join(dir, 'rollout.jsonl');
        // The launch lines as the recipe runs them, with `sleep 3` for the builder: it runs as a
        // child of the wrapper, and its own pid is the one recorded, so a wrapper killed while the
        // builder lives never reads the builder done.
        const wrapper = [
            `nohup sh -c 'sleep 3 & builder=$!; node ${SCRIPT} start --launcher plan-orchestration --label O99 --harness codex --model gpt-test --parent parent-session --cwd ${dir} --pid $builder > ${idFile}; wait $builder; status=$?; node ${SCRIPT} end "$(cat ${idFile})"; echo "exit $status" > ${exitFile}' &`,
            `echo $! > ${pidFile}`
        ].join('\n');
        const env = { PATH: process.env.PATH ?? '', HOME: dir };
        // No pipe to this process, so the launch returns at once as it does in a runner's shell.
        expect(spawnSync('sh', ['-c', wrapper], { env, stdio: 'ignore' }).status).toBe(0);
        await waitFor(() => readText(idFile).trim() !== '', 10000);

        const [running] = records(note);
        // revert: bin/dispatch-note.mjs:377 => pid: 0,
        const parent = spawnSync('ps', ['-o', 'ppid=,comm=', '-p', String(Number(running.pid))], {
            encoding: 'utf8'
        }).stdout.trim();
        expect(parent).toMatch(new RegExp(`^${readText(pidFile).trim()}\\s+(?:\\S*/)?sleep$`));
        expect(running.endedAt).toBe('');
        // A later shell call knows the id only through the id file.
        const later = `node ${SCRIPT} transcript "$(cat ${idFile})" ${rollout}`;
        expect(spawnSync('sh', ['-c', later], { env }).status).toBe(0);
        expect(records(note)[0].transcript).toBe(rollout);

        await waitFor(() => readText(exitFile) !== '', 20000);
        expect(readText(exitFile)).toBe('exit 0\n');
        const [ended] = records(note);
        expect(ended.id).toBe(readText(idFile).trim());
        expect(Date.parse(ended.endedAt)).not.toBeNaN();
    });
});

describe('the lock beside the note', () => {
    it('is taken fresh by a writer that waited, so the others do not clear it while it writes', async () => {
        const { dir, lock } = home();
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        // The script is loaded first, so the lock's age is the writer's wait and nothing else.
        const { takeLock } = (await import(SCRIPT)) as {
            takeLock: (lock: string, waitMs: number) => string;
        };
        // A lock held by this live process, which ages out after the short wait the case passes.
        writeFileSync(lock, `${process.pid} held`);
        // revert: bin/dispatch-note.mjs:238 => delete
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
        // revert: bin/dispatch-note.mjs:192 => rmSync(lock, { force: true });
        breakStale(lock, '1 judged-dead');
        expect(readFileSync(lock, 'utf8')).toBe(`${process.pid} taken-since`);
        expect(existsSync(`${lock}.break`)).toBe(false);
        rmSync(dir, { recursive: true, force: true });
    });
});
