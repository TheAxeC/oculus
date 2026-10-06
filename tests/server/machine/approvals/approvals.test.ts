// Layer 4, server test. The approvals file DESIGN.md's "Approval" paragraph describes, as the
// project commands use it: an unreadable file never written over.
//
// The file path is handed in; a case never reads or writes the machine's own `~/.oculus`.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import {
    approveApp,
    approveTexts,
    approvedApps,
    isApproved,
    revokeApp
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
