<script module lang="ts">
    // Layer 3, view registration. The Literature search opens the Literature page's group, before
    // Lit Watch and the Literature collection, so it is `b` then `1`. Its id is
    // `literature-search`, since `literature` is the key oculus's own list
    // (config/defaults/sources.yml) gives the collection of saved papers, whose view has that id.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'literature-search',
        label: 'views.literature_search',
        glyph: 'views.literature_search_glyph',
        group: 'literature',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. One query asked of the scholarly sources at once, their hits merged into
    // papers by DOI, PubMed id or arXiv id, with filters, a sort, and per paper the abstract, the
    // open PDF, Copy BibTeX and Add to Lit Watch. The sources are the rows of `literature.sources`
    // of the primary hub's `.oculus/config.yml`, as the server lists them; with none the view says
    // that no source is configured and where it is set, and sends nothing. Google Scholar has no
    // API and its terms forbid scraping, so it is a link that opens the same query on its site,
    // drawn when the hub's `links` hold a `scholar` row.
    //
    // The query, the filters, the sort and the toggles are the tab's instance state, saved with the
    // layout. The answers are not: a tab drawn again with a query held asks it once more, which the
    // server answers from its cache within `literature.cache_min`. A search started while one is in
    // flight aborts it, and only the latest search's answers are drawn. Every filter is applied
    // again to the merged list, whatever the sources did with it; changing the sort asks nothing.
    // While a search is under way a moving line is drawn across the top of the results, named
    // Searching, above the papers already answered; under the system's reduce-motion setting it is
    // drawn still.
    //
    // The view sends the query and its filters to the sources toggled on, through the server, and
    // writes nothing but the Lit Watch entry the reader adds. It never writes a `.bib` file.
    //
    // Over a wallpaper each paper's card is its own surface; the sources and filters, the refusal,
    // the said line and the count are read off a `Surface`.

    import { onDestroy, onMount } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Progress from '$lib/ui/display/meters/Progress.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Head from './Head.svelte';
    import LiteratureCard from './LiteratureCard.svelte';
    import { refusalWords } from './words';
    import { SOURCES_URL, routeBody, sourceList } from '$lib/state/feeds/literature/answers';
    import {
        formRefusal,
        parseForm,
        sourcesOn,
        timeoutSeconds,
        type LiteratureForm,
        type LiteratureSource,
        type SourceInfo
    } from '$lib/state/feeds/literature/form';
    import {
        filtersOf,
        mergeHits,
        orderOf,
        passes,
        sortHits
    } from '$lib/state/feeds/literature/merge';
    import { inRadar } from '$lib/state/feeds/literature/radar';
    import { createRun } from '$lib/state/feeds/literature/run.svelte';
    import { scholarUrl } from '$lib/state/feeds/literature/scholar';
    import { radarBuckets } from '$lib/state/feeds/radar';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { projectDisplay, recordChoices, selectChoices } from '$lib/state/forms/schema';
    import { vocabOf } from '$lib/state/shared/words/tones';

    const {
        entities: { config, portfolio },
        feeds: { feed },
        fs: { primary },
        ui: { instanceState, setInstanceState },
        writes: { writeToken }
    } = useState();

    let { instance }: ViewProps = $props();

    const run = createRun({ token: writeToken });
    const form = $derived(parseForm(instanceState(instance.id)));
    const cursor = $derived(cardCursor(instance.state));
    const radar = $derived(feed('radar'));
    const buckets = $derived(
        radarBuckets(vocabOf().radar_buckets).map((bucket) => ({
            id: bucket.key,
            label: bucket.label
        }))
    );
    /**
     * The projects a paper added to the radar may name, by key and shown by the project form's
     * display (`projectDisplay`): the radar is the primary hub's, so its projects come first, then
     * another hub's under that hub's name, each group by those words.
     */
    const projects = $derived(
        selectChoices(
            recordChoices(
                portfolio()?.entities.projects,
                projectDisplay(config()?.config ?? {}),
                primary() ?? ''
            ).sort(
                (left, right) =>
                    Number(left.hub !== undefined) - Number(right.hub !== undefined) ||
                    left.label.localeCompare(right.label)
            )
        )
    );
    const timeoutS = $derived(timeoutSeconds(config()?.config ?? {}));

    /** The sources the server lists, in its order: null until `?sources` answers. */
    let listed = $state<SourceInfo[] | null>(null);
    const sources = $derived(listed ?? []);
    const read = $derived(orderOf(config()?.config ?? {}));
    const scholar = $derived(scholarUrl(form, read.links));
    let said = $state('');

    /** The form the list on screen was asked with; its filters are the ones applied to the list. */
    const asked = $derived(run.asked() ?? form);
    const papers = $derived.by(() => {
        const filters = filtersOf(asked, Date.now());
        const order = { sources: sources.map((one) => one.id), ...read };
        const merged = mergeHits(run.hits(), order).filter((paper) => passes(paper, filters));
        return sortHits(merged, form.sort);
    });
    const typed = $derived(formRefusal(form, Date.now()));
    const problem = $derived(typed !== null && typed !== 'query_empty' ? typed : run.refused());
    const entries = $derived(radar?.entries ?? []);

    function change(changes: Partial<LiteratureForm>): void {
        setInstanceState(instance.id, { ...form, ...changes });
    }

    function go(): void {
        said = '';
        run.search(form, sourcesOn(form, sources));
    }

    function toggle(source: LiteratureSource, on: boolean): void {
        change({ toggled: { ...form.toggled, [source]: on } });
        run.toggle(source, on);
    }

    // Whether the tab was closed, so the listing of sources that lands after it starts no search.
    let closed = false;

    onMount(() => {
        void (async () => {
            const listing = sourceList(await routeBody(SOURCES_URL, writeToken()));
            if (closed) return;
            if (listing !== null) listed = listing;
            if (form.q.trim() !== '' && sources.length > 0) go();
        })();
    });

    onDestroy(() => {
        closed = true;
        run.stop();
    });
