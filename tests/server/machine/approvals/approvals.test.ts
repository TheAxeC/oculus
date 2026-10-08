// Layer 4, server test. The approvals file DESIGN.md's "Approval" paragraph describes, as the
// project commands use it: an unreadable file never written over, and the key and text of a LaTeX
// step's latexmkrc set and weave tools.
//
// The file path is handed in; a case never reads or writes the machine's own `~/.oculus`.

import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import {
    approveApp,
    approveLatex,
    approveTexts,
    approvedApps,
    chainText,
    debugText,
    isApproved,
    isLatexmkrcApproved,
    revokeApp
} from '../../../../src/lib/server/machine/approvals/approvals.ts';
import { enterHome, leaveHome } from '../runs/commands/commands-fixture.ts';

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

describe('the approvals file', () => {
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

    it('reads a file that is not JSON as no approved app and refuses an app approval or revoke over it', () => {
        const bytes = 'not json {';
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, bytes);
        expect(approvedApps(file).size).toBe(0);
        const app = { hash: 'a'.repeat(64), folder: join(home, 'apps', 'notes'), label: 'Notes' };
        const approved = approveApp(file, app);
        const revoked = revokeApp(file, app.folder);
        for (const refused of [approved, revoked]) {
            expect(refused.ok).toBe(false);
            expect(refused.ok ? '' : refused.error).toContain('approvals.json is not JSON');
        }
        expect(readFileSync(file, 'utf8')).toBe(bytes);
    });
});

describe('the latexmkrc and weave approvals of a LaTeX step', () => {
    const sha = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');
    const readApproved = (): string[] =>
        Object.keys(
            (JSON.parse(readFileSync(file, 'utf8')) as { approved: Record<string, unknown> })
                .approved
        );
    const RC = JSON.stringify([
        '/repo',
        [
            ['/repo/latexmkrc', 'a'.repeat(64)],
            ['/repo/manuscript/.latexmkrc', 'b'.repeat(64)]
        ]
    ]);
    const TOOL = { name: 'rnw2tex', command: 'Rscript', args: ['-e', 'knit()'] };
    const WEAVE = JSON.stringify({ repo: '/repo', weave: ['/repo/manuscript', [TOOL]] }, null, 1);

    it('keys a latexmkrc set under latexmkrc: and the SHA-256 of its text', () => {
        approveLatex(file, { latexmkrc: RC, weave: null });
        const keys = readApproved();
        expect(keys).toEqual([`latexmkrc:${sha(RC)}`]);
        expect(isLatexmkrcApproved(file, RC)).toBe(true);
        expect(isLatexmkrcApproved(file, RC.replace('a'.repeat(64), 'c'.repeat(64)))).toBe(false);
    });

    it('keeps the weave text apart from a chain and a debug launch under command:', () => {
        const lines = [{ folder: '.', run: 'Rscript -e knit()' }];
        expect(new Set([WEAVE, chainText('/repo', lines), debugText('/repo', '.', 'a')]).size).toBe(
            3
        );
        approveLatex(file, { latexmkrc: null, weave: WEAVE });
        expect(isApproved(file, WEAVE)).toBe(true);
        expect(isApproved(file, chainText('/repo', lines))).toBe(false);
        expect(isLatexmkrcApproved(file, WEAVE)).toBe(false);
    });

    it('writes both entries once, however many times the same texts are approved', () => {
        for (let again = 0; again < 2; again += 1) {
            expect(approveLatex(file, { latexmkrc: RC, weave: WEAVE }).ok).toBe(true);
        }
        const keys = readApproved();
        expect(keys.sort()).toEqual([`command:${sha(WEAVE)}`, `latexmkrc:${sha(RC)}`].sort());
    });

    it('refuses to write over an approvals file that is not JSON and leaves it (case 32)', () => {
        const bytes = 'not json {';
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, bytes);
        const refused = approveLatex(file, { latexmkrc: RC, weave: WEAVE });
        expect(refused.ok).toBe(false);
        expect(refused.ok ? '' : refused.error).toContain('approvals.json is not JSON');
        expect(readFileSync(file, 'utf8')).toBe(bytes);
    });

    it('writes neither entry when the file cannot be written, and names the reason (case 40)', () => {
        approveTexts(file, ['seed']);
        const before = readFileSync(file, 'utf8');
        chmodSync(file, 0o400);
        try {
            const refused = approveLatex(file, { latexmkrc: RC, weave: WEAVE });
            expect(refused.ok).toBe(false);
            expect(refused.ok ? '' : refused.error).toContain('approvals.json cannot be written');
        } finally {
            chmodSync(file, 0o600);
        }
        expect(readFileSync(file, 'utf8')).toBe(before);
        expect(isLatexmkrcApproved(file, RC)).toBe(false);
        expect(isApproved(file, WEAVE)).toBe(false);
    });
});
