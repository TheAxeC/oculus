// Layer 4, view test. The Status view's hooks section draws the block state/sessions/hooks.ts
// builds from the page's origin, with the control that copies it, and draws nothing without an
// origin. Its line counts draw one row per folder with that folder's languages under it, the src/
// row summing everything under src above the first folder under it, and the total last, say while
// they are counting and when they failed, and count again on the press.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Hooks from '../../../src/lib/views/system/status/Hooks.svelte';
import LineCounts from '../../../src/lib/views/system/status/LineCounts.svelte';
import Status from '../../../src/lib/views/system/status/Status.svelte';
import ToolButton from '../../../src/lib/ui/controls/ToolButton.svelte';
import { COUNT } from '../../server/machine/line-counts.ts';
import type { Lines } from '../../../src/lib/state/system/lines.svelte.ts';
import { stamp } from '../../../src/lib/state/shared/words/format.ts';
import { hooksSnippet } from '../../../src/lib/state/sessions/hooks.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

// Record the control's callback while keeping the real primitive's server rendering.
vi.mock('../../../src/lib/ui/controls/ToolButton.svelte', async (importOriginal) => {
    const original =
        await importOriginal<typeof import('../../../src/lib/ui/controls/ToolButton.svelte')>();
    return { ...original, default: vi.fn(original.default) };
});

afterEach(() => {
    vi.mocked(ToolButton).mockClear();
});

/** The control's handler reads nothing off the event, so the case hands it an empty stand-in. */
const CLICK = {} as MouseEvent;

/** The props the control carrying these words was drawn with, or nothing when none was drawn. */
function drawnWith(label: string): { onclick: (event: MouseEvent) => unknown } | undefined {
    return vi.mocked(ToolButton).mock.calls.find((call) => call[1].label === label)?.[1];
}

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
setCatalog(catalog);

/** The markup's text as it reads, since Svelte writes `&` and `<` as entities. */
function plain(body: string): string {
    return body.replaceAll('&amp;', '&').replaceAll('&lt;', '<');
}

/** What the section printed for copying, or null when it printed nothing. */
function pre(body: string): string | null {
    const found = /<pre[^>]*>([\s\S]*?)<\/pre>/.exec(body);
    return found === null ? null : plain(found[1]);
}

describe('the status view hooks section', () => {
    it('prints the block for the origin it was given', () => {
        const body = render(Hooks, {
            context: clientContext(client),
            props: { origin: 'http://127.0.0.1:8793' }
        }).body;
        const printed = pre(body);
        expect(printed).not.toBeNull();
        expect(JSON.parse(printed ?? 'null')).toEqual(
            JSON.parse(hooksSnippet('http://127.0.0.1:8793'))
        );
    });

    it('names the file the block goes in and carries the copy control with its label', () => {
        const body = plain(
            render(Hooks, {
                context: clientContext(client),
                props: { origin: 'http://127.0.0.1:8790' }
            }).body
        );
        expect(body).toContain(catalog['status.hooks_title']);
        expect(body).toContain('~/.claude/settings.json');
        expect(body).toContain(catalog['status.hooks_copy']);
    });

    it('draws nothing where there is no origin to post to', () => {
        const body = render(Hooks, { context: clientContext(client), props: { origin: '' } }).body;
        expect(pre(body)).toBeNull();
        // there is no origin to post a hook to, so the block is not drawn at all
        expect(body).not.toContain(catalog['status.hooks_title']);
    });

    it('presses that control through the toolbar primitive', () => {
        const source = readFileSync('src/lib/views/system/status/Hooks.svelte', 'utf8');
        expect(source).toContain("import ToolButton from '$lib/ui/controls/ToolButton.svelte'");
        expect(source).toContain("<ToolButton label={t('status.hooks_copy')} onclick={copy} />");
    });
});

/** The client with its line store standing in for the real one, holding `held`. */
function holding(held: Lines): () => void {
    const recount = vi.fn();
    client.lines = { lines: () => held, recount };
    return recount;
}

