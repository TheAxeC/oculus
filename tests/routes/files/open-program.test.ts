// Layer 2, route tests. What the open endpoint hands to its opener, against files and folders under
// system temporary storage: a file only to the application `open.program_ext` names for its
// extension, and only when it carries no execute bit and is no Finder alias; a folder always, to be
// revealed. And the floor under macOS `open`, read as a rule and never run: nothing here runs
// `open`, and every case hands the endpoint an opener of its own. The alias flag is written with
// `xattr`, which only writes an attribute of a fixture file.
//
// A case that reaches the default FinderInfo reader, which runs `xattr`, or makes a FIFO is tagged
// slow; the other cases run in npm test.

import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { ProgramApps } from '../../../src/lib/data/helpers/files/opens-in-program.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import {
    handleOpen,
    openArgs,
    openable,
    openableAddress,
    readFinderInfo,
    type FinderInfoReader,
    type OpenTarget
} from '../../../src/lib/server/files/open.ts';
import { APPS, TOKEN, checkedIn, opened, request, withFiles } from './open-fixture.ts';
import { it } from '../../fixtures/scratch.ts';

const RUNS = 'the file would run rather than open';

/** Each body form over one path under the hub, relative to the hub. */
function forms(path: string): Record<string, unknown>[] {
    return [{ root: 'hub', path }, { path }];
}

/**
 * Post both forms and assert each is refused on `path` with the reason, the opener never called.
 */
async function refusedBoth(
    path: string,
    roots: Root[],
    apps: () => ProgramApps = checkedIn,
    reader: FinderInfoReader = readFinderInfo
): Promise<void> {
    const opener = vi.fn();
    for (const body of forms(path)) {
        const response = await handleOpen(request(body), TOKEN, roots, apps, opener, reader);
        expect(response.status, JSON.stringify(body)).toBe(403);
        expect(await response.json()).toEqual({
            error: RUNS,
            refused: [{ field: 'path', reason: RUNS }]
        });
    }
    expect(opener).not.toHaveBeenCalled();
}

/** Post both forms and assert each hands the opener the same target once. */
async function openedBoth(
    path: string,
    real: string,
    roots: Root[],
    apps: () => ProgramApps = checkedIn
): Promise<void> {
    const opener = vi.fn();
    for (const body of forms(path)) {
        const response = await handleOpen(request(body), TOKEN, roots, apps, opener);
        expect(response.status, JSON.stringify(body)).toBe(200);
    }
    const target = opened(real, apps());
    expect(opener.mock.calls).toEqual([[target], [target]]);
}

/** Set a file's FinderInfo to 32 bytes whose flags byte carries the given value. */
function writeFinderFlags(path: string, flags: number): void {
    const bytes = Array.from({ length: 32 }, (_, at) => (at === 8 ? flags : 0));
    const hex = bytes.map((one) => one.toString(16).padStart(2, '0')).join(' ');
    execFileSync('/usr/bin/xattr', ['-wx', 'com.apple.FinderInfo', hex, path]);
}

