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
</script>

<script lang="ts">
    // Layer 3, view. Every primitive with sample data, in one pane: the living style sheet. It is
    // opened under each theme to see what a card, a chip, a meter and a table actually look like
    // there, so a theme is checked against the components rather than against the token list.
    //
    // The sample data is the config's own chip vocabulary rather than invented rows, so the gallery
    // shows the hues the portfolio really uses and a chip added to config/catalogs/vocab.yml
    // appears here without anything being written in this file.

    import Card from '$lib/ui/frame/Card.svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Confirm from '$lib/ui/controls/Confirm.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
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
        chipTone
    } from '$lib/state/shared/words/tones';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';

    let { instance }: ViewProps = $props();
    const cursor = $derived(cardCursor(instance.state));

    /** How many chips the row shows, and how many rows the table gets. */
    const CHIPS = 12;
    const ROWS = 8;

    const chips = $derived(
        chipKeys()
            .slice(0, CHIPS)
            .map((key) => ({
                key,
                label: chipLabel(key),
                glyph: chipGlyphName(key),
                tone: chipTone(key)
            }))
    );

    /** One row per hue the chips use: the hue, the first chip wearing it, and how many wear it. */
    const rows = $derived(
        chipsByTone(chipKeys())
            .slice(0, ROWS)
            .map((row) => ({ tone: row.tone, chip: chipLabel(row.key), count: row.count }))
    );

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

    const most = $derived(rows.reduce((top, row) => Math.max(top, row.count), 1));

    function reset(): void {
        form = 'both';
        query = '';
    }
</script>

{#snippet tagRow()}
    <div class="row">
        {#each chips as chip (chip.key)}
            <Tag label={chip.label} glyph={chip.glyph} />
        {/each}
    </div>
{/snippet}

{#snippet chipRow(filled: boolean)}
    <div class="row">
        {#each chips as chip (chip.key)}
            <Chip label={chip.label} tone={chip.tone} glyph={chip.glyph} {filled} />
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

<Pane title={t('gallery.title')} toolbar={tools} {bar}>
    <div class="gallery" data-instance={instance.id}>
        <section>
            <h3>{t('gallery.cards')}</h3>
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
            </div>
        </section>

        <section>
            <h3>{t('gallery.chips')}</h3>
            {#if form !== 'filled'}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render chipRow(false)}
            {/if}
            {#if form !== 'outline'}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render chipRow(true)}
            {/if}
        </section>

        <section>
            <h3>{t('gallery.tags')}</h3>
            <!-- The same words without the capsule and without a hue, which is what everything a
                 surface lists that is not a status word is drawn as. -->
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render tagRow()}
        </section>

        <section>
            <h3>{t('gallery.meters')}</h3>
            <div class="meters">
                {#each rows.slice(0, 3) as row (row.tone)}
                    <Meter
                        value={row.count / most}
                        tone={row.tone}
                        label={t('gallery.meter', row.chip)}
                        text={String(row.count)}
                    />
                {/each}
            </div>
        </section>

        <section>
            <h3>{t('gallery.table')}</h3>
            <Table {columns} rows={shown} rowKey="tone" {cell} sortable />
        </section>

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

        <section>
            <h3>{t('gallery.ticker')}</h3>
            <Ticker
                rows={rows.slice(0, 3).map((row) => ({
                    id: row.tone,
                    glyph: t('gallery.empty_glyph'),
                    label: row.chip,
                    tail: t('gallery.ticker_tail'),
                    tone: row.tone
                }))}
            />
        </section>

        <section>
            <h3>{t('gallery.empty')}</h3>
            <Empty message={t('gallery.empty_message')} glyph={t('gallery.empty_glyph')} />
        </section>
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
