// Layer 2, route tests. POST /api/commands: the approval of the chain a run asks for, and the saves
// of the form. The handlers are called with a scratch repository as the one served root, a scratch
// home, a write chain and a change log in the scratch home.
//
// What this does NOT cover: the origin rule, which hooks.server.ts applies to every request under
// /api/ ahead of a route seeing it (tests/server/root/hooks-server.test.ts).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import {
    handleCommandsPost,
    type CommandsOptions
} from '../../../src/lib/server/machine/commands/routes.ts';
import {
    chainText,
    defaultApprovalsPath,
    isApproved
} from '../../../src/lib/server/machine/approvals/approvals.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { ChangeLog } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import {
    commandsYml,
    enterHome,
    leaveHome,
    plant,
    plantRepo
} from '../../server/machine/commands/commands-fixture.ts';

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';

let home = '';
let repo = '';
let log: ChangeLog;

beforeEach(() => {
    home = enterHome();
    repo = plantRepo({}, ['sub']);
    plant(repo, '.oculus/commands.yml', commandsYml('  - { name: build, run: make }\n'));
    log = { file: join(home, '.oculus', 'changes.jsonl'), keep: 100, writes: fsWrites() };
});

afterEach(() => {
    leaveHome();
});

function mine(): CommandsOptions {
    return {
        rootsFor: () => [repo],
        approvalsFor: () => defaultApprovalsPath(),
        configFor: () => loadConfig(engineDir()).config,
        writes: log.writes,
        changes: log
    };
}

function post(body: unknown, token = TOKEN): Request {
    return pagePost(`${HOST}/api/commands`, body, token);
}

describe('POST /api/commands', () => {
    it('refuses a request without the write token', async () => {
        const response = await handleCommandsPost(
            post({ action: 'approve', repo, chain: [{ folder: '.', run: 'a' }] }, 'wrong'),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(403);
        expect(
            isApproved(defaultApprovalsPath(), chainText(repo, [{ folder: '.', run: 'a' }]))
        ).toBe(false);
    });

    it('refuses to write over a commands.json that is not the shape, leaving it', async () => {
        plant(home, '.oculus/commands.json', '["not", "a map"]');
        const response = await handleCommandsPost(
            post({ action: 'save', repo, command: { name: 'a', run: 'x' } }),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(409);
        expect(readFileSync(join(home, '.oculus', 'commands.json'), 'utf8')).toBe(
            '["not", "a map"]'
        );
    });
});
