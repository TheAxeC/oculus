// Each provider's client half saved once: the account file made at 0600.
//
// Every file is under a directory this file made under the system temporary directory, asserted to
// be inside it before anything is written; no network call is made.

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { handleSetupWrite } from '../../../../src/lib/server/accounts/connect/setup.ts';
import { providerFile } from '../../../../src/lib/server/accounts/connect/store.ts';
import { fsWrites } from '../../../../src/lib/server/core/json.ts';
import { pagePost } from '../../../fixtures/doubles.ts';
import { PROVIDERS } from '../providers.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const TOKEN = 'the-write-token-of-this-case';
const GOOGLE_ID = '1234-abcd.apps.googleusercontent.com';
const SECRET = 'the-google-secret-no-answer-may-carry';
const LOCAL = `# the machine's own file
calendars:
  # the university
  - { provider: microsoft, label: uni }
`;

/** A machine of this case's own: its file and its provider folder. */
function machine(local = LOCAL) {
    const root = scratchDir('oculus-accounts-');
    const file = join(root, 'local.yml');
    writeFileSync(file, local);
    return {
        root,
        file,
        providerDir: join(root, 'connect')
    };
}

type Machine = ReturnType<typeof machine>;

/** A POST as the page sends one. */
function post(path: string, body: unknown, token = TOKEN): Request {
    return pagePost(`http://127.0.0.1:8792${path}`, body, token);
}

/** The setup endpoint's target over one machine. */
function setupTarget(at: Machine, refresh = vi.fn(() => Promise.resolve())) {
    return {
        token: TOKEN,
        providerDir: at.providerDir,
        port: 8792,
        providers: PROVIDERS,
        git: {
            rows: PROVIDERS.rows,
            words: PROVIDERS.words,
            text: {},
            providerDir: at.providerDir,
            engine: at.root,
            execPath: '/fixture/node'
        },
        writes: fsWrites(),
        refresh
    };
}

describe('the account setup page', () => {
    it('saves a half behind the token, reads every account again, and answers no field of it', async () => {
        const at = machine();
        const refresh = vi.fn(() => Promise.resolve());
        const save = {
            action: 'save',
            provider: 'google',
            client_id: ` ${GOOGLE_ID} `,
            client_secret: SECRET
        };

        const stale = await handleSetupWrite(post('/api/connect', save, 'stale'), setupTarget(at));
        const answer = await handleSetupWrite(post('/api/connect', save), setupTarget(at, refresh));

        expect(stale.status).toBe(403);
        expect(answer.status).toBe(200);
        const file = providerFile(at.providerDir, 'google');
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
            client_id: GOOGLE_ID,
            client_secret: SECRET
        });
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(refresh).toHaveBeenCalledTimes(1);
        // The answer to a save carries nothing the reader typed.
        expect(await answer.text()).not.toContain(SECRET);
    });
});
