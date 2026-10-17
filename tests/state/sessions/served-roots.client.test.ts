// Layer 2, client-state tests. A root that leaves the served roots takes its command diagnostics
// (state/sessions/terminal/commands.svelte.ts) and its LaTeX states (state/sessions/latex/
// latex.svelte.ts) with it, and a change of the roots is heard only between two reads of the
// workspaces (state/shared/stores/served-roots.svelte.ts, wired as state/client/context.ts wires
// it). The stores are real; the terminals, the entities and the workspaces are stubs. Each case
// lists the rows of both sources before and after the change and prints the two lists.
//
// It does not cover the language-server rows, which the client of the language leaves with the
// server's `root_gone` state, nor the server's own answer for `real`.

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CommandDiagnostic } from '../../../src/lib/data/model/index.ts';
import { createQueries } from '../../../src/lib/state/client/queries/queries.svelte.ts';
import { watchServedRoots } from '../../../src/lib/state/shared/stores/served-roots.svelte.ts';
import { createLatex } from '../../../src/lib/state/sessions/latex/latex.svelte.ts';
import type { LatexState } from '../../../src/lib/state/sessions/latex/latex-state.ts';
import { noWorkspaces, readRoots } from '../../../src/lib/state/sources/fs-transport.ts';
import type { WorkspacesState } from '../../../src/lib/state/sources/fs-transport.ts';
import type { FsRoot } from '../../../src/lib/state/sources/fs.ts';
import { cell, rooted } from '../../ui/frame/rooted.svelte.ts';
import { stubbedCommands } from './terminal/commands-fixture.ts';

afterEach(() => vi.unstubAllGlobals());

const A: FsRoot = { key: 'a', dir: '/w/a', real: '/w/a' };
const B: FsRoot = { key: 'b', dir: '/w/b', real: '/w/b' };
const LINKED: FsRoot = { key: 'link', dir: '/home/u/link', real: '/data/real' };

/**
 * The workspaces as the fs store reads them once they are read: the open workspace with `roots` as
 * its folders.
 */
function read(roots: FsRoot[]): WorkspacesState {
    return {
        home: '/home/u',
        open: null,
        folders: roots,
        primary: null,
        engine: null,
        recent: [],
        available: [],
        machine: { set: [], defaults: {}, values: {}, hubs: {}, portRefused: null },
        error: '',
        loading: false
    };
}

/** A LaTeX state of `root` holding one build error. */
function latexState(root: string): LatexState {
    return {
        root,
        dir: '',
        error: '',
        loading: false,
        mains: [
            {
                main: 'main.tex',
                errors: [{ file: 'main.tex', line: 3, message: `error of ${root}` }],
                warnings: []
            }
        ]
    } as unknown as LatexState;
}

/** The commands store, the LaTeX store and the workspaces, wired the way context.ts wires them. */
function make(start: WorkspacesState) {
    const workspaces = cell<WorkspacesState>(start);
    const queries = createQueries();
    let listed: unknown[] = [];
    const { terminals, entities, commands } = stubbedCommands(() => listed);
    const latex = createLatex(
        entities as never,
        terminals as never,
        {} as never,
        queries,
        {} as never,
        { notices: { post: () => undefined }, openLog: () => undefined } as never
    );
    const wired = rooted(() =>
        watchServedRoots(
            () => readRoots(workspaces.get()),
            (roots) => {
                commands.forgetOutside(roots);
                latex.forgetOutside(roots);
            }
        )
    );
    flushSync();
    /** A task terminal that printed one error line, naming `file`, in the repository `repo`. */
    function printed(id: string, repo: string, file: string): void {
        listed = [
            ...listed,
            { id, task: true, exit: null, pid: 1, job: { repo, name: id, source: 'file' } }
        ];
        commands.note(id, `${file}:1:1: error: boom of ${id}\n`, false);
    }
    return { workspaces, queries, commands, latex, stop: wired.stop, printed };
}

/** Every row of both sources, one line each, in the order the sources list them. */
function rows(env: ReturnType<typeof make>): string[] {
    return [
        ...env.commands
            .commandDiagnostics()
            .map((one: CommandDiagnostic) => `command ${one.root} ${one.file}`),
        ...env.latex.latexDiagnostics().map((one) => `latex ${one.root} ${one.file}`)
    ];
}

