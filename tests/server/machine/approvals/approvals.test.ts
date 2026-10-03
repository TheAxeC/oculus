// Layer 4, server test. The approvals file DESIGN.md's "Approval" paragraph describes, as the
// project commands use it: one `command:<sha256>` entry per approved text, the file private to its
// owner, written whole by rename and read back, and an unreadable file never written over.
//
// The file path is handed in; a case never reads or writes the machine's own `~/.oculus`.
//
// What this does NOT cover: the `app` entries of the apps (their folder field is kept untouched
// when a command is approved, which the case over a foreign entry asserts, and nothing else of
// them), and two processes approving at once, which the route's write chain orders.

import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import {
    approveTexts,
    chainLines,
    chainText,
    defaultApprovalsPath,
    isApproved
} from '../../../../src/lib/server/machine/approvals/approvals.ts';
import { enterHome, leaveHome } from '../commands/commands-fixture.ts';

let home = '';
let file = '';

beforeEach(() => {
    home = enterHome();
    file = join(home, '.oculus', 'approvals.json');
});

afterEach(() => {
    leaveHome();
});

const TEXT = '.\tmake test';

/** The key an entry of a text has in the file: `command:` and the SHA-256 of the text. */
const keyOf = (text: string): string =>
    `command:${createHash('sha256').update(text, 'utf8').digest('hex')}`;

/** The entries the file holds. */
const entries = (): Record<string, { label: string; at: string }> =>
    (JSON.parse(readFileSync(file, 'utf8')) as { approved: Record<string, never> }).approved;

describe('the approvals file', () => {
    it('names an entry command:<sha256 of the text> with the text as its label', () => {
        approveTexts(file, [TEXT]);
        expect(Object.keys(entries())).toEqual([keyOf(TEXT)]);
        expect(entries()[keyOf(TEXT)].label).toBe(TEXT);
        expect(defaultApprovalsPath()).toBe(join(home, '.oculus', 'approvals.json'));
    });

    it('asks again for a text nobody approved, and not for one that was', () => {
        expect(isApproved(file, TEXT)).toBe(false);
        expect(approveTexts(file, [TEXT], new Date('2026-10-02T10:00:00Z'))).toEqual({ ok: true });
        expect(isApproved(file, TEXT)).toBe(true);
        expect(isApproved(file, '.\tmake')).toBe(false);
        expect(isApproved(file, 'sub\tmake test')).toBe(false);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
            version: 1,
            approved: {
                [keyOf(TEXT)]: { label: TEXT, at: '2026-10-02T10:00:00.000Z' }
            }
        });
    });

    it('holds one entry for a text approved twice', () => {
        approveTexts(file, [TEXT, TEXT], new Date('2026-10-02T10:00:00Z'));
        approveTexts(file, [TEXT], new Date('2026-10-02T11:00:00Z'));
        expect(Object.keys(entries())).toEqual([keyOf(TEXT)]);
        expect(entries()[keyOf(TEXT)].at).toBe('2026-10-02T10:00:00.000Z');
    });

    it('writes the file private in a private folder, by rename, and reads it back', () => {
        expect(approveTexts(file, ['a'])).toEqual({ ok: true });
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(statSync(join(home, '.oculus')).mode & 0o777).toBe(0o700);
        const first = statSync(file).ino;
        expect(approveTexts(file, ['b'])).toEqual({ ok: true });
        // A rename puts a new file in place, which has another inode; a write in place keeps it.
        expect(statSync(file).ino).not.toBe(first);
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(isApproved(file, 'a')).toBe(true);
        expect(isApproved(file, 'b')).toBe(true);
    });

    it('makes a folder that stood with looser permissions private when it writes in it', () => {
        mkdirSync(dirname(file), { recursive: true });
        chmodSync(dirname(file), 0o755);
        expect(statSync(dirname(file)).mode & 0o777).toBe(0o755);
        expect(approveTexts(file, ['a'])).toEqual({ ok: true });
        expect(statSync(dirname(file)).mode & 0o777).toBe(0o700);
        expect(statSync(file).mode & 0o777).toBe(0o600);
    });

    it('leaves the folder of a file the approvals key names elsewhere as it stands', () => {
        const elsewhere = join(home, 'shared', 'approvals.json');
        mkdirSync(dirname(elsewhere), { recursive: true });
        chmodSync(dirname(elsewhere), 0o755);
        expect(approveTexts(elsewhere, ['a'])).toEqual({ ok: true });
        expect(statSync(dirname(elsewhere)).mode & 0o777).toBe(0o755);
        expect(statSync(elsewhere).mode & 0o777).toBe(0o600);
        const inHome = join(home, 'approvals.json');
        chmodSync(home, 0o755);
        expect(approveTexts(inHome, ['a'])).toEqual({ ok: true });
        expect(statSync(home).mode & 0o777).toBe(0o755);
    });

    it('leaves a default folder another user owns as it stands', () => {
        mkdirSync(dirname(file), { recursive: true });
        chmodSync(dirname(file), 0o755);
        const owner = process.getuid?.() ?? 0;
        const asked = vi.spyOn(process, 'getuid').mockReturnValue(owner + 4242);
        try {
            expect(approveTexts(file, ['a'])).toEqual({ ok: true });
        } finally {
            asked.mockRestore();
        }
        expect(statSync(dirname(file)).mode & 0o777).toBe(0o755);
    });

    it('makes a file that stood with looser permissions private when it writes it', () => {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, '{"version":1,"approved":{}}\n', { mode: 0o644 });
        chmodSync(file, 0o644);
        expect(approveTexts(file, ['a'])).toEqual({ ok: true });
        expect(statSync(file).mode & 0o777).toBe(0o600);
    });

    it('keeps an entry of another kind as it stood', () => {
        const app = { label: 'an app', at: '2026-01-01T00:00:00.000Z', folder: '/x/app' };
        approveTexts(file, ['seed']);
        const text = JSON.parse(readFileSync(file, 'utf8')) as {
            approved: Record<string, unknown>;
        };
        text.approved['app:abc'] = app;
        writeFileSync(file, JSON.stringify(text));
        approveTexts(file, [TEXT]);
        const after = JSON.parse(readFileSync(file, 'utf8')) as {
            approved: Record<string, unknown>;
        };
        expect(after.approved['app:abc']).toEqual(app);
        expect(isApproved(file, TEXT)).toBe(true);
    });

    it('reads a file that is not JSON as empty and refuses a write over it, leaving it', () => {
        approveTexts(file, ['seed']);
        const bytes = 'not json {';
        writeFileSync(file, bytes);
        expect(isApproved(file, 'seed')).toBe(false);
        const refused = approveTexts(file, [TEXT]);
        expect(refused.ok).toBe(false);
        expect(refused.ok ? '' : refused.error).toContain('approvals.json is not JSON');
        expect(readFileSync(file, 'utf8')).toBe(bytes);
    });

    it('reads a file of the wrong shape as empty and refuses a write over it', () => {
        approveTexts(file, ['seed']);
        for (const bytes of [
            '[]',
            '{"version":2,"approved":{}}',
            '{"version":1,"approved":[]}',
            '{"version":1,"approved":{"command:x":{"label":5,"at":"t"}}}'
        ]) {
            writeFileSync(file, bytes);
            expect(isApproved(file, 'seed')).toBe(false);
            const refused = approveTexts(file, [TEXT]);
            expect(refused.ok).toBe(false);
            expect(readFileSync(file, 'utf8')).toBe(bytes);
        }
    });
});

