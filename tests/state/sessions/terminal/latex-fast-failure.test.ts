// Layer 2, client state tests. A LaTeX build whose terminal ends while the page reads the server's
// list for it (src/lib/state/sessions/latex/builds.ts, `confirm`), as a weave that fails at once,
// or the clean of an Rnw main before its retry, does: the push that says it ended comes while the
// read is out, the read answers the list from before the end, and the list is read once more, so
// the build ends as failed and posts its failure notice as a failed `.tex` build does. Over stubs
// of the terminals store and of the server's list, which the test answers in turn.
//
// It does not cover the notice's look, which the look does.

import { afterEach, expect, it, vi } from 'vitest';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { createBuilds, type BuildDeps } from '../../../../src/lib/state/sessions/latex/builds.ts';
import type { LatexBuilding } from '../../../../src/lib/data/sources/config/settings.ts';
import { TEXT } from '../../../server/text.ts';

setCatalog(TEXT);

afterEach(() => {
    vi.unstubAllGlobals();
});

it('posts the failure notice of a build whose terminal ended while its list was read', async () => {
    const reads: ((exit: number | null) => void)[] = [];
    vi.stubGlobal('fetch', () =>
        Promise.resolve({
            ok: true,
            json: () =>
                new Promise((answer) =>
                    reads.push((exit) =>
                        answer({ terminals: [{ id: 'weave', exit, name: 'latex build w.Rnw' }] })
                    )
                ),
            text: () => Promise.resolve('')
        })
    );
    const notices: string[] = [];
    const deps = {
        terminals: {
            terminals: () => [],
            latex: () => Promise.resolve({ ok: true, id: 'weave', error: '', terminal: {} }),
            approveLatex: () => Promise.resolve({ ok: false, id: '', error: '' })
        },
        calls: { rootOf: () => null, dependencies: () => Promise.resolve([]) },
        settings: () => ({ cleanAndRetry: false, autoClean: 'never' }) as unknown as LatexBuilding,
        held: () => undefined,
        saveAll: () => Promise.resolve(),
        notify: (message: string) => notices.push(message),
        reload: () => undefined,
        watch: () => undefined,
        count: () => Promise.resolve(null),
        openLog: () => undefined,
        showProblems: () => undefined,
        openAsk: () => undefined,
        again: () => Promise.resolve({ ok: false, id: '', error: '' }),
        touched: () => undefined,
        landings: () => 0
    } as unknown as BuildDeps;
    const builds = createBuilds(deps);
    const target = { root: 'rite', path: 'rnw43' };
    await builds.run(target, 'w.Rnw');
    await vi.waitFor(() => expect(reads).toHaveLength(1));
    // The push that says the terminal ended comes while the read is out.
    builds.sessionsMoved();
    reads[0](null);
    await vi.waitFor(() => expect(reads).toHaveLength(2));
    reads[1](1);
    await vi.waitFor(() => expect(notices).toEqual(['The LaTeX build of w.Rnw failed.']));
    expect(builds.buildOf(target, 'w.Rnw').status).toBe('failed');
});
