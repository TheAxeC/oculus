// Layer 2, route tests. POST /api/latex: the formatting of a text. The hub and the roots
// are synthetic folders under the system temporary directory and the snapshot is the case's own, so
// nothing of the real hub is read and nothing at all is written outside it.
//
// Every refusal is a word (data/prose/latex.ts and data/file-ops.ts), never a sentence.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    handleLatexPost,
    type LatexTarget
} from '../../../src/lib/server/content/latex/endpoint.ts';
import type { Formatter } from '../../../src/lib/data/prose/latex.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { latexBuild, type LatexFormatting } from '../../../src/lib/data/sources/config/settings.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

const HOST = '127.0.0.1:8791';
const TOKEN = 'token-of-the-case';

// The synthetic hub, made before the file's first case, so a run that skips every case makes none.
let HUB = '';

const FOLDER = 'projects/manuscripts/alpha';
const OUTLINED = 'projects/manuscripts/gamma';

/** The formatter setting a case runs under: one formatter, each program found on PATH. */
function formatting(formatter: Formatter, paths: Partial<LatexFormatting['paths']> = {}) {
    return (): LatexFormatting => ({
        formatter,
        paths: { latexindent: '', 'tex-fmt': '', badness: '', ...paths }
    });
}

/** A bin folder of the case's own, which is the whole of the PATH its programs are found on. */
function newBin(): string {
    return realpathSync(scratchDir('oculus-latex-bin-'));
}

const TARGET: LatexTarget = {
    hub: '',
    project: (id) => {
        if (id === 'alpha') return { folder: FOLDER };
        return id === 'gamma' ? { folder: OUTLINED } : null;
    },
    roots: () => [{ key: 'docs', dir: join(HUB, 'docs') }],
    formatting: formatting('tex-fmt'),
    building: () => latexBuild(loadConfig(engineDir()).config)
};

/** The target with a bin folder as the whole of the PATH, and a time limit when given. */
function withTools(bin: string, timeoutMs = 20000): LatexTarget {
    return { ...TARGET, tools: { env: { PATH: `${bin}:/usr/bin:/bin` }, timeoutMs } };
}

test.beforeAll(() => {
    HUB = realpathSync(scratchDir('oculus-latex-route-'));
    TARGET.hub = HUB;
});

async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

describe('POST /api/latex format', () => {
    function post(body: unknown, token = TOKEN): Request {
        return new Request(`http://${HOST}/api/latex`, {
            method: 'POST',
            headers: { host: HOST, 'x-oculus-token': token, 'content-type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    it('refuses a request without the write token and a body that is no format request', async () => {
        const bin = newBin();
        const stale = await handleLatexPost(
            post({ action: 'format', text: 'a' }, 'stale'),
            TOKEN,
            withTools(bin)
        );
        const wrong = await handleLatexPost(post({ action: 'other' }), TOKEN, withTools(bin));

        expect(stale.status).toBe(403);
        expect(wrong.status).toBe(400);
        expect((await answer(wrong)).error).toBe('not-an-action');
    });
});
