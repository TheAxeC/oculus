// Layer 2, route test. POST /api/website, Write the website (G140): a press writes the website's
// three files through the Files writer, one History record each that its Undo takes back, then runs
// `website.cv` in the website's folder as a task terminal after the approval a project command
// takes. A press is refused, with nothing written, while the user is not known, while
// `website.folder` names no folder or one that is not there, while a path of `website.files` cannot
// be used, while the last run of the command still runs, and when the writer cannot take one of the
// three files; a file the writer refuses after the first was written puts the written ones back.
// @module-tag slow: its cases write a hub copy of their own and time out under the load of a full
// run.
//
// The hub is a copy of tests/fixtures/hubs/demo/ whose settings file names the website folder
// inside it and the command, its portfolio built once by the watcher (hubs-fixture.ts), the user
// named by the copy's own `local.yml`. The writer is a WriteLog over the hub, the approvals file is
// in a scratch folder, and tmux is a double that runs nothing and keeps every call, so the case
// marks the command's end itself.

import {
    appendFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    realpathSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect } from 'vitest';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { localFile } from '../../../src/lib/data/sources/config/local.ts';
import type { OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import {
    approveTexts,
    chainLines,
    chainText
} from '../../../src/lib/server/machine/approvals/approvals.ts';
import { listTerminals } from '../../../src/lib/server/machine/pty/sessions.ts';
import {
    handleWebsitePost,
    type WebsiteWriteOptions
} from '../../../src/lib/server/machine/runs/website.ts';
import { noCredentials, pagePost } from '../../fixtures/doubles.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { copyHub, published } from '../../data/hubs/hubs-fixture.ts';
import { taskTmux } from '../../server/machine/runs/commands/commands-fixture.ts';
import { WriteLog } from '../write-log.ts';
import { HERE } from './terminal-fixture.ts';

/** The token the page holds. */
const TOKEN = 'a-website-token';

/** The website's folder inside the hub. */
const FOLDER = 'site';

/** The website's own file, as `website.files.site` ships it. */
const SITE_PATH = '_data/website.yml';

/** The CV's file, as `website.files.cv` ships it. */
const CV_PATH = '_data/data.yml';

/** The publications' file, as `website.files.papers` ships it. */
const PAPERS_PATH = '_data/publications.yml';

/** The employer CVs' file, as `website.files.industry` ships it. */
const INDUSTRY_PATH = '_data/industry.yml';

/** The three files a press writes, in the order it writes them. */
const GENERATED = [CV_PATH, PAPERS_PATH, INDUSTRY_PATH];

/** The command the settings file names. */
const CV = 'make cv';

/** The key of the demo's person who is the user. */
const SELF = 'rivera-lab';

/** One case's world: the hub, the website's folder, the writer, tmux and the approvals file. */
type World = {
    hub: string;
    site: string;
    log: WriteLog;
    tmux: ReturnType<typeof taskTmux>;
    approvals: string;
    snapshot: Snapshot;
    config: Record<string, unknown>;
};

let hub = '';
const log = new WriteLog('hub', () => hub);

/**
 * A hub whose settings file names the website folder `folder` (made unless `make` is false), the
 * command and the paths `files` of `website.files`, with the user set unless `self` is false.
 */
function worldOf(
    folder = FOLDER,
    make = true,
    self = true,
    files: Record<string, string> = {}
): World {
    hub = realpathSync(copyHub(scratchDir('oculus-website-'), 'hub'));
    const paths = Object.entries(files).map(([key, path]) => `    ${key}: '${path}'\n`);
    appendFileSync(
        join(hub, HUB_FILE),
        `\nwebsite:\n  folder: '${folder}'\n  cv: ${CV}\n  files:\n${paths.join('') || '    {}\n'}`
    );
    if (self) writeFileSync(localFile(hub), `self: ${SELF}\n`);
    const site = join(hub, folder);
    if (make && folder !== '') {
        mkdirSync(join(site, '_data'), { recursive: true });
        writeFileSync(join(site, SITE_PATH), 'programs: {}\n');
    }
    log.start('oculus-website-log-');
    const { snapshot } = published([{ name: 'hub', dir: hub }], 'hub');
    return {
        hub,
        site,
        log,
        tmux: taskTmux(HERE),
        approvals: join(scratchDir('oculus-website-approvals-'), 'approvals.json'),
        snapshot,
        config: loadConfig(engineDir(), { hub }).config
    };
}

/** The options of a press in the world, with the writer `files` gives. */
function optionsOf(world: World, files: () => OpsTarget = () => world.log.writer()) {
    const options: WebsiteWriteOptions = {
        primary: () => ({ key: 'hub', dir: world.hub }),
        config: () => world.config,
        snapshot: () => world.snapshot,
        files,
        approvalsFor: () => world.approvals,
        run: world.tmux.run,
        credentials: noCredentials()
    };
    return options;
}

/** One press, answered as status and body. */
async function press(
    world: World,
    options: WebsiteWriteOptions = optionsOf(world)
): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await handleWebsitePost(
        pagePost('http://127.0.0.1:8791/api/website', {}, TOKEN),
        TOKEN,
        options
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** Approve the command in the website's folder, as the approval dialog does. */
function approve(world: World): void {
    const text = chainText(world.site, chainLines(world.site, [{ cwd: world.site, run: CV }]));
    expect(approveTexts(world.approvals, [text])).toEqual({ ok: true });
}

/** Which of the three files are on disk. */
function onDisk(world: World): string[] {
    return GENERATED.filter((name) => existsSync(join(world.site, name)));
}

beforeEach(() => {
    hub = '';
});

/** A folder outside the hub, for the links of the rows below. */
function outsideFolder(): string {
    return scratchDir('oculus-website-outside-');
}

/**
 * The paths of `website.files` a press refuses: the paths set, what the row plants in the website's
 * folder and in a folder outside the hub, the file of that folder a link of the row leads to, which
 * the press leaves as it is, and the key and the value the refusal names.
 */
const BAD_PATHS: {
    row: string;
    files: Record<string, string>;
    plant?: (site: string, outside: string) => void;
    kept?: string;
    key: string;
    value: string;
}[] = [
    {
        row: 'the CV out of the folder',
        files: { cv: '../outside.yml' },
        key: 'website.files.cv',
        value: '../outside.yml'
    },
    {
        row: "the website's own file out of the folder",
        files: { site: '../outside.yml' },
        key: 'website.files.site',
        value: '../outside.yml'
    },
    {
        row: 'an absolute path whose joined folder is in the website',
        files: { cv: '/data/cv.yml' },
        plant: (site) => mkdirSync(join(site, 'data')),
        key: 'website.files.cv',
        value: '/data/cv.yml'
    },
    {
        row: 'a path through a link in the folder that points out of it',
        files: { papers: 'linked/papers.yml' },
        plant: (site, outside) => symlinkSync(outside, join(site, 'linked')),
        key: 'website.files.papers',
        value: 'linked/papers.yml'
    },
    {
        row: 'a file that is a link to a file out of the folder',
        files: {},
        plant: (site, outside) => {
            writeFileSync(join(outside, 'industry.yml'), 'kept: 1\n');
            symlinkSync(join(outside, 'industry.yml'), join(site, INDUSTRY_PATH));
        },
        kept: 'industry.yml',
        key: 'website.files.industry',
        value: INDUSTRY_PATH
    },
    {
        row: "the website's own file and the CV on one file",
        files: { site: CV_PATH },
        key: 'website.files.site',
        value: CV_PATH
    },
    {
        row: 'the CV and the publications on one file',
        files: { cv: PAPERS_PATH },
        key: 'website.files.cv',
        value: PAPERS_PATH
    },
    {
        row: 'an empty path',
        files: { cv: '' },
        key: 'website.files.cv',
        value: ''
    }
];

describe('a press of Write the website that is refused', () => {
    it('writes nothing and runs nothing while the user is not known', async () => {
        const world = worldOf(FOLDER, true, false);
        approve(world);
        expect(await press(world)).toEqual({
            status: 409,
            body: { error: 'website-no-person', names: [] }
        });
        expect(onDisk(world)).toEqual([]);
        expect(world.log.listed()).toEqual([]);
        expect(world.tmux.starts()).toEqual([]);
    });

    it('writes nothing while website.folder names no folder, and names a folder that is not there', async () => {
        const empty = worldOf('');
        expect((await press(empty)).body).toEqual({ error: 'website-no-folder', names: [] });
        expect(empty.log.listed()).toEqual([]);
        const missing = worldOf('elsewhere', false);
        expect((await press(missing)).body).toEqual({
            error: 'website-folder-missing',
            names: ['elsewhere']
        });
        expect(existsSync(missing.site)).toBe(false);
        expect(missing.log.listed()).toEqual([]);
        expect(missing.tmux.starts()).toEqual([]);
    });

    it('asks for the approval of a command text not yet approved and writes and runs nothing until it is given', async () => {
        const world = worldOf();
        const asked = await press(world);
        expect(asked).toEqual({
            status: 200,
            body: { approve: [{ folder: '.', run: CV }], repo: world.site }
        });
        expect(onDisk(world)).toEqual([]);
        expect(world.log.listed()).toEqual([]);
        expect(world.tmux.starts()).toEqual([]);
        approve(world);
        expect((await press(world)).body.written).toEqual([...GENERATED]);
        expect(world.tmux.starts()).toHaveLength(1);
    });

    it('writes none of the three when the writer cannot take one, naming that file', async () => {
        const world = worldOf();
        approve(world);
        mkdirSync(join(world.site, '_data', 'publications.yml'));
        expect((await press(world)).body).toEqual({
            error: 'website-unwritable',
            names: ['_data/publications.yml']
        });
        expect(world.log.listed()).toEqual([]);
        expect(onDisk(world)).toEqual(['_data/publications.yml']);
        expect(world.tmux.starts()).toEqual([]);
    });

    it('stops before the first write when a path of website.files names a folder that is not there', async () => {
        const world = worldOf(FOLDER, true, true, { papers: 'data/papers.yml' });
        approve(world);
        expect((await press(world)).body).toEqual({
            error: 'website-unwritable',
            names: ['data/papers.yml']
        });
        expect(world.log.listed()).toEqual([]);
        expect(onDisk(world)).toEqual([]);
        expect(world.tmux.starts()).toEqual([]);
    });

    for (const { row, files, plant, kept, key, value } of BAD_PATHS) {
        it(`names the key of a path of website.files that cannot be used, asks no approval and writes nothing: ${row}`, async () => {
            const world = worldOf(FOLDER, true, true, files);
            const outside = outsideFolder();
            plant?.(world.site, outside);
            expect(await press(world)).toEqual({
                status: 409,
                body: { error: 'website-bad-path', names: [key, value] }
            });
            expect(onDisk(world)).toEqual(kept === undefined ? [] : [value]);
            if (kept !== undefined) {
                expect(readFileSync(join(outside, kept), 'utf8')).toBe('kept: 1\n');
            }
            expect(world.log.listed()).toEqual([]);
            expect(world.tmux.starts()).toEqual([]);
        });
    }

    it("names the configured path of a website's own file that is not YAML, before an approval is asked", async () => {
        const world = worldOf(FOLDER, true, true, { site: 'data/own.yml' });
        mkdirSync(join(world.site, 'data'));
        writeFileSync(join(world.site, 'data', 'own.yml'), 'programs: [a\n  : :\n');
        expect((await press(world)).body).toEqual({
            error: 'website-site-unreadable',
            names: ['data/own.yml']
        });
        expect(world.log.listed()).toEqual([]);
    });

    it('puts the files it wrote back when a later file is refused once the press has begun', async () => {
        const world = worldOf();
        approve(world);
        const data = join(world.site, '_data', 'data.yml');
        const papers = join(world.site, '_data', 'publications.yml');
        writeFileSync(data, 'before: 1\n');
        // Another program makes a folder where the second file goes once the first is written.
        const writer = world.log.writer();
        const racing: OpsTarget = {
            ...writer,
            get roots() {
                if (readFileSync(data, 'utf8') !== 'before: 1\n' && !existsSync(papers)) {
                    mkdirSync(papers);
                }
                return writer.roots;
            }
        };
        expect(
            (
                await press(
                    world,
                    optionsOf(world, () => racing)
                )
            ).body
        ).toEqual({
            error: 'website-unwritable',
            names: ['_data/publications.yml']
        });
        expect(readFileSync(data, 'utf8')).toBe('before: 1\n');
        expect(existsSync(join(world.site, '_data', 'industry.yml'))).toBe(false);
        expect(world.tmux.starts()).toEqual([]);
    });

    it('is refused with the sentence that the command runs while its last run runs, writing nothing', async () => {
        const world = worldOf();
        approve(world);
        expect((await press(world)).body.ok).toBe(true);
        const records = world.log.listed().length;
        expect((await press(world)).body).toEqual({ error: 'website-running', names: [CV] });
        expect(world.log.listed()).toHaveLength(records);
        expect(world.tmux.starts()).toHaveLength(1);
    });
});

describe('a press of Write the website that is taken', () => {
    it('writes the three files with one History record each that Undo takes back, and keeps the status the command ended with', async () => {
        const world = worldOf();
        approve(world);
        const answer = await press(world);
        expect(answer.status).toBe(200);
        expect(answer.body.written).toEqual([...GENERATED]);
        expect(onDisk(world)).toEqual([...GENERATED]);
        const records = world.log.listed();
        expect(records).toHaveLength(3);
        const session = [...world.tmux.panes.keys()][0];
        world.tmux.end(session, 2);
        const listed = await listTerminals({ run: world.tmux.run });
        const terminal = answer.body.terminal as { id: string };
        expect(listed.find((one) => one.id === terminal.id)?.exit).toBe(2);
        for (const [at, name] of [...GENERATED].reverse().entries()) {
            await world.log.undoNewest();
            expect(onDisk(world)).toEqual(GENERATED.slice(0, GENERATED.length - at - 1));
            expect(existsSync(join(world.site, name))).toBe(false);
        }
    });

    it('writes the file website.files names and not the shipped one', async () => {
        const world = worldOf(FOLDER, true, true, { papers: 'data/papers.yml' });
        mkdirSync(join(world.site, 'data'));
        approve(world);
        expect((await press(world)).body.written).toEqual([
            CV_PATH,
            'data/papers.yml',
            INDUSTRY_PATH
        ]);
        expect(existsSync(join(world.site, 'data', 'papers.yml'))).toBe(true);
        expect(onDisk(world)).toEqual([CV_PATH, INDUSTRY_PATH]);
    });

    it("writes the three files while the website's own file at a configured path is missing", async () => {
        const world = worldOf(FOLDER, true, true, { site: 'data/own.yml' });
        approve(world);
        expect((await press(world)).body.written).toEqual([...GENERATED]);
    });

    it('runs the command again in the same terminal once its last run has ended', async () => {
        const world = worldOf();
        approve(world);
        await press(world);
        world.tmux.end([...world.tmux.panes.keys()][0], 1);
        expect((await press(world)).body.ok).toBe(true);
        expect(world.tmux.starts()).toHaveLength(1);
        expect(world.tmux.respawns()).toHaveLength(1);
        expect(world.log.listed()).toHaveLength(6);
    });
});
