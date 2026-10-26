<script module lang="ts">
    // Layer 3, view registration. Gallery closes the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'gallery',
        label: 'views.gallery',
        glyph: 'views.gallery_glyph',
        group: 'views',
        order: 8
    };

    /**
     * A word drawn as a sample: its key, its words, its glyph and its hue. It is declared in the
     * module script so the snippets of the template can name it.
     */
    type Sample = { key: string; label: string; glyph: string; tone: string };
</script>

<script lang="ts">
    // Layer 3, view. Every primitive with sample data, in one pane: the living style sheet. It is
    // opened under each theme to see what a card, a chip, a meter and a table actually look like
    // there, so a theme is checked against the components rather than against the token list. The
    // cards include the record card every record of the portfolio is drawn by
    // (views/shared/card/record/RecordCard.svelte), with its strip, its menu with the Add run and a
    // foot of the portfolio's first projects; its actions write nothing.
    //
    // The sample data is the config's own vocabulary: the Chips and the Tags sections draw every
    // word of `stages`, `forms` and `chips`, grouped by its list in the config's order, and the
    // table draws one row per hue those words wear. A word added to any of the three lists of
    // config/catalogs/vocab.yml appears here with nothing written in this file.
    //
    // Over a wallpaper each sample card is its own surface, and every other section is read off a
    // `Surface`. The table is drawn on none: its header row stays over its rows as the pane scrolls
    // (`stays`), so the header row and the rows carry the surface themselves and nothing is drawn
    // behind the header row.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import { type Column, cellText } from '$lib/ui/display/table/table-rows';
    import Ticker from '$lib/ui/display/ticker/Ticker.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import {
        chipGlyphName,
        chipKeys,
        chipLabel,
        chipsByTone,
        chipTone,
        legendLists,
        type LegendList
    } from '$lib/state/shared/words/tones';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import {
        pageAction,
        statusAction,
        type RecordAction
    } from '$lib/views/shared/card/record/record-menu';
    import { portfolioProjects } from '$lib/state/boards/focus';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { portfolio }
    } = useState();

    let { instance }: ViewProps = $props();
    const cursor = $derived(cardCursor(instance.state));

    /** A word as the chips and the tags draw it. */
    function sample(key: string): Sample {
        return { key, label: chipLabel(key), glyph: chipGlyphName(key), tone: chipTone(key) };
    }

    /** The heading a list's group is drawn under. */
    function heading(list: LegendList): string {
        if (list === 'stages') return t('gallery.group_stages');
        if (list === 'forms') return t('gallery.group_forms');
        return t('gallery.group_chips');
    }

    /** One group per list that holds a word, in the legend's order, its words in the config's. */
    const groups = $derived(
        legendLists().map((row) => ({
            list: row.list,
            heading: heading(row.list),
            words: row.keys.map(sample)
        }))
    );

    /** Every word once, in the legend's order: the first card's chips are its first two. */
    const chips = $derived(chipKeys().map(sample));

    /** One row per hue the words wear: the hue, the first word wearing it, and how many wear it. */
    const rows = $derived(
        chipsByTone(chipKeys()).map((row) => ({
            tone: row.tone,
            chip: chipLabel(row.key),
            count: row.count
        }))
    );

    /**
     * The record card's sample actions, which do nothing: Page and Edit in File in its strip, a
     * Status submenu of the first three words with the first in force, and Delete.
     */
    const recordActions = $derived.by((): RecordAction[] => [
        pageAction(() => undefined),
        {
            id: 'edit',
            label: t('collection.edit_in_file'),
            glyph: t('collection.edit_glyph'),
            onclick: () => undefined
        },
        ...statusAction(
            chips.slice(0, 3).map((chip, at) => ({
                id: `status:${chip.key}`,
                label: chip.label,
                checked: at === 0,
                onclick: () => undefined
            }))
        ),
        {
            id: 'delete',
            label: t('entry_form.delete'),
            glyph: t('entry_form.delete_glyph'),
            onclick: () => undefined
        }
    ]);

    /** The projects the record card's foot draws: the first of the portfolio's. */
    const sampleProjects = $derived(portfolioProjects(portfolio()).slice(0, 8));

    /** The rows the Meters and the Ticker draw. */
    const leading = $derived(rows.slice(0, 3));

    const columns: Column[] = [
        { key: 'tone', label: t('gallery.col_tone') },
        { key: 'chip', label: t('gallery.col_chip') },
        { key: 'count', label: t('gallery.col_count'), numeric: true, width: '5rem' }
    ];

    const forms = [
        { id: 'outline', label: t('gallery.form_outline') },
        { id: 'filled', label: t('gallery.form_filled') },
        { id: 'both', label: t('gallery.form_both') }
    ];

    let form = $state('both');
    let query = $state('');
    let asking = $state(false);

    const shown = $derived(
        rows.filter((row) => {
            const needle = query.trim().toLowerCase();
            if (needle === '') return true;
            return row.tone.includes(needle) || row.chip.toLowerCase().includes(needle);
        })
    );

    /** The largest count among the rows the Meters draw, which a full meter stands for. */
    const most = $derived(leading.reduce((top, row) => Math.max(top, row.count), 1));

    function reset(): void {
        form = 'both';
        query = '';
    }
</script>