describe('the text a chain is approved by', () => {
    const REPO = '/work/repo';
    const line = (folder: string, run: string) => ({ folder, run });

    it('holds the folder of each command relative to the repository, and its line', () => {
        expect(
            chainLines(REPO, [
                { cwd: REPO, run: 'make' },
                { cwd: `${REPO}/sub/deep`, run: 'make test' }
            ])
        ).toEqual([line('.', 'make'), line('sub/deep', 'make test')]);
    });

    it('differs for another repository, another folder, another line and another order', () => {
        const base = chainText(REPO, [line('.', 'make'), line('sub', 'make test')]);
        approveTexts(file, [base]);
        for (const other of [
            chainText('/work/other', [line('.', 'make'), line('sub', 'make test')]),
            chainText(REPO, [line('.', 'make'), line('.', 'make test')]),
            chainText(REPO, [line('.', 'make -j4'), line('sub', 'make test')]),
            chainText(REPO, [line('sub', 'make test'), line('.', 'make')]),
            chainText(REPO, [line('sub', 'make test')])
        ]) {
            expect(isApproved(file, other)).toBe(false);
        }
        expect(isApproved(file, base)).toBe(true);
    });

    it('does not let a tab or a line break inside a field read as the boundary of two', () => {
        const texts = [
            [line('a\tb', 'c')],
            [line('a', 'b\tc')],
            [line('.', 'x'), line('.', 'y')],
            [line('.', 'x\n.\ty')]
        ].map((lines) => chainText(REPO, lines));
        expect(approveTexts(file, texts)).toEqual({ ok: true });
        expect(Object.keys(entries())).toHaveLength(texts.length);
    });

    it('is approved as one entry whatever the number of commands in the chain', () => {
        const text = chainText(REPO, [line('.', 'make'), line('sub', 'make test')]);
        expect(isApproved(file, text)).toBe(false);
        expect(approveTexts(file, [text])).toEqual({ ok: true });
        expect(isApproved(file, text)).toBe(true);
        expect(Object.keys(entries())).toEqual([keyOf(text)]);
        expect(isApproved(file, chainText(REPO, [line('.', 'make')]))).toBe(false);
    });
});
