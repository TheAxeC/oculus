<script lang="ts">
    // Layer 3, Present partial. The whole deck at once: one tile per slide, in deck order, each
    // naming the slide and carrying the theme colour of the project it belongs to. Pressing a tile
    // shows that slide and closes the grid.

    import Card from '$lib/ui/frame/Card.svelte';
    import { t } from '$lib/state/words/text';
    import type { DeckSlide } from '$lib/state/life/present';

    type Props = {
        rows: DeckSlide[];
        /** The key of the slide the reader was on, marked as the one in force. */
        current: string;
        /** The shell's card cursor, the card its keys act on; null for none. */
        cursor: string | null;
        onpick: (key: string) => void;
    };

    let { rows, current, cursor, onpick }: Props = $props();

    /** The row's hue as a custom property, so the edge below names a token and not a colour. */
    function toneStyle(tone: string | undefined): string | undefined {
        return tone === undefined ? undefined : `--tone: var(--c-${tone})`;
    }
</script>

<div class="overview" data-overview>
    {#each rows as row, at (row.key)}
        <div
            class="tile"
            class:toned={row.tone !== undefined}
            class:current={row.key === current}
            style={toneStyle(row.tone)}
        >
            <Card
                id={row.key}
                cursor={row.key === cursor}
                title={row.title === '' ? row.key : row.title}
                level={4}
                ontitle={() => onpick(row.key)}
            >
                {#snippet meta()}
                    <span class="at">{t('present.at', String(at + 1))}</span>
                {/snippet}
            </Card>
        </div>
    {/each}
</div>

<style>
    .overview {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
    }

    /* The theme hue rides the left edge of the tile, as it does on the slide itself. */
    .tile {
        border-left: 4px solid var(--line);
        border-radius: var(--radius-sm);
    }

    .tile.toned {
        border-left-color: var(--tone);
    }

    /* The slide in force is told from the rest by its own hairline, apart from the shell's
       cursor. */
    .tile.current {
        outline: 1px solid var(--accent);
        outline-offset: 1px;
    }

    .at {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }
</style>