{#snippet tagRow(words: Sample[])}
    <div class="row">
        {#each words as word (word.key)}
            <Tag label={word.label} glyph={word.glyph} />
        {/each}
    </div>
{/snippet}

{#snippet chipRow(words: Sample[], filled: boolean)}
    <div class="row">
        {#each words as word (word.key)}
            <Chip label={word.label} tone={word.tone} glyph={word.glyph} {filled} />
        {/each}
    </div>
{/snippet}

{#snippet tools()}
    <Toolbar label={t('gallery.toolbar')} overflow>
        <ToolButton
            bare
            label={t('gallery.reset')}
            glyph={t('gallery.reset_glyph')}
            onclick={reset}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('gallery.filters')}>
        <Search
            fill
            value={query}
            placeholder={t('gallery.search')}
            oninput={(next: string) => (query = next)}
        />
        <Segment
            label={t('gallery.form')}
            items={forms}
            value={form}
            onchange={(id: string) => (form = id)}
        />
    </Toolbar>
{/snippet}

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {#if column.key === 'chip'}
        <Chip label={cellText(row.chip)} tone={cellText(row.tone)} />
    {:else}
        {cellText(row[column.key])}
    {/if}
{/snippet}

<!-- The record card's text. -->
{#snippet text()}
    {t('gallery.card_body')}
{/snippet}

<Pane title={t('gallery.title')} toolbar={tools} {bar}>
    <div class="gallery" data-instance={instance.id}>
        <section>
            <Surface>
                <h3>{t('gallery.cards')}</h3>
            </Surface>
            <div class="cards">
                <Card id="plain" cursor={cursor === 'plain'} title={t('gallery.card_plain')}>
                    {#snippet meta()}
                        {#each chips.slice(0, 2) as chip (chip.key)}
                            <Chip label={chip.label} tone={chip.tone} glyph={chip.glyph} />
                        {/each}
                    {/snippet}
                    {t('gallery.card_body')}
                </Card>
                <Card
                    id="tone"
                    cursor={cursor === 'tone'}
                    title={t('gallery.card_tone')}
                    tone={rows[0]?.tone}
                >
                    {t('gallery.card_body')}
                    {#snippet footer()}
                        {t('gallery.card_footer')}
                    {/snippet}
                </Card>
                <Card
                    id="pinned"
                    cursor={cursor === 'pinned'}
                    title={t('gallery.card_pinned')}
                    pinned
                >
                    {t('gallery.card_body')}
                </Card>
                <RecordCard
                    id="record"
                    cursor={cursor === 'record'}
                    title={t('gallery.card_record')}
                    tone={rows[1]?.tone}
                    actions={recordActions}
                    strip={['page', 'edit']}
                    dated={{ target: { id: '' }, blocked: t('gallery.record_blocked') }}
                    {text}
                    projects={sampleProjects}
                />
            </div>
        </section>

        <Surface>
            <section>
                <h3>{t('gallery.chips')}</h3>
                {#each groups as group (group.list)}
                    <h4>{group.heading}</h4>
                    {#if form !== 'filled'}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render chipRow(group.words, false)}
                    {/if}
                    {#if form !== 'outline'}
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render chipRow(group.words, true)}
                    {/if}
                {/each}
            </section>
        </Surface>

        <Surface>
            <section>
                <h3>{t('gallery.tags')}</h3>
                <!-- The same words without the capsule and without a hue, which is what everything
                     a surface lists that is not a status word is drawn as. -->
                {#each groups as group (group.list)}
                    <h4>{group.heading}</h4>
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render tagRow(group.words)}
                {/each}
            </section>
        </Surface>

        <Surface>
            <section>
                <h3>{t('gallery.meters')}</h3>
                <div class="meters">
                    {#each leading as row (row.tone)}
                        <Meter
                            value={row.count / most}
                            tone={row.tone}
                            label={t('gallery.meter', row.chip)}
                            text={String(row.count)}
                        />
                    {/each}
                </div>
            </section>
        </Surface>

        <section>
            <Surface>
                <h3>{t('gallery.table')}</h3>
            </Surface>
            <Table {columns} rows={shown} rowKey="tone" {cell} sortable stays />
        </section>

        <Surface>
            <section>
                <h3>{t('gallery.confirm')}</h3>
                <ToolButton label={t('gallery.confirm_open')} onclick={() => (asking = true)} />
                {#if asking}
                    <Confirm
                        message={t('gallery.confirm_message')}
                        detail={t('gallery.confirm_detail')}
                        confirm={t('ui.confirm_ok')}
                        cancel={t('ui.confirm_cancel')}
                        onconfirm={() => (asking = false)}
                        oncancel={() => (asking = false)}
                    />
                {/if}
            </section>
        </Surface>

        <Surface>
            <section>
                <h3>{t('gallery.ticker')}</h3>
                <Ticker
                    rows={leading.map((row) => ({
                        id: row.tone,
                        glyph: t('gallery.empty_glyph'),
                        label: row.chip,
                        tail: t('gallery.ticker_tail'),
                        tone: row.tone
                    }))}
                />
            </section>
        </Surface>

        <Surface>
            <section>
                <h3>{t('gallery.empty')}</h3>
                <Empty message={t('gallery.empty_message')} glyph={t('gallery.empty_glyph')} />
            </section>
        </Surface>
    </div>
</Pane>

<style>
    .gallery {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    h3 {
        margin: 0 0 8px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
    }

    h4 {
        margin: 12px 0 6px;
        font-size: var(--fs-xs);
        font-weight: 600;
    }

    h3 + h4 {
        margin-top: 0;
    }

    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
        gap: 10px;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
    }

    .meters {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 360px;
    }
</style>
