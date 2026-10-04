// Layer 2, server test. What a composer start runs (server/machine/pty/compose.ts): the argument
// vector out of config/catalogs/agents.yml and the picks, the prompt as the vector's one last word.

import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { compose, readAgentsFile } from '../../../../src/lib/server/machine/pty/compose.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import type { AgentAccount, ComposeStart } from '../../../../src/lib/data/model/index.ts';
import { it, scratchDir, test } from '../../../fixtures/scratch.ts';

vi.setConfig({ testTimeout: 30000 });

const ENGINE = engineDir();
const CHOICES = readAgentsFile(ENGINE).agents;
const BIN = '/opt/Claude Code/claude';
// The scratch folders are made before the file's first case, so a run that skips every case makes
// none.
let WORK = '';
let SECOND = '';

/** Two Claude accounts, the tool's own folder first, and one Codex account of a scratch folder. */
const ACCOUNTS: AgentAccount[] = [];

test.beforeAll(() => {
    WORK = scratchDir('oculus-compose-');
    SECOND = scratchDir('oculus-account-');
    ACCOUNTS.push(
        { tool: 'claude', label: 'Home', dir: join(homedir(), '.claude') },
        { tool: 'claude', label: 'University', dir: SECOND },
        { tool: 'codex', label: 'Work', dir: SECOND }
    );
});

function start(over: Partial<ComposeStart>): ComposeStart {
    return {
        agent: 'claude',
        cwd: WORK,
        account: '',
        picks: {},
        prompt: 'hello',
        images: [],
        ...over
    };
}

describe('a composed start', () => {
    it('runs the agent with its picks, `--` and the prompt as one last word', () => {
        const composed = compose(
            start({ picks: { model: 'opus', mode: 'plan' }, prompt: '-p a "quoted" $HOME' }),
            CHOICES,
            ACCOUNTS,
            BIN
        );
        expect(composed).toEqual({
            argv: [
                'env',
                '-u',
                'CLAUDE_CONFIG_DIR',
                BIN,
                '--model',
                'opus',
                '--permission-mode',
                'plan',
                '--',
                '-p a "quoted" $HOME'
            ],
            env: {},
            keys: ''
        });
    });
});