describe('a file handed to the application its extension names', () => {
    it(
        'opens a file of every extension the checked-in map names, with that application',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { folder, roots } = withFiles();
            expect(Object.keys(APPS).length).toBeGreaterThan(0);
            for (const suffix of Object.keys(APPS)) {
                const file = join(folder, `listed${suffix}`);
                writeFileSync(file, 'PK a document', { mode: 0o644 });
                await openedBoth(`projects/active/alpha/listed${suffix}`, file, roots);
            }
        }
    );

    it(
        'opens a listed extension written in mixed case',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { folder, roots } = withFiles();
            const file = join(folder, 'Report.DocX');
            writeFileSync(file, 'PK a document', { mode: 0o644 });
            await openedBoth('projects/active/alpha/Report.DocX', file, roots);
        }
    );

    it('refuses a double extension and every type the map names no application for, in either form', async () => {
        const { folder, roots } = withFiles();
        const names = [
            'report.docx.command',
            'bundle.zip',
            'meeting.ics',
            'person.vcf',
            'screen.vncloc',
            'profile.mobileconfig',
            'flow.shortcut',
            'run.command',
            'draft.odt'
        ];
        for (const name of names) {
            writeFileSync(join(folder, name), 'data\n', { mode: 0o644 });
            await refusedBoth(`projects/active/alpha/${name}`, roots);
        }
    });

    it('refuses an executable file with no extension, and a listed one with an execute bit', async () => {
        const { folder, report, roots } = withFiles();
        const script = join(folder, 'reproduce');
        writeFileSync(script, '#!/bin/sh\necho ran\n');
        chmodSync(script, 0o755);
        chmodSync(report, 0o755);
        await refusedBoth('projects/active/alpha/reproduce', roots);
        await refusedBoth('projects/active/alpha/report.docx', roots);
    });

    it('refuses a file whose first bytes are a Finder bookmark, named report.docx', async () => {
        const { report, roots } = withFiles();
        const bookmark = Buffer.concat([
            Buffer.from('book', 'latin1'),
            Buffer.alloc(4),
            Buffer.from('mark', 'latin1'),
            Buffer.alloc(52)
        ]);
        writeFileSync(report, bookmark, { mode: 0o644 });
        await refusedBoth('projects/active/alpha/report.docx', roots);
    });

    it(
        'opens a file that starts with book but has no mark after it',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { report, roots } = withFiles();
            const notBookmark = Buffer.concat([
                Buffer.from('book', 'latin1'),
                Buffer.alloc(4),
                Buffer.from('kept', 'latin1'),
                Buffer.alloc(52)
            ]);
            writeFileSync(report, notBookmark, { mode: 0o644 });
            await openedBoth('projects/active/alpha/report.docx', report, roots);
        }
    );

    it(
        'refuses a file whose FinderInfo carries the alias flag, and opens one whose flags do not',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { folder, report, roots } = withFiles();
            writeFinderFlags(report, 0x80);
            await refusedBoth('projects/active/alpha/report.docx', roots);
            const plain = join(folder, 'plain.docx');
            writeFileSync(plain, 'PK a document', { mode: 0o644 });
            writeFinderFlags(plain, 0x04);
            await openedBoth('projects/active/alpha/plain.docx', plain, roots);
        }
    );

    it('refuses a file whose FinderInfo read fails for any reason but its absence', async () => {
        const { roots } = withFiles();
        const failing: FinderInfoReader = () => Promise.reject(new Error('xattr: [Errno 1]'));
        await refusedBoth('projects/active/alpha/report.docx', roots, checkedIn, failing);
    });

    it(
        'reads a file with no FinderInfo as carrying none, and one with the flag as flagged',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { report } = withFiles();
            expect(await readFinderInfo(report)).toBeNull();
            writeFinderFlags(report, 0x80);
            const info = await readFinderInfo(report);
            expect(info?.length).toBe(32);
            expect(info?.[8]).toBe(0x80);
        }
    );

    it('refuses a symlink whose asked name has no application, pointing at a listed file', async () => {
        const { folder, report, roots } = withFiles();
        symlinkSync(report, join(folder, 'run.command'));
        await refusedBoth('projects/active/alpha/run.command', roots);
    });

    it('refuses a symlink with a listed name that points at a file off the map', async () => {
        const { folder, roots } = withFiles();
        writeFileSync(join(folder, 'run.command'), 'echo ran\n', { mode: 0o644 });
        symlinkSync(join(folder, 'run.command'), join(folder, 'notes.docx'));
        await refusedBoth('projects/active/alpha/notes.docx', roots);
    });

    it('refuses a listed file it cannot read', async () => {
        const { report, roots } = withFiles();
        chmodSync(report, 0o000);
        // A reader that finds no FinderInfo, so the unread first bytes alone refuse the file.
        const none: FinderInfoReader = () => Promise.resolve(null);
        try {
            await refusedBoth('projects/active/alpha/report.docx', roots, checkedIn, none);
        } finally {
            chmodSync(report, 0o644);
        }
    });

    it(
        'reads the map it is handed at the request: one naming .txt opens a .txt the checked-in map refuses',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { folder, roots } = withFiles();
            const notes = join(folder, 'notes.txt');
            writeFileSync(notes, 'plain text\n', { mode: 0o644 });
            const text = (): ProgramApps => ({ '.txt': 'com.apple.TextEdit' });
            await refusedBoth('projects/active/alpha/notes.txt', roots);
            await openedBoth('projects/active/alpha/notes.txt', notes, roots, text);
        }
    );

    it(
        'opens a file under a root when an earlier root in the list is gone',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { work, sheet } = withFiles();
            const roots = [
                { key: 'gone', dir: join(work, 'removed-since-it-was-saved') },
                { key: 'work', dir: work }
            ];
            const opener = vi.fn();
            const response = await handleOpen(
                request({ path: sheet }),
                TOKEN,
                roots,
                checkedIn,
                opener
            );
            expect(response.status).toBe(200);
            expect(opener.mock.calls).toEqual([[opened(realpathSync(sheet), APPS)]]);
        }
    );
});

