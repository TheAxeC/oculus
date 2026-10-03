// Layer 3, view test, kept beside the source tab's tests of the pane strip, whose Save it answers.
// The first Save of an untitled text (views/sources/source/save/untitled-save.ts): the question
// offers the served roots of the current workspace as a choice with the first one selected, the
// name field takes a path under the chosen root, and a name that leaves the root is refused with a
// sentence from the catalog.
//
// The store's calls are fakes that record what they were asked, and the question is a call that
// hands its request back, so the test answers it as the dialog would.
//
// What this does NOT cover: the dialog drawn (ui/forms/Prompt.svelte) and the server making the
// folders of a nested name (tests/routes/files/).

import { beforeAll, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { PromptRequest } from '../../../../src/lib/ui/forms/prompt.ts';
import {
    askUntitledName,
    type UntitledDeps
} from '../../../../src/lib/views/sources/source/save/untitled-save.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

beforeAll(() => setCatalog(catalog));

/** The calls one first Save made, and the question it showed. */
type Run = {
    deps: UntitledDeps;
    created: { root: string; path: string; name: string }[];
    saved: string[];
    restated: unknown[];
    said: string[];
    asked: (PromptRequest | null)[];
};

/** A first Save over fakes: the roots of the workspace and what a create answers. */
function run(
    roots: string[],
    answer: (name: string) => Awaited<ReturnType<UntitledDeps['create']>> = (name) => ({
        ok: true,
        paths: [name]
    })
): Run {
    const made: Run = {
        deps: {} as UntitledDeps,
        created: [],
        saved: [],
        restated: [],
        said: [],
        asked: []
    };
    made.deps = {
        id: 'tab',
        title: () => 'Untitled-1',
        roots: () => roots.map((key) => ({ key })),
        create: (into, name) => {
            made.created.push({ root: into.root, path: into.path, name });
            return Promise.resolve(answer(name));
        },
        saveDraft: (id, root, path) => {
            made.saved.push(`${id}:${root}:${path}`);
            return Promise.resolve();
        },
        restate: (id, state) => made.restated.push([id, state]),
        said: (words) => made.said.push(words),
        ask: (request) => made.asked.push(request)
    };
    return made;
}

/** The question shown, answered with the root and the name as the dialog hands them on. */
async function answered(made: Run, root: string, name: string): Promise<void> {
    const shown = made.asked.at(-1);
    if (shown === null || shown === undefined) throw new Error('no question was asked');
    shown.act([root, name]);
    for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
}

describe('the question of the first Save of an untitled text', () => {
    // Revert: offer the first root alone, as a line of detail.
    it('offers every served root as a choice, the first selected, and a name field after it', () => {
        const made = run(['hub', 'data']);
        askUntitledName(made.deps);
        const request = made.asked[0];
        expect(request?.fields).toEqual([
            {
                label: catalog['source.untitled_root'],
                value: 'hub',
                choices: [
                    { id: 'hub', label: 'hub' },
                    { id: 'data', label: 'data' }
                ]
            },
            { label: catalog['source.untitled_name'], value: '', placeholder: 'Untitled-1' }
        ]);
    });

    it('says no folder is served when the workspace holds no root, and asks nothing', () => {
        const made = run([]);
        askUntitledName(made.deps);
        expect(made.asked).toEqual([]);
        expect(made.said).toEqual([catalog['source.untitled_no_root']]);
    });
});

describe('the file the first Save makes', () => {
    // Revert: make the file under the first root whatever root was chosen.
    it('is made under the root that was chosen, not the first', async () => {
        const made = run(['hub', 'data']);
        askUntitledName(made.deps);
        await answered(made, 'data', 'notes.md');
        expect(made.created).toEqual([{ root: 'data', path: '', name: 'notes.md' }]);
        expect(made.saved).toEqual(['tab:data:notes.md']);
    });

    // Revert: split the name at its slashes before the create, or drop the folders from it.
    it('takes a path under the root, and writes the draft to the path the create answered', async () => {
        const made = run(['hub'], (name) => ({ ok: true, paths: [name] }));
        askUntitledName(made.deps);
        await answered(made, 'hub', ' drafts/2026/notes.md ');
        expect(made.created).toEqual([{ root: 'hub', path: '', name: 'drafts/2026/notes.md' }]);
        expect(made.saved).toEqual(['tab:hub:drafts/2026/notes.md']);
        expect(made.restated).toHaveLength(1);
        expect(made.said).toEqual([]);
    });

    // Revert: leave the leaving-the-root test out of saveAs.
    it.each(['../outside.md', 'a/../../outside.md', '/etc/outside.md', '\\outside.md'])(
        'refuses %s, which leaves the root, with the catalog sentence and makes nothing',
        async (name) => {
            const made = run(['hub']);
            askUntitledName(made.deps);
            await answered(made, 'hub', name);
            expect(made.said).toEqual([catalog['source.untitled_outside']]);
            expect(made.created).toEqual([]);
            expect(made.saved).toEqual([]);
        }
    );

    it('says the refusal of a create that the store answered and writes nothing', async () => {
        const made = run(['hub'], () => ({ ok: false, error: 'exists' }));
        askUntitledName(made.deps);
        await answered(made, 'hub', 'taken.md');
        expect(made.said).toHaveLength(1);
        expect(made.saved).toEqual([]);
    });

    it('does nothing for a name left empty', async () => {
        const made = run(['hub']);
        askUntitledName(made.deps);
        await answered(made, 'hub', '   ');
        expect(made.created).toEqual([]);
        expect(made.said).toEqual([]);
    });
});
