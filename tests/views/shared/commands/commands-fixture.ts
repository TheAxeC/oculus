// Layer 4, test helper. What the suites that mount the command bar, or a card that draws it, in
// Svelte's client runtime over the fake document share: a repository whose file and saved commands
// both hold the name `build`, and the root, client and request log of the running case.

import { afterEach, beforeEach } from 'vitest';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';
import type { Asked } from '../../../state/sessions/terminal/commands-fixture.ts';
import { installDom, removeDom, type FakeElement } from '../../../ui/frame/fake-dom.ts';

export const REPO = '/work/repo';

/** One command of the repository's list as the server answers it. */
export function command(name: string, source: string, run = `make ${name}`) {
    return { name, run, cwd: REPO, depends_on: [], source };
}

/** The list of a repository whose file and saved commands both hold `build`. */
export const SHARED = {
    commands: [command('build', 'file'), command('build', 'saved', 'make -j4')],
    findings: []
};

/** The case running: the element a component mounts on, its client and the requests it made. */
export type DomCase = { root: FakeElement; client: ClientState; asked: Asked[] };

/** Hold a case's fake document, client and request log, built again before each case. */
export function domCase(): DomCase {
    const held = { client: createClientState(), asked: [] } as unknown as DomCase;
    beforeEach(() => {
        held.root = installDom();
        held.client = createClientState();
        held.asked = [];
    });
    afterEach(() => removeDom());
    return held;
}