describe('a folder, revealed and never opened', () => {
    it('reveals a plain folder, an application bundle and a folder holding Contents/Info.plist', async () => {
        const { folder, roots } = withFiles();
        mkdirSync(join(folder, 'Tool.app', 'Contents'), { recursive: true });
        writeFileSync(join(folder, 'Tool.app', 'Contents', 'Info.plist'), '<plist/>\n');
        mkdirSync(join(folder, 'Pane.prefPane'));
        for (const name of ['', '/Tool.app', '/Pane.prefPane']) {
            const path = `projects/active/alpha${name}`;
            await openedBoth(path, join(folder, name), roots);
            expect(opened(join(folder, name)).kind).toBe('folder');
        }
    });

    it('reveals a symlink named like a document that points at a folder, as that folder', async () => {
        const { folder, roots } = withFiles();
        mkdirSync(join(folder, 'sub'));
        symlinkSync(join(folder, 'sub'), join(folder, 'linkdir.docx'));
        await openedBoth('projects/active/alpha/linkdir.docx', join(folder, 'sub'), roots);
    });

    it('answers 500 naming the key when the map cannot be read, before anything is resolved', async () => {
        const { roots } = withFiles();
        const opener = vi.fn();
        const broken = (): ProgramApps => {
            throw new Error('config/behavior.yml: open.program_ext must map extensions');
        };
        const response = await handleOpen(
            request({ root: 'hub', path: 'projects/active/alpha' }),
            TOKEN,
            roots,
            broken,
            opener
        );
        expect(response.status).toBe(500);
        expect(((await response.json()) as { error: string }).error).toContain('open.program_ext');
        expect(opener).not.toHaveBeenCalled();
    });
});

describe('a path that is neither a regular file nor a folder', () => {
    it(
        'refuses a FIFO inside the root in either form without calling the opener',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { folder, roots } = withFiles();
            const fifo = join(folder, 'pipe.docx');
            execFileSync('mkfifo', [fifo]);
            expect(statSync(fifo).isFIFO()).toBe(true);
            const opener = vi.fn();
            const rooted = await handleOpen(
                request({ root: 'hub', path: 'projects/active/alpha/pipe.docx' }),
                TOKEN,
                roots,
                checkedIn,
                opener
            );
            const plain = await handleOpen(
                request({ path: 'projects/active/alpha/pipe.docx' }),
                TOKEN,
                roots,
                checkedIn,
                opener
            );
            expect(rooted.status).toBe(404);
            expect(((await rooted.json()) as { error: string }).error).toBe(
                'there is no file or folder at the path'
            );
            expect(plain.status).toBe(403);
            expect(((await plain.json()) as { error: string }).error).toBe(
                'the path is outside the configured roots'
            );
            expect(opener).not.toHaveBeenCalled();
        }
    );
});

describe('what macOS open is run with and the floor under it', () => {
    // The rule and the argument list are read here, never macOpenPath itself: a call that passed
    // would launch an application.
    it('names the application for a file and reveals a folder, the path last', () => {
        expect(
            openArgs({ kind: 'file', path: '/hub/report.docx', app: 'com.microsoft.Word' })
        ).toEqual(['-b', 'com.microsoft.Word', '/hub/report.docx']);
        expect(openArgs({ kind: 'folder', path: '/hub/projects' })).toEqual([
            '-R',
            '/hub/projects'
        ]);
    });

    it(
        'takes a real folder and a real listed file with a bundle id',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            const { folder, report } = withFiles();
            expect(await openable(opened(folder))).toBe(true);
            expect(await openable(opened(report))).toBe(true);
        }
    );

    it(
        'refuses a file with an execute bit, a bookmark head, an alias flag or no bundle id',
        { tags: ['slow'], timeout: 30_000 },
        async () => {
            // Every path is its own real path here, so each refusal is the rule named and not the
            // floor's real-path check.
            const files = withFiles();
            const folder = realpathSync(files.folder);
            const report = realpathSync(files.report);
            const script = join(folder, 'reproduce.docx');
            writeFileSync(script, 'PK\n');
            chmodSync(script, 0o755);
            const bookmark = join(folder, 'mark.docx');
            writeFileSync(bookmark, Buffer.concat([Buffer.from('book\0\0\0\0mark', 'latin1')]), {
                mode: 0o644
            });
            const flagged = join(folder, 'flagged.docx');
            writeFileSync(flagged, 'PK\n', { mode: 0o644 });
            writeFinderFlags(flagged, 0x80);
            const word = 'com.microsoft.Word';
            expect(await openable({ kind: 'file', path: script, app: word })).toBe(false);
            expect(await openable({ kind: 'file', path: bookmark, app: word })).toBe(false);
            expect(await openable({ kind: 'file', path: flagged, app: word })).toBe(false);
            expect(await openable({ kind: 'file', path: report, app: 'Word' })).toBe(false);
            expect(await openable({ kind: 'file', path: folder, app: word })).toBe(false);
            expect(await openable({ kind: 'folder', path: report })).toBe(false);
        }
    );

    it('resolves the path first: a symlink link.docx to a refused file is refused', async () => {
        const folder = realpathSync(withFiles().folder);
        const refused = join(folder, 'report.docx.command');
        writeFileSync(refused, 'echo ran\n', { mode: 0o644 });
        const link = join(folder, 'link.docx');
        symlinkSync(refused, link);
        expect(await openable({ kind: 'file', path: link, app: 'com.microsoft.Word' })).toBe(false);
    });

    it('refuses a relative path, an option and a path with nothing at it', async () => {
        const { hub } = withFiles();
        const word = 'com.microsoft.Word';
        expect(await openable({ kind: 'folder', path: join(hub, 'nothing-here') })).toBe(false);
        expect(await openable({ kind: 'folder', path: 'projects/active/alpha' })).toBe(false);
        expect(await openable({ kind: 'file', path: '-n', app: word })).toBe(false);
    });

    it('takes an https address and no other scheme for the calendar and mail links', () => {
        expect(openableAddress('https://calendar.google.com/event?eid=one')).toBe(true);
        expect(openableAddress('http://calendar.google.com/event?eid=one')).toBe(false);
        expect(openableAddress('javascript:alert(1)')).toBe(false);
        expect(openableAddress('file:///tmp/x')).toBe(false);
        expect(openableAddress('-a')).toBe(false);
        expect(openableAddress('/Applications/Calculator.app')).toBe(false);
    });
});

