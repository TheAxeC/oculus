// Layer 2, client-state tests. Replacing from a Search tab: Replace All and Replace of one hit over
// the query the answer was found by, the files with unsaved text, the refusals a replace says, the
// Replace Preview a hit opens, and a replace that lands after its tab closed or after a newer run.
//
// The endpoint is stubbed with a fetch of the case's own, so nothing starts a process and nothing
// reaches the network.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { json, settle, type ClientState } from '../../../fixtures/client.ts';
import { fakeStorage } from '../../workbench/layout/layout-fixture.ts';
import { tabsOf } from '../../../../src/lib/state/workbench/layout/instance.ts';
import { sourceTabState } from '../../../../src/lib/state/sessions/source.svelte.ts';
import { DIFF_VIEW } from '../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import { heldDiff } from '../../../../src/lib/state/sources/repositories/repositories.ts';
import { fileKey, hitKey } from '../../../../src/lib/state/sources/search/hits.ts';
import {
    replaceDone,
    replaceQuestion,
    replaceStopped
} from '../../../../src/lib/state/sources/search/words.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { A, ANSWER, B, FILES, RAN, searchClient } from './search-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = searchClient();
});

afterEach(() => vi.unstubAllGlobals());

describe('replacing from a tab', () => {
    let posted: Record<string, unknown>[] = [];
    let searched: string[] = [];
    let landing: ((answer: unknown) => void)[] = [];
    let found: unknown = ANSWER;
    type Body = Record<string, unknown>;
    /** The answer of a replace that wrote every file it was sent. */
    const wrote = (body: Body) => ({
        ok: true,
        paths: (body.items as { path: string }[]).map((one) => `hub/${one.path}`)
    });
    const panes = () =>
        client.layout
            .hosts()
            .flatMap((host) => tabsOf(host.workbench.root))
            .filter((tab) => tab.view === DIFF_VIEW);

    /** An ops post answered by `reply`, or held until a case lands it; searches answer `found`. */
    function serve(reply?: (body: Record<string, unknown>) => unknown): void {
        posted = [];
        searched = [];
        landing = [];
        vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
            if (url === '/api/ops') {
                posted.push(JSON.parse(init?.body as string) as Record<string, unknown>);
                const answer =
                    reply === undefined
                        ? await new Promise((done) => landing.push(done))
                        : reply(posted.at(-1) ?? {});
                return json(answer);
            }
            if (url.startsWith('/api/search')) {
                searched.push(url);
                return json(found);
            }
            return json({ entries: [] });
        });
    }

    /** The tab `one` holding an answer of both files, with the replace row shown. */
    function armed(more: Record<string, unknown> = {}): void {
        client.search.setSearchState('one', {
            q: 'foo',
            replacing: true,
            replace: 'bar',
            ran: RAN,
            answer: { files: FILES, total: 3, truncated: false, ms: 1, failed: [] },
            ...more
        });
    }

    const filesOf = () => client.search.searchState('one').answer?.files ?? [];

    beforeEach(() => {
        vi.stubGlobal('window', {});
        client.layout.loadLayout(fakeStorage());
        found = ANSWER;
    });

    it('replaces every listed hit under the query the answer was found by and takes them out of the answer', async () => {
        serve(wrote);
        armed();
        client.search.setSearchState('one', { q: 'typed since' });
        const result = await client.search.replaceHits('one', { kind: 'all' });
        expect(posted).toHaveLength(1);
        expect(posted[0]).toMatchObject({ op: 'replace', query: RAN, replace: 'bar' });
        expect((posted[0].items as unknown[]).length).toBe(2);
        expect(filesOf()).toEqual([]);
        expect(result.focus).toBe('');
        expect(client.search.replaceSaid('one')).toEqual({
            text: replaceDone({ hits: 3, files: 2, text: 'bar' }),
            refused: false
        });
        expect(client.search.searchState('one').replaces).toEqual(['bar']);
    });

    it('keeps what a replace said while the replace text changes, and drops it when the query is edited', async () => {
        serve(wrote);
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        const said = client.search.replaceSaid('one');
        expect(said?.text).toBe(replaceDone({ hits: 3, files: 2, text: 'bar' }));
        client.search.setSearchState('one', { replace: 'baz', preserve: true });
        expect(client.search.replaceSaid('one')).toEqual(said);
        client.search.setSearchState('one', { q: 'foo' });
        expect(client.search.replaceSaid('one')).toEqual(said);
        client.search.setSearchState('one', { q: 'foos' });
        expect(client.search.replaceSaid('one')).toBeNull();
    });

    it('drops what a replace said when a toggle changes the query', async () => {
        serve(wrote);
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        await client.search.toggleMode('one', 'word', ['hub']);
        expect(client.search.replaceSaid('one')).toBeNull();
    });

    it('replaces one hit and hands back the next row to focus', async () => {
        serve(() => ({ ok: true, paths: ['hub/a.ts'] }));
        armed();
        const result = await client.search.replaceHits('one', {
            kind: 'hit',
            file: A,
            hit: A.hits[1]
        });
        expect((posted[0].items as { hits: unknown[] }[])[0].hits).toEqual([
            { line: 1, at: 4, match: 'foo' }
        ]);
        expect(filesOf().map((one) => one.hits.length)).toEqual([1, 1]);
        expect(result.focus).toBe(fileKey(B));
    });

    it('leaves out a file a source tab holds unsaved text of and names it, and writes nothing for it alone', async () => {
        serve(wrote);
        const tab = client.layout.openView('source', sourceTabState('hub', 'a.ts'));
        client.ui.setInstanceState(tab, {
            text: 'typed',
            saved: 'orig',
            loaded: true,
            file: 'hub/a.ts'
        });
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        expect((posted[0].items as { path: string }[]).map((one) => one.path)).toEqual(['b.ts']);
        expect(filesOf().map((one) => one.path)).toEqual(['a.ts']);
        expect(client.search.replaceSaid('one')?.text).toContain(
            t('search.replace_unsaved', 'a.ts')
        );
        await client.search.replaceHits('one', { kind: 'hit', file: A, hit: A.hits[0] });
        expect(posted).toHaveLength(1);
        expect(client.search.replaceSaid('one')).toEqual({
            text: t('search.replace_unsaved_all', 'a.ts'),
            refused: true
        });
    });

    it('asks Replace All over a cut answer about the listed hits only, and sends only them', async () => {
        serve(wrote);
        armed({ max: 3, answer: { files: FILES, total: 3, truncated: true, ms: 1, failed: [] } });
        const asked = client.search.replaceQuestion('one', { kind: 'all' });
        expect(asked).toBe(replaceQuestion({ hits: 3, files: 2, text: 'bar' }, 3));
        expect(asked).not.toBe(replaceQuestion({ hits: 3, files: 2, text: 'bar' }, null));
        await client.search.replaceHits('one', { kind: 'all' });
        expect((posted[0].items as { hits: unknown[] }[]).flatMap((one) => one.hits)).toHaveLength(
            3
        );
        expect(client.search.replaceQuestion('one', { kind: 'all' })).toBeNull();
    });

    it('leaves a dismissed hit unreplaced by Replace All, and out of the preview', async () => {
        serve(wrote);
        armed();
        client.search.dismissHits('one', { kind: 'hit', file: A, hit: A.hits[0] });
        expect(client.search.previewHit('one', hitKey(A, A.hits[1]))).toBe(true);
        const [pane] = panes();
        expect(heldDiff(pane.state).replace?.hits).toEqual([{ line: 1, at: 4 }]);
        expect(heldDiff(pane.state)).toMatchObject({ path: 'a.ts', line: 1 });
        await client.search.replaceHits('one', { kind: 'all' });
        expect(
            (posted[0].items as { hits: { at: number }[] }[])[0].hits.map((one) => one.at)
        ).toEqual([4]);
    });

    it('opens no preview with the replace row hidden, for a file row, or for a row that is gone', () => {
        armed({ replacing: false });
        expect(client.search.previewHit('one', hitKey(A, A.hits[0]))).toBe(false);
        client.search.setSearchState('one', { replacing: true });
        expect(client.search.previewHit('one', fileKey(A))).toBe(false);
        expect(client.search.previewHit('one', 'hit:hub:a.ts:9:9')).toBe(false);
        expect(panes()).toEqual([]);
    });

    it('sends one request when Replace All is pressed twice while the first is in flight', async () => {
        serve();
        armed();
        const first = client.search.replaceHits('one', { kind: 'all' });
        const second = client.search.replaceHits('one', { kind: 'all' });
        expect(await second).toEqual({ focus: '' });
        expect(client.search.replaceRunning('one')).toBe(true);
        await settle();
        landing.forEach((done) => done({ ok: true, paths: ['hub/a.ts', 'hub/b.ts'] }));
        await first;
        expect(posted).toHaveLength(1);
        expect(client.search.replaceRunning('one')).toBe(false);
    });

    it('writes into no tab when the tab closed while the replace was out', async () => {
        serve();
        armed();
        const pending = client.search.replaceHits('one', { kind: 'all' });
        await settle();
        client.ui.clearInstanceState('one');
        client.search.forgetSearch('one');
        landing.forEach((done) => done({ ok: true, paths: ['hub/a.ts', 'hub/b.ts'] }));
        expect(await pending).toEqual({ focus: '' });
        expect(client.ui.instanceState('one')).toBeUndefined();
        expect(client.search.replaceSaid('one')).toBeNull();
    });

    it('keeps the answer of a newer run when an older replace lands after it', async () => {
        serve();
        armed();
        const pending = client.search.replaceHits('one', { kind: 'all' });
        await settle();
        await client.search.runSearch('one', ['hub']);
        landing.forEach((done) => done({ ok: true, paths: ['hub/a.ts', 'hub/b.ts'] }));
        await pending;
        expect(filesOf()).toEqual(ANSWER.files);
    });

    it('writes into no tab when the tab closed while a search was out', async () => {
        let release: () => void = noop;
        vi.stubGlobal('fetch', async () => {
            await new Promise<void>((done) => (release = done));
            return json(ANSWER);
        });
        client.search.setSearchState('one', { q: 'foo' });
        const pending = client.search.runSearch('one', ['hub']);
        await settle();
        client.ui.clearInstanceState('one');
        client.search.forgetSearch('one');
        release();
        await pending;
        expect(client.ui.instanceState('one')).toBeUndefined();
        expect(client.search.searchRunning('one')).toBe(false);
    });

    it('says where a refused replace stopped, with the files done, and keeps the hits it did not write', async () => {
        serve(() => ({ ok: false, error: 'changed', done: ['hub/a.ts'], failed: 'hub/b.ts' }));
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        expect(filesOf().map((one) => one.path)).toEqual(['b.ts']);
        expect(client.search.replaceSaid('one')).toEqual({
            text: replaceStopped('hub/b.ts', 1, 'changed'),
            refused: true
        });
        expect(client.search.replaceSaid('one')?.text).toContain(t('files.refused_changed'));
    });

    it('says the network failed and keeps the whole answer when the post does not arrive', async () => {
        vi.stubGlobal('fetch', () => Promise.reject(new Error('down')));
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        expect(filesOf()).toEqual(FILES);
        expect(client.search.replaceSaid('one')).toEqual({
            text: replaceStopped('', 0, 'network'),
            refused: true
        });
    });

    it.each(['word', 'case', 'regex'] as const)(
        'runs the search again when the %s toggle is turned over while results are shown',
        async (mode) => {
            serve(wrote);
            found = { ok: true, files: FILES, total: 3, truncated: false, ms: 1, failed: [] };
            client.search.setSearchState('one', { q: 'foo', replacing: true, replace: 'bar' });
            await client.search.runSearch('one', ['hub']);
            await client.search.toggleMode('one', mode, ['hub']);
            expect(searched).toHaveLength(2);
            expect(client.search.searchState('one')[mode]).toBe(true);
            expect(client.search.searchState('one').ran?.[mode]).toBe(true);
        }
    );

    it('only turns the toggle over when no results are shown', async () => {
        serve(wrote);
        await client.search.toggleMode('one', 'regex', ['hub']);
        expect(searched).toEqual([]);
        expect(client.search.searchState('one').regex).toBe(true);
    });

    it('previews and replaces with the regex replacement once regex is turned on over a literal run', async () => {
        serve(wrote);
        found = { ok: true, files: FILES, total: 3, truncated: false, ms: 1, failed: [] };
        client.search.setSearchState('one', { q: 'foo', replacing: true });
        await client.search.runSearch('one', ['hub']);
        await client.search.toggleMode('one', 'regex', ['hub']);
        client.search.setSearchState('one', { replace: '[$1]' });
        expect(searched.at(-1)).toContain('regex=1');
        expect(client.search.previewHit('one', hitKey(A, A.hits[0]))).toBe(true);
        const [pane] = panes();
        expect(heldDiff(pane.state).replace).toMatchObject({
            query: { q: 'foo', regex: true },
            replace: '[$1]'
        });
        await client.search.replaceHits('one', { kind: 'all' });
        expect(posted[0]).toMatchObject({
            op: 'replace',
            query: { q: 'foo', regex: true },
            replace: '[$1]'
        });
    });

    it("says nothing in the count line's place after a Replace of a hit or a file's Replace All", async () => {
        // Revert: drop the `pick.kind !== 'all'` return of replaceHits.
        serve(wrote);
        armed();
        await client.search.replaceHits('one', { kind: 'hit', file: A, hit: A.hits[0] });
        expect(client.search.replaceSaid('one')).toBeNull();
        await client.search.replaceHits('one', { kind: 'file', file: B });
        expect(client.search.replaceSaid('one')).toBeNull();
    });

    it('takes the count line of a Replace All away when a Replace of one hit follows', async () => {
        serve(wrote);
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        expect(client.search.replaceSaid('one')).not.toBeNull();
        armed();
        await client.search.replaceHits('one', { kind: 'hit', file: A, hit: A.hits[0] });
        expect(client.search.replaceSaid('one')).toBeNull();
    });

    it('takes the count line of a Replace All away when a hit is dismissed', async () => {
        // Revert: drop the unsay of dismissHits.
        serve(wrote);
        armed();
        await client.search.replaceHits('one', { kind: 'all' });
        armed();
        client.search.dismissHits('one', { kind: 'hit', file: B, hit: B.hits[0] });
        expect(client.search.replaceSaid('one')).toBeNull();
    });

    it('aborts a literal run when regex is turned on during it, and keeps only the regex answer for the preview and Replace', async () => {
        // Revert: let toggleMode run again only while results are shown, as runSearch then
        // returns at once for a tab whose run is in flight.
        posted = [];
        const held: { url: string; signal?: AbortSignal; land: (answer: unknown) => void }[] = [];
        vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
            if (url === '/api/ops') {
                posted.push(JSON.parse(init?.body as string) as Record<string, unknown>);
                return json(wrote(posted.at(-1) ?? {}));
            }
            const answer = await new Promise((land) => {
                held.push({ url, signal: init?.signal ?? undefined, land });
            });
            return json(answer);
        });
        const answer = { ok: true, files: FILES, total: 3, truncated: false, ms: 1, failed: [] };
        client.search.setSearchState('one', { q: 'foo', replacing: true });
        const literal = client.search.runSearch('one', ['hub']);
        const regex = client.search.toggleMode('one', 'regex', ['hub']);
        expect(held.map((one) => one.url.includes('regex=1'))).toEqual([false, true]);
        expect(held[0].signal?.aborted).toBe(true);
        held[1].land(answer);
        held[0].land(answer);
        await Promise.all([literal, regex]);
        expect(client.search.searchState('one').ran?.regex).toBe(true);
        expect(client.search.searchRunning('one')).toBe(false);
        client.search.setSearchState('one', { replace: '[$1]' });
        await client.search.replaceHits('one', { kind: 'all' });
        expect(posted[0]).toMatchObject({ op: 'replace', query: { q: 'foo', regex: true } });
    });

    it('opens the replace row when the replace box is asked for, and the query box without it', () => {
        client.search.wantFocus('one', 'query');
        expect(client.search.searchState('one').replacing).toBe(false);
        expect(client.search.focusWanted('one')).toEqual({ target: 'query', seq: 1 });
        client.search.wantFocus('one', 'replace');
        expect(client.search.searchState('one').replacing).toBe(true);
        expect(client.search.focusWanted('one')).toEqual({ target: 'replace', seq: 2 });
        client.search.focusTaken('one');
        expect(client.search.focusWanted('one')).toBeNull();
    });
});
