<script module lang="ts">
    // Layer 3, view registration. The journal browser opens the Registries page's group beside
    // Venues, after it by its id at the same position.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'venues-browser',
        label: 'views.venues_browser',
        glyph: 'views.venues_browser_glyph',
        group: 'registries',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The journal browser: a search by words of the browser a hub names, its
    // `venues.browser` row, with the filters, the sort orders and the page sizes the row names, and
    // per hit its title, ISSNs, publisher, fee and open-access status and an Add that writes the
    // hit into the hub's venues registry through the registry's Add box
    // (views/shared/forms/entry/entry-add.ts `browserHitAsk`). With no hub naming a browser the
    // view says what is missing and where it is set.
    //
    // The browser is asked only on a press: the view's start lists the hubs' browsers, a request
    // to oculus that asks no browser, and Search and More each send the one request of their press
    // (state/sources/registries/browser.ts). The search is the tab's instance state; the hits are
    // not kept, so a tab drawn again shows none until Search is pressed.

    import { onDestroy, onMount } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import AddAsk from '$lib/views/shared/forms/entry/AddAsk.svelte';
    import { browserHitAsk, type Ask } from '$lib/views/shared/forms/entry/entry-add';
    import { routeBody } from '$lib/state/feeds/literature/answers';
    import {
        BROWSER_LIST_URL,
        browserList,
        browserRead,
        parseBrowserState,
        searchUrl,
        stopWords,
        type BrowserHit,
        type BrowserInfo,
        type BrowserSearch
    } from '$lib/state/sources/registries/browser';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { storedState } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { registryCollections, registryKey },
        ui: { instanceState, setInstanceState },
        writes: { writeToken }
    } = client;

    let { instance }: ViewProps = $props();

    const held = $derived(parseBrowserState(instanceState(instance.id)));
    /** The hubs' browsers as the route lists them; null until the list has landed. */
    let listed = $state<BrowserInfo[] | null>(null);
    /** The browser searched: the hub the search names, else the first listed. */
    const browser = $derived(listed?.find((one) => one.hub === held.hub) ?? listed?.at(0) ?? null);
    let hits = $state<BrowserHit[] | null>(null);
    let total = $state<number | null>(null);
    let cursor = $state<string | null>(null);
    let said = $state('');
    let busy = $state(false);
    let asking = $state<Ask | null>(null);
    let closed = false;
    let controller: AbortController | null = null;

    function write(next: Partial<BrowserSearch>): void {
        setInstanceState(instance.id, storedState({ ...held, ...next }));
    }

    /** The search as it is asked: the browser's hub and the choices held. */
    const search = $derived<BrowserSearch>({ ...held, hub: browser?.hub ?? '' });

    /** Ask one page: the first for Search, the cursor's for More. */
    async function ask(more: boolean): Promise<void> {
        if (browser === null || search.words.trim() === '') return;
        controller?.abort();
        const own = new AbortController();
        controller = own;
        busy = true;
        said = '';
        const body = await routeBody(
            searchUrl(search, more ? cursor : null),
            writeToken(),
            own.signal
        );
        if (closed || controller !== own) return;
        busy = false;
        const read = browserRead(body);
        if (read === null || 'refused' in read || read.state !== 'ok') {
            said = stopWords(read);
            if (!more) hits = [];
            cursor = null;
            return;
        }
        hits = more ? [...(hits ?? []), ...read.hits] : read.hits;
        total = read.total;
        cursor = read.cursor;
    }

    /** Open the venues registry's Add box over one hit, in the browser's hub. */
    function add(hit: BrowserHit): void {
        const hub = browser?.hub ?? '';
        const collections = registryCollections('venues');
        const own = collections.find((one) => rootOf(one) === hub);
        const key = registryKey('venues', hub);
        asking = browserHitAsk(client, hit, key, own?.schema, own?.title ?? key, collections, hub);
    }

    const hubs = $derived((listed ?? []).map((one) => ({ id: one.hub, label: one.hub })));
    const filters = $derived(
        (browser?.filters ?? []).map((label, at) => ({ id: String(at), label }))
    );
    const sorts = $derived((browser?.sorts ?? []).map((label, at) => ({ id: String(at), label })));
    const sizes = $derived(
        (browser?.sizes ?? []).map((size) => ({ id: String(size), label: String(size) }))
    );
    /** A choice's place read back from its id, null for the empty choice. */
    const placeOf = (id: string): number | null => (id === '' ? null : Number(id));

    onMount(() => {
        void (async () => {
            const listing = browserList(await routeBody(BROWSER_LIST_URL, writeToken()));
            if (!closed) listed = listing ?? [];
        })();
    });

    onDestroy(() => {
        closed = true;
        controller?.abort();
    });
</script>

