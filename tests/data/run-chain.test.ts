// Layer 1, data helper tests. The chain the command form shows under its fields: what a press of
// the drafted command would run over the repository's listed commands, the commands it depends on
// first, each line with its folder relative to the repository.

import { describe, expect, it } from 'vitest';
import type { ProjectCommand } from '../../src/lib/data/model/index.ts';
import { draftChain } from '../../src/lib/data/helpers/run/chain.ts';

const REPO = '/scratch/repo';

/** A plain command of the repository's file. */
function listed(name: string, run: string, extra: Partial<ProjectCommand> = {}): ProjectCommand {
    return { name, run, cwd: REPO, depends_on: [], source: 'file', ...extra };
}

const LISTED = [
    listed('build', 'make'),
    listed('test', 'make test', { cwd: `${REPO}/sub`, depends_on: ['build'] })
];

describe('the chain of a drafted command', () => {
    it('lists the commands it depends on first, each with its folder', () => {
        const draft = { name: 'ship', run: 'deploy', cwd: 'sub', depends_on: ['test'] };
        expect(draftChain(REPO, draft, LISTED, null)).toEqual({
            lines: [
                { folder: '.', run: 'make' },
                { folder: 'sub', run: 'make test' },
                { folder: 'sub', run: 'deploy' }
            ]
        });
    });

    it('shows the edited command with its drafted line in place of the one listed', () => {
        const draft = { name: 'build', run: 'make all' };
        expect(draftChain(REPO, draft, LISTED, 'build')).toEqual({
            lines: [{ folder: '.', run: 'make all' }]
        });
    });

    it('answers the word and the names of a dependency no command holds', () => {
        const draft = { name: 'ship', run: 'deploy', depends_on: ['lint'] };
        expect(draftChain(REPO, draft, LISTED, null)).toEqual({
            error: 'dependency-unknown',
            names: ['ship', 'lint']
        });
    });
});
