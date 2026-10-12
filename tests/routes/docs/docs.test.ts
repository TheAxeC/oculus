// Layer 2, route tests. What the /api/docs route answers for a document of oculus's own, named by
// `engine=<path>`. The route itself joins Kit's request to lib/server/content/docs.ts, which this
// calls.
//
// The engine folder is a temporary directory the case plants documents in; a file outside it is
// planted beside it, so a path that climbs out of the folder or leaves it through a link has
// something real to reach. The configuration handed to the route is the defaults, so the case reads
// no configuration file of the engine and nothing outside the temporary directory.

import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { handleDocs, renderHubDoc, type DocTarget } from '../../../src/lib/server/content/docs.ts';
import { words } from '../../../src/lib/server/core/words.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { TEXT } from '../../server/text.ts';

/**
 * An engine folder with a manual, a guide, a hidden folder, a `node_modules` folder, a folder named
 * like a document, a link out of it and a link into the hidden folder and into `node_modules`,
 * beside a file outside it and a hub folder that holds the engine folder.
 */
function planted(): { dir: string; into: (hub: string) => DocTarget } {
    const dir = plantScratch(
        'oculus-docs-route-',
        {
            'hub/engine/HELP.md': '# Manual\n',
            'hub/engine/docs/guide.md': '# Guide\n\nSee [the manual](../HELP.md).\n',
            'hub/engine/docs/shout.MD': '# Shout\n',
            'hub/engine/.scratch/plan.md': '# Plan\n',
            'hub/engine/node_modules/pack/README.md': '# Pack\n',
            'hub/engine/config/other.yml': 'key: nowhere\n',
            'hub/other.md': '# Other\n',
            'elsewhere/secret.md': '# Secret\n'
        },
        ['hub/engine/docs/folder.md']
    );
    symlinkSync(join(dir, 'elsewhere', 'secret.md'), join(dir, 'hub', 'engine', 'docs', 'out.md'));
    symlinkSync('../.scratch/plan.md', join(dir, 'hub', 'engine', 'docs', 'hid.md'));
    symlinkSync('../node_modules/pack/README.md', join(dir, 'hub', 'engine', 'docs', 'nm.md'));
    const config = portfolioConfigFrom({});
    return {
        dir,
        into: (hub) => ({
            primary: { key: 'hub', dir: hub },
            engine: join(dir, 'hub', 'engine'),
            config
        })
    };
}

/** One request of the route, as the page makes it. */
function ask(into: DocTarget, query: string): Response {
    return handleDocs(new Request(`http://127.0.0.1:8791/api/docs?${query}`), into);
}

describe('the engine read of the docs route', () => {
    it('serves a Markdown file of the engine and refuses a path that leaves the engine, a link out of it and a file of another kind', async () => {
        const { dir, into } = planted();
        const inHub = into(join(dir, 'hub'));
        const outside = into(join(dir, 'elsewhere'));

        const served: { row: string; target: DocTarget; engineAt: string }[] = [
            { row: 'an engine inside the hub', target: inHub, engineAt: 'engine' },
            { row: 'an engine outside the hub', target: outside, engineAt: '' }
        ];
        for (const { row, target, engineAt } of served) {
            const response = ask(target, 'engine=docs%2Fguide.md');
            expect(response.status, row).toBe(200);
            const body = (await response.json()) as Record<string, unknown>;
            expect(body.engine, row).toBe(true);
            expect(body.path, row).toBe('docs/guide.md');
            expect(body.manual, row).toBe('HELP.md');
            expect(body.engineAt, row).toBe(engineAt);
            expect(body.html, row).toContain('<h1');
        }

        const refused: { row: string; query: string; error: string }[] = [
            { row: 'an empty path', query: 'engine=', error: 'no engine document named' },
            {
                row: 'a file of another kind',
                query: 'engine=config%2Fother.yml',
                error: 'not a Markdown file: config/other.yml'
            },
            {
                row: 'a capital extension',
                query: 'engine=docs%2Fshout.MD',
                error: 'not a Markdown file: docs/shout.MD'
            },
            {
                row: 'an absolute path',
                query: `engine=${encodeURIComponent(join(dir, 'hub', 'other.md'))}`,
                error: `an absolute path is not inside the engine folder: ${join(dir, 'hub', 'other.md')}`
            },
            {
                row: 'a climb into the hub',
                query: 'engine=..%2Fother.md',
                error: 'the path leaves the engine folder: ../other.md'
            },
            {
                row: 'a climb after a folder',
                query: 'engine=docs%2F..%2F..%2Fother.md',
                error: 'the path leaves the engine folder: docs/../../other.md'
            },
            {
                row: 'a hidden folder',
                query: 'engine=.scratch%2Fplan.md',
                error: 'the path has a node_modules or dot segment: .scratch/plan.md'
            },
            {
                row: 'a hidden folder reached through a climb that stays inside',
                query: 'engine=docs%2F..%2F.scratch%2Fplan.md',
                error: 'the path has a node_modules or dot segment: docs/../.scratch/plan.md'
            },
            {
                row: 'a node_modules folder',
                query: 'engine=node_modules%2Fpack%2FREADME.md',
                error: 'the path has a node_modules or dot segment: node_modules/pack/README.md'
            },
            {
                row: 'a file nothing is at',
                query: 'engine=docs%2Fnone.md',
                error: 'no file at docs/none.md in the engine folder'
            },
            {
                row: 'a folder named like a document',
                query: 'engine=docs%2Ffolder.md',
                error: 'docs/folder.md is a folder, not a Markdown file'
            },
            {
                row: 'a link that leaves the engine folder',
                query: 'engine=docs%2Fout.md',
                error: 'docs/out.md is a link that leaves the engine folder'
            },
            {
                row: 'a link into a hidden folder of the engine',
                query: 'engine=docs%2Fhid.md',
                error: 'the path has a node_modules or dot segment: docs/hid.md'
            },
            {
                row: 'a link into a node_modules folder of the engine',
                query: 'engine=docs%2Fnm.md',
                error: 'the path has a node_modules or dot segment: docs/nm.md'
            }
        ];
        for (const { row, query, error } of refused) {
            for (const target of [inHub, outside]) {
                const response = ask(target, query);
                expect(response.status, row).toBe(404);
                expect(await response.json(), row).toEqual({ error });
            }
        }

        const both = ask(inHub, 'manual=1&engine=docs%2Fguide.md');
        expect(((await both.json()) as { path: string }).path, 'the manual wins over engine').toBe(
            'HELP.md'
        );
        const second = ask(inHub, 'engine=docs%2Fguide.md&hub=other.md');
        expect(((await second.json()) as { path: string }).path, 'engine wins over hub').toBe(
            'docs/guide.md'
        );
    });
});

describe('the hub read of the docs route when no hub can be read', () => {
    it('answers the catalog sentence for a workspace with no primary and for a hub the workspace lacks', async () => {
        const { dir, into } = planted();
        const base = into(join(dir, 'hub'));
        const worded: DocTarget = { ...base, config: { ...base.config, text: TEXT } };
        const none = renderHubDoc({ ...worded, primary: null }, 'other.md');
        expect(none.status).toBe(404);
        expect(await none.json()).toEqual({
            error: words(TEXT, 'server.workspace.no_primary_doc')
        });
        const missing = renderHubDoc(worded, 'other.md', '', 'lab');
        expect(missing.status).toBe(404);
        expect(await missing.json()).toEqual({
            error: words(TEXT, 'server.workspace.no_hub_named', 'lab')
        });
    });
});
