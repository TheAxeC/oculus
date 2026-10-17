// Layer 2, server tests. A server started with no workspace to open builds its context and serves
// an empty workspace (G11, G73): the state file is missing, does not parse, or names a workspace
// file that is gone. Nothing throws, the port is the default one, the portfolio holds no project,
// the Files view has no folder, and a state file that does not parse is left byte for byte as it
// was. The state folder is a dependency of the context, a scratch folder here, so the state of the
// person running the test is never read.
// @module-tag slow: every case builds a whole server context.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { DEFAULT_PORT } from '../../../src/lib/data/sources/config.ts';
import type { Snapshot } from '../../../src/lib/data/model/index.ts';
import { createServerContext, type ServerContext } from '../../../src/lib/server/root/context.ts';
import { stateFileOf } from '../../../src/lib/server/files/workspace/state.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { inertDependencies, scratchEngine, scratchReadMachine } from './inert-context.ts';

let live: ServerContext | undefined;

afterEach(() => {
    live?.close();
    live = undefined;
});

/** The context over a state folder holding `state` (no file for null). */
function started(state: string | null): { context: ServerContext; folder: string } {
    const engine = scratchEngine('oculus-no-workspace-');
    const folder = scratchDir('oculus-no-workspace-state-');
    if (state !== null) writeFileSync(stateFileOf(folder), state);
    const context = createServerContext(engine, {
        ...inertDependencies(),
        stateFolder: () => folder,
        readMachine: scratchReadMachine(engine)
    });
    live = context;
    return { context, folder };
}

const GONE = JSON.stringify({ open: '/nowhere/.oculus/workspaces/gone.yml', recent: [] });

describe('a server context with no workspace to open', () => {
    it.each([
        ['no state file', null],
        ['a state file that does not parse', '{"open": '],
        ['a state naming a workspace file that is gone', GONE]
    ] as const)('is built with %s and serves no folder', (_name, state) => {
        const { context } = started(state);
        const open = context.workspace.open();
        expect(open.folders).toEqual([]);
        expect(open.roots).toEqual([]);
        expect(open.primary).toBeNull();
        expect(context.local.port).toBe(DEFAULT_PORT);
        const portfolio = context.hub.latest('portfolio')?.payload as Snapshot | undefined;
        expect(portfolio).toBeDefined();
        expect(Object.keys(portfolio?.entities.projects ?? {})).toEqual([]);
    });

    it('leaves a state file that does not parse byte for byte as it was', () => {
        const body = '{"open": ';
        const { folder } = started(body);
        expect(readFileSync(join(folder, 'workspace.json'), 'utf8')).toBe(body);
    });
});
