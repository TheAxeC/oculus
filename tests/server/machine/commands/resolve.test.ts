// Layer 4, server test. The chain of commands one press runs: the command a name and a source pick
// and the commands it `depends_on`, each once, in the order listed.
//
// What this does NOT cover: the line the chain is joined into (tests/server/machine/commands/
// chain.test.ts) and running it (tests/server/machine/commands/run.test.ts).

import { describe, expect, it } from 'vitest';
import { resolveChain } from '../../../../src/lib/server/machine/commands/resolve.ts';
import type { ProjectCommand } from '../../../../src/lib/data/model/index.ts';

const REPO = '/repo';

function command(name: string, run: string, over: Partial<ProjectCommand> = {}): ProjectCommand {
    return { name, run, cwd: REPO, depends_on: [], source: 'file', ...over };
}

const names = (answer: ReturnType<typeof resolveChain>) =>
    'chain' in answer ? answer.chain.map((one) => one.name) : answer.error;

describe('resolveChain', () => {
    it('puts a dependency before the command that needs it, each once', () => {
        const all = [
            command('build', 'make'),
            command('gen', 'gen.sh'),
            command('test', 'make test', { depends_on: ['build', 'gen'] }),
            command('ci', 'ci.sh', { depends_on: ['test', 'build'] })
        ];
        expect(names(resolveChain(all, 'test', 'file'))).toEqual(['build', 'gen', 'test']);
        expect(names(resolveChain(all, 'ci', 'file'))).toEqual(['build', 'gen', 'test', 'ci']);
        expect(names(resolveChain(all, 'build', 'file'))).toEqual(['build']);
    });

    it('refuses a cycle, a self-dependency and an unknown name, naming them', () => {
        const cyc = [
            command('a', 'a', { depends_on: ['b'] }),
            command('b', 'b', { depends_on: ['a'] }),
            command('self', 's', { depends_on: ['self'] }),
            command('lost', 'l', { depends_on: ['nowhere'] })
        ];
        expect(names(resolveChain(cyc, 'a', 'file'))).toBe(
            'the commands depend on each other in a cycle: a -> b -> a'
        );
        expect(names(resolveChain(cyc, 'self', 'file'))).toBe('the command self depends on itself');
        expect(names(resolveChain(cyc, 'lost', 'file'))).toBe(
            'the command lost depends on nowhere, which is not a command'
        );
        expect(names(resolveChain(cyc, 'none', 'file'))).toBe(
            'none is not a command of this repository'
        );
    });

    it('picks the root by name and source, and a dependency as the first command of its name', () => {
        const all = [
            command('build', 'from-file', { source: 'file' }),
            command('after', 'x', { depends_on: ['build'], source: 'file' }),
            command('build', 'from-form', { source: 'saved' }),
            command('build', 'from-found', { source: 'found' })
        ];
        const runs = (answer: ReturnType<typeof resolveChain>) =>
            'chain' in answer && answer.chain.map((one) => one.run);
        expect(runs(resolveChain(all, 'after', 'file'))).toEqual(['from-file', 'x']);
        expect(runs(resolveChain(all, 'build', 'file'))).toEqual(['from-file']);
        expect(runs(resolveChain(all, 'build', 'saved'))).toEqual(['from-form']);
        expect(runs(resolveChain(all, 'build', 'found'))).toEqual(['from-found']);
        // The source is part of the name: no saved command is called `after`.
        expect(names(resolveChain(all, 'after', 'saved'))).toBe(
            'after is not a command of this repository'
        );
    });
});