describe('Reveal in Finder for a file', () => {
    // The argument list and the floor are read here, never macOpenPath itself: a call that passed
    // would run Finder.
    it('reveals a file or a folder with -R, the path last', () => {
        expect(openArgs({ kind: 'reveal', path: '/hub/notes.txt' })).toEqual([
            '-R',
            '/hub/notes.txt'
        ]);
    });

    it('takes a real file and a real folder, whatever the file is and has', async () => {
        const { folder, report } = withFiles();
        const script = join(realpathSync(folder), 'reproduce.sh');
        writeFileSync(script, '#!/bin/sh\n', { mode: 0o755 });
        const plain = join(realpathSync(folder), 'plain.unlisted');
        writeFileSync(plain, 'x');
        for (const path of [folder, report, script, plain]) {
            expect(await openable({ kind: 'reveal', path: realpathSync(path) })).toBe(true);
        }
    });

    it('refuses a path that is missing, relative, not its own real path or an option', async () => {
        const { hub, folder } = withFiles();
        const real = realpathSync(folder);
        const link = join(realpathSync(hub), 'link-to-folder');
        symlinkSync(real, link);
        // The same folder by its own real path is taken, so each refusal below is the rule named.
        expect(await openable({ kind: 'reveal', path: real })).toBe(true);
        expect(await openable({ kind: 'reveal', path: join(real, 'nothing-here') })).toBe(false);
        expect(await openable({ kind: 'reveal', path: 'projects/active/alpha' })).toBe(false);
        expect(await openable({ kind: 'reveal', path: link })).toBe(false);
        expect(await openable({ kind: 'reveal', path: '-n' })).toBe(false);
    });

    it('hands the opener a reveal for a file the endpoint is asked to reveal, one with no application too', async () => {
        const { folder, report, roots } = withFiles();
        const plain = join(folder, 'plain.unlisted');
        writeFileSync(plain, 'x');
        const script = join(folder, 'reproduce.sh');
        writeFileSync(script, '#!/bin/sh\n', { mode: 0o755 });
        const opener = vi.fn();
        for (const name of ['report.docx', 'plain.unlisted', 'reproduce.sh']) {
            const response = await handleOpen(
                request({ root: 'hub', path: `projects/active/alpha/${name}`, reveal: true }),
                TOKEN,
                roots,
                checkedIn,
                opener
            );
            expect(response.status, name).toBe(200);
        }
        expect(opener.mock.calls).toEqual([
            [{ kind: 'reveal', path: realpathSync(report) }],
            [{ kind: 'reveal', path: realpathSync(plain) }],
            [{ kind: 'reveal', path: realpathSync(script) }]
        ]);
    });

    it('reveals a folder asked for with reveal, and refuses a missing path, a path out of its root and a root not served', async () => {
        const { folder, roots } = withFiles();
        const opener = vi.fn();
        const asked = async (body: Record<string, unknown>) =>
            handleOpen(request({ reveal: true, ...body }), TOKEN, roots, checkedIn, opener);
        const folderAnswer = await asked({ root: 'hub', path: 'projects/active/alpha' });
        expect(folderAnswer.status).toBe(200);
        expect(openArgs(opener.mock.calls[0][0] as OpenTarget)).toEqual([
            '-R',
            realpathSync(folder)
        ]);
        expect((await asked({ root: 'hub', path: 'projects/gone.txt' })).status).toBe(404);
        expect((await asked({ root: 'hub', path: '../../../../x' })).status).toBe(403);
        expect((await asked({ root: 'nowhere', path: 'a' })).status).toBe(400);
        expect(opener).toHaveBeenCalledOnce();
    });
});