</script>

{#snippet bar()}
    <Toolbar label={t('literature.toolbar')}>
        <Search
            fill
            value={form.q}
            placeholder={t('literature.query')}
            oninput={(q: string) => change({ q })}
            onenter={go}
        />
        <ToolButton
            label={t('literature.search')}
            glyph="search"
            disabled={listed !== null && listed.length === 0}
            onclick={go}
        />
        {#if scholar !== undefined}
            <!-- eslint-disable svelte/no-navigation-without-resolve -- Google Scholar is another site, rather than a route id resolve() takes -->
            <a
                class="scholar"
                href={scholar}
                target="_blank"
                rel="noreferrer"
                title={t('literature.scholar_tip')}
            >
                <Glyph name="link" />
                {t('literature.scholar')}
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('views.literature_search')} {bar}>
    <div class="literature" data-instance={instance.id}>
        <Surface>
            <Head
                {form}
                {sources}
                runs={run.sources()}
                {timeoutS}
                onchange={change}
                ontoggle={toggle}
            />
        </Surface>

        {#if problem !== null}
            <Surface>
                <p class="problem" role="alert">{refusalWords(problem)}</p>
            </Surface>
        {/if}
        {#if said !== ''}
            <Surface>
                <p class="said">{said}</p>
            </Surface>
        {/if}

        {#if listed !== null && listed.length === 0}
            <Empty message={t('literature.no_sources')} glyph="book" />
        {:else if run.noneOn()}
            <Empty message={t('literature.none_on')} glyph="book" />
        {:else if run.asked() === null}
            <Empty message={t('literature.idle')} glyph="book" />
        {:else}
            {#if run.running()}
                <div class="running">
                    <Progress percent={null} label={t('literature.searching')} />
                </div>
            {/if}
            {#if papers.length > 0}
                <Surface>
                    <p class="count">
                        {papers.length === 1
                            ? t('literature.count_one')
                            : t('literature.count', papers.length)}
                    </p>
                </Surface>
                <div class="cards">
                    {#each papers as paper (paper.key)}
                        <LiteratureCard
                            hit={paper}
                            {sources}
                            id={paper.key}
                            cursor={cursor === paper.key}
                            inRadar={inRadar(paper, entries)}
                            {buckets}
                            {projects}
                            radarMissing={radar?.missing === true}
                            onsaid={(words: string) => (said = words)}
                        />
                    {/each}
                </div>
            {:else if run.running()}
                <Empty message={t('literature.searching')} glyph="book" />
            {:else}
                <Empty message={t('literature.no_hits')} glyph="book" />
            {/if}
            {#if run.hasMore()}
                <div class="foot">
                    <ToolButton label={t('literature.more')} onclick={() => run.more()} />
                </div>
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .running {
        display: flex;
    }

    /* One column the width of the pane, however long a line inside it: a grid's own column would
       otherwise grow to the widest line it holds and widen the pane. */
    .literature,
    .cards {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    /* A part on a `Surface` is the grid's item through the Surface's box over a wallpaper and by
       itself without one (`display: contents`), so both shrink to the column. */
    .literature > :global(*),
    .literature > :global([data-surface]) > :global(*),
    .cards > :global(*) {
        min-width: 0;
    }

    .cards {
        gap: 8px;
    }

    .count,
    .said,
    .problem {
        margin: 0;
    }

    .count {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .problem {
        color: var(--c-red-txt);
    }

    .scholar {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--accent-txt, var(--accent));
        white-space: nowrap;
    }

    .foot {
        display: flex;
        justify-content: center;
    }
</style>