/** Print a list of rows under a title, so a run shows what each case saw. */
function show(title: string, list: string[]): void {
    console.info(`${title}\n${list.map((one) => `  ${one}`).join('\n') || '  (no rows)'}`);
}

/** The five rows of the cases below: three command rows and a LaTeX row of each root. */
function fill(env: ReturnType<typeof make>): void {
    env.printed('removed', '/w/a', 'src/x.ts');
    env.printed('nested', '/w/b/nested', 'src/y.ts');
    env.printed('outside', '/w/b', '/etc/z.c');
    env.queries.hold(['latex', 'folder', 'a', ''], latexState('a'));
    env.queries.hold(['latex', 'folder', 'b', ''], latexState('b'));
}

describe('a root that leaves the served roots', () => {
    it('takes its command rows and its LaTeX rows, and keeps the rest', () => {
        const env = make(read([A, B]));
        fill(env);
        const before = rows(env);
        show('before the removal of root a', before);
        expect(before).toEqual([
            'command /w/a src/x.ts',
            'command /w/b/nested src/y.ts',
            'command /w/b /etc/z.c',
            'latex a main.tex',
            'latex b main.tex'
        ]);
        env.workspaces.set(read([B]));
        flushSync();
        const after = rows(env);
        show('after the removal of root a', after);
        expect(after).toEqual([
            'command /w/b/nested src/y.ts',
            'command /w/b /etc/z.c',
            'latex b main.tex'
        ]);
        expect(env.queries.peek(['latex', 'folder', 'a', '']).data).toBeUndefined();
        expect(env.queries.peek(['latex', 'folder', 'b', '']).data).toBeDefined();
        env.stop();
    });

    it('is not heard while the workspaces load, fail or read again', () => {
        const env = make(read([A, B]));
        fill(env);
        const before = rows(env);
        env.workspaces.set(noWorkspaces());
        flushSync();
        expect(rows(env)).toEqual(before);
        env.workspaces.set({ ...noWorkspaces(), error: 'unreachable', loading: false });
        flushSync();
        expect(rows(env)).toEqual(before);
        env.workspaces.set(read([A, B]));
        flushSync();
        expect(rows(env)).toEqual(before);
        show('after the roots list went empty while the workspaces were read again', rows(env));
        env.stop();
    });

    it('forgets nothing at the first read, however few roots it holds', () => {
        const env = make(noWorkspaces());
        fill(env);
        const before = rows(env);
        env.workspaces.set(read([]));
        flushSync();
        expect(rows(env)).toEqual(before);
        env.stop();
    });

    it('keeps the rows of a repository under a root whose folder is a symlink to it', () => {
        const env = make(read([LINKED, B]));
        env.printed('linked', '/data/real', 'src/x.ts');
        env.printed('under', '/data/real/inner', 'src/w.ts');
        env.printed('gone', '/w/a', 'src/v.ts');
        env.workspaces.set(read([LINKED]));
        flushSync();
        const after = rows(env);
        show('after the removal of root b, root link served through a symlink', after);
        expect(after).toEqual(['command /data/real src/x.ts', 'command /data/real/inner src/w.ts']);
        env.stop();
    });

    it('reads a root with no real folder as the folder it is written as', () => {
        const env = make(read([{ key: 'a', dir: '/w/a' }, B]));
        env.printed('kept', '/w/a/sub', 'src/x.ts');
        env.workspaces.set(read([{ key: 'a', dir: '/w/a' }]));
        flushSync();
        expect(rows(env)).toEqual(['command /w/a/sub src/x.ts']);
        env.stop();
    });

    it('lets no later output of a repository outside the roots back into the list', () => {
        const env = make(read([A, B]));
        env.workspaces.set(read([B]));
        flushSync();
        env.printed('late', '/w/a', 'src/x.ts');
        env.printed('served', '/w/b', 'src/y.ts');
        expect(rows(env)).toEqual(['command /w/b src/y.ts']);
        env.stop();
    });
});
