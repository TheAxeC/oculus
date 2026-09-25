// The deposit panel rendered to HTML on the server: the mirror's state line, the plan, and the
// controls the findings disable.
//
// The catalog and the glyphs are the real config, so the words checked here are the text catalogs'
// under config/text/. The mirror is synthetic: there is no fetch in this suite, so
// state/system/deposit.svelte.ts would leave the panel pending, and each case puts a state in
// through that module's hold(), which exists for exactly this.
//
// What this does NOT cover: anything that needs a DOM. Nothing is clicked, no confirm is answered
// and no write is posted; what the endpoint does with one is tests/routes/git/deposit.test.ts and
// tests/server/git/deposit.test.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Deposit from '../../../src/lib/views/boards/deposit/Deposit.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { MirrorState, Plan } from '../../../src/lib/state/system/deposit.svelte.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let hold: ClientState['deposit']['hold'];

beforeEach(() => {
    client = createClientState();
    ({ hold } = client.deposit);
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

function instance(id: string): Instance {
    return { id: 'deposit-one', view: 'deposit', state: id === '' ? {} : { id } };
}

function plan(findings: Plan['findings']): Plan {
    return {
        repo: 'alpha-code',
        mirror: '/mirrors/alpha-code',
        branch: 'main',
        remote: '',
        files: ['README.md', 'run.py'],
        changes: [{ letters: 'A ', path: 'run.py' }],
        findings
    };
}

function mirror(made: Plan | null): MirrorState {
    return {
        id: 'alpha',
        repo: 'alpha-code',
        mirror: '/mirrors/alpha-code',
        exists: true,
        branch: 'main',
        remote: '',
        ahead: 0,
        plan: made
    };
}

describe('the deposit panel', () => {
    it('says so when no project was chosen', () => {
        const { body } = render(Deposit, {
            context: clientContext(client),
            props: { instance: instance('') }
        });
        expect(body).toContain(catalog['deposit.none']);
    });

    it('draws the mirror and the plan it was given', () => {
        hold('alpha', mirror(plan([])));
        const { body } = render(Deposit, {
            context: clientContext(client),
            props: { instance: instance('alpha') }
        });
        expect(body).toContain('alpha-code');
        expect(body).toContain('run.py');
        expect(body).toContain(catalog['deposit.remote_none']);
        expect(body).toContain(catalog['deposit.push_create']);
    });

    it('says there is no mirror yet, and offers adopt alone', () => {
        hold('alpha', { ...mirror(null), exists: false });
        const { body } = render(Deposit, {
            context: clientContext(client),
            props: { instance: instance('alpha') }
        });
        expect(body).toContain(catalog['deposit.no_mirror']);
        // there is no mirror yet, so there is nothing to commit to
        expect(body).not.toContain(catalog['deposit.commit_label']);
    });

    it('disables the writes while the plan has findings, with the reason', () => {
        hold('alpha', mirror(plan([{ kind: 'secret', path: '.env', mb: 0 }])));
        const { body } = render(Deposit, {
            context: clientContext(client),
            props: { instance: instance('alpha') }
        });
        expect(body).toContain('possible secret: .env');
        expect(body).toContain(catalog['deposit.why_findings']);
        expect(body).toContain('disabled');
    });

    it('holds the plan and its findings apart from the mirror with no plan yet', () => {
        hold('alpha', mirror(null));
        const { body } = render(Deposit, {
            context: clientContext(client),
            props: { instance: instance('alpha') }
        });
        expect(body).toContain(catalog['deposit.plan_none']);
        expect(body).toContain(catalog['deposit.why_no_plan']);
    });
});