/** The text of each body row of the drawn table, its cells joined by a bar. */
function rows(body: string): string[] {
    const table = /<tbody[^>]*>([\s\S]*?)<\/tbody>/.exec(body);
    if (table === null) return [];
    return [...table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) =>
        [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
            .map((cell) => plain(cell[1].replace(/<[^>]*>/g, '').replace(/<!---->/g, '')).trim())
            .join('|')
    );
}

function draw(): string {
    return render(LineCounts, { context: clientContext(client) }).body;
}

describe('the status view line counts', () => {
    it('draws one row per folder with its languages under it, the src/ sum above the first folder under src, and the total last', () => {
        holding({ count: COUNT, error: '', loading: false });
        const body = draw();
        expect(body).toContain(catalog['status.lines_title']);
        expect(body).toContain(catalog['status.lines_help']);
        expect(rows(body)).toEqual([
            `${catalog['status.lines_top']}|3|20|5|1,234|1|1,259`,
            'Markdown|2|18|0|1,200|0|1,218',
            'TypeScript|1|2|5|34|1|41',
            'src/|1|1|0|4|0|5',
            'src/lib/x|1|1|0|4|0|5',
            'Svelte|1|1|0|4|0|5',
            `${catalog['status.lines_total']}|4|21|5|1,238|1|1,264`
        ]);
        expect(body).toContain(
            catalog['status.lines_counted'].replace('{0}', stamp(COUNT.counted))
        );
        expect(body).toContain(catalog['status.lines_recount']);
    });

    it('marks the language rows as such and the total row as the total', () => {
        holding({ count: COUNT, error: '', loading: false });
        const body = draw();
        expect(body.match(/class="language/g)?.length).toBe(3 * 7);
        expect(body.match(/class="total/g)?.length).toBe(7);
    });

    it('says it is counting while the first count is out, with no table', () => {
        holding({ count: null, error: '', loading: true });
        const body = draw();
        expect(body).toContain(catalog['status.lines_counting']);
        expect(rows(body)).toEqual([]);
    });

    it('draws the failure sentence and the control that counts again', () => {
        holding({ count: null, error: 'cloc exited with code 1.', loading: false });
        const body = plain(draw());
        expect(body).toContain(
            catalog['status.lines_failed'].replace('{0}', 'cloc exited with code 1.')
        );
        expect(body).toContain(catalog['status.lines_recount']);
        expect(rows(body)).toEqual([]);
    });

    it('counts again when Count again is pressed', () => {
        const recount = holding({ count: COUNT, error: '', loading: false });
        draw();
        const drawn = drawnWith(catalog['status.lines_recount']);
        expect(drawn).toBeDefined();
        void drawn?.onclick(CLICK);
        expect(recount).toHaveBeenCalledTimes(1);
    });

    it('keeps the last table under the sentence when a later count failed', () => {
        holding({ count: COUNT, error: 'cloc exited with code 1.', loading: false });
        const body = plain(draw());
        expect(body).toContain(
            catalog['status.lines_failed'].replace('{0}', 'cloc exited with code 1.')
        );
        expect(rows(body)).toHaveLength(7);
        expect(body.indexOf(catalog['status.lines_failed'].split('{0}')[0])).toBeLessThan(
            body.indexOf('<table')
        );
        expect(body).toContain(catalog['status.lines_recount']);
    });

    it('is drawn on the Status view after the git line and before the hooks block', () => {
        holding({ count: COUNT, error: '', loading: false });
        vi.stubGlobal('location', { origin: 'http://127.0.0.1:8793' });
        let body: string;
        try {
            body = render(Status, {
                context: clientContext(client),
                props: { instance: { id: 'status-one', view: 'status', state: {} } }
            }).body;
        } finally {
            vi.unstubAllGlobals();
        }
        const git = body.indexOf(catalog['app.git'].replace('{0}', '0'));
        const title = body.indexOf(catalog['status.lines_title']);
        const hooks = body.indexOf(catalog['status.hooks_title']);
        expect(git).toBeGreaterThan(-1);
        expect(title).toBeGreaterThan(git);
        expect(hooks).toBeGreaterThan(title);
    });
});