{#snippet bar()}
    <Toolbar label={t('venue_browser.toolbar')}>
        <Search
            fill
            value={held.words}
            placeholder={t('venue_browser.words')}
            oninput={(words: string) => write({ words })}
            onenter={() => void ask(false)}
        />
        <ToolButton
            label={t('venue_browser.search')}
            glyph="search"
            disabled={browser === null || held.words.trim() === ''}
            onclick={() => void ask(false)}
        />
    </Toolbar>
{/snippet}

<Pane title={t('views.venues_browser')} {bar}>
    <div class="browser" data-instance={instance.id}>
        {#if listed !== null && browser === null}
            <Empty message={t('venue_browser.none')} />
        {:else if browser !== null}
            <Surface>
                <div class="choices" role="group" aria-label={t('venue_browser.choices')}>
                    {#if hubs.length > 1}
                        <Select
                            value={browser.hub}
                            label={t('venue_browser.hub')}
                            choices={hubs}
                            onchange={(hub: string) =>
                                write({ hub, filter: null, sort: null, size: null })}
                        />
                    {/if}
                    {#if filters.length > 0}
                        <Select
                            value={held.filter === null ? '' : String(held.filter)}
                            label={t('venue_browser.filter')}
                            empty={t('venue_browser.filter_none')}
                            choices={filters}
                            onchange={(id: string) => write({ filter: placeOf(id) })}
                        />
                        <span class="value">
                            <TextInput
                                value={held.value}
                                label={t('venue_browser.filter_value')}
                                placeholder={t('venue_browser.filter_value')}
                                disabled={held.filter === null}
                                oninput={(value: string) => write({ value })}
                            />
                        </span>
                    {/if}
                    {#if sorts.length > 0}
                        <Select
                            value={held.sort === null ? '' : String(held.sort)}
                            label={t('venue_browser.sort')}
                            empty={t('venue_browser.sort_none')}
                            choices={sorts}
                            onchange={(id: string) => write({ sort: placeOf(id) })}
                        />
                    {/if}
                    {#if sizes.length > 0}
                        <Select
                            value={String(held.size ?? sizes[0].id)}
                            label={t('venue_browser.size')}
                            choices={sizes}
                            onchange={(id: string) => write({ size: Number(id) })}
                        />
                    {/if}
                    <span class="name">{t('venue_browser.from', browser.name)}</span>
                </div>
            </Surface>
            {#if asking !== null}
                <AddAsk ask={asking} onclose={() => (asking = null)} />
            {/if}
            {#if said !== ''}
                <Surface><p class="said">{said}</p></Surface>
            {/if}
            {#if busy}
                <Empty message={t('venue_browser.searching')} />
            {:else if hits === null}
                <Empty message={t('venue_browser.idle')} />
            {:else if hits.length === 0 && said === ''}
                <Empty message={t('venue_browser.no_hits')} />
            {:else if hits.length > 0}
                <Surface>
                    <p class="count">
                        {total === null
                            ? t('venue_browser.count', hits.length)
                            : t('venue_browser.count_of', hits.length, total)}
                    </p>
                </Surface>
                <ul class="hits">
                    {#each hits as hit, at (at)}
                        <li>
                            <Surface>
                                <div class="hit">
                                    <strong>{hit.title ?? t('venue_browser.untitled')}</strong>
                                    <span class="line">
                                        {hit.issn.length === 0
                                            ? t('venue_browser.no_issn')
                                            : t('venue_browser.issn', hit.issn.join(', '))}
                                    </span>
                                    {#if hit.publisher !== undefined}
                                        <span class="line">{hit.publisher}</span>
                                    {/if}
                                    {#if hit.fee !== undefined}
                                        <span class="line">{t('venue_browser.fee', hit.fee)}</span>
                                    {/if}
                                    {#if hit.open_access !== undefined}
                                        <span class="line">
                                            {t('venue_browser.open_access', hit.open_access)}
                                        </span>
                                    {/if}
                                    <span class="add">
                                        <ToolButton
                                            label={t('venue_browser.add')}
                                            glyph="add"
                                            onclick={() => add(hit)}
                                        />
                                    </span>
                                </div>
                            </Surface>
                        </li>
                    {/each}
                </ul>
                {#if cursor !== null}
                    <ToolButton label={t('venue_browser.more')} onclick={() => void ask(true)} />
                {/if}
            {/if}
        {/if}
    </div>
</Pane>

<style>
    /* The choices, the said line and the hits, 10px apart. */
    .browser {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
    }

    .choices {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
    }

    .value {
        width: 18ch;
    }

    .name,
    .count,
    .said,
    .line {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .count,
    .said {
        margin: 0;
    }

    .hits {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .hit {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .add {
        align-self: flex-start;
        margin-top: 4px;
    }
</style>
