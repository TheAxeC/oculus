<script lang="ts">
    // Layer 3, view partial of views/feeds/radar/Radar.svelte. The block under the Lit Watch title:
    // what the radar is, a legend of its bucket marks, and how many papers it tracks since which
    // sweep.
    //
    // The words are catalog lines and every mark is a Glyph beside them, never a character inside
    // them; the separators between the parts are this file's own markup, hidden from a screen
    // reader, so a line holds words alone. A legend mark is the line icon of a bucket's glyph,
    // which is the same shape for every colour, so it is drawn in the hue of the bucket that
    // config/catalogs/vocab.yml's `radar_buckets` gives that glyph; a glyph no bucket names keeps
    // the muted text colour. The sweep's date is a value from the radar file, so the line that
    // carries it is sanitised.

    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import Intro from '../../shared/prose/Intro.svelte';
    import { sanitise } from '$lib/ui/html';
    import type { RadarBucket } from '$lib/state/feeds/radar';
    import { t } from '$lib/state/words/text';
    import { toneOf } from '$lib/state/words/tones';

    type Props = {
        /** The configured buckets, whose hues colour the legend marks. */
        buckets: RadarBucket[];
        /** How many papers are live on the radar. */
        tracked: number;
        /** The last sweep's date as the feed writes it, or the empty string for none. */
        lastRun: string;
    };

    let { buckets, tracked, lastRun }: Props = $props();

    /** The legend mark's colour: the hue of the bucket drawn with this glyph, or none. */
    function markStyle(glyph: string): string | undefined {
        const bucket = buckets.find((one) => one.glyph === glyph);
        return bucket === undefined ? undefined : `color: var(--c-${toneOf(bucket.color)}-txt)`;
    }
</script>

{#snippet sep(text: string)}
    <span class="sep" aria-hidden="true">{text}</span>
{/snippet}

{#snippet mark(glyph: string)}
    <span class="mark" style={markStyle(glyph)}><Glyph name={glyph} /></span>
{/snippet}

<Intro>
    <p class="words" data-radar-intro>
        <span class="part">
            <Glyph name={t('views.radar_glyph')} />
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, oculus's own markup -->
            {@html t('radar.intro_lead')}
        </span>
        <span class="legend">
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render sep('(')}
            <span class="item">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render mark('red')}
                {t('radar.intro_preempt')}
            </span>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render sep('|')}
            <span class="item">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render mark('green')}
                {t('radar.intro_cite')}
            </span>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render sep('|')}
            <span class="item">
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render mark('white')}
                {t('radar.intro_adjacent')}
            </span>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render sep(')')}
        </span>
        <span class="part">
            {t('radar.intro_cross')}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render mark('purple')}
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, oculus's own markup -->
            {@html t('radar.intro_sparks')}
        </span>
        <span class="tail">
            <span class="item">{t('radar.intro_tracked', tracked)}</span>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render sep('|')}
            <span class="item">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitise() filters the sweep's date -->
                {@html sanitise(t('radar.intro_sweep', lastRun || t('radar.no_date')))}
            </span>
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render sep('|')}
            <span class="item">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, oculus's own markup -->
                {@html t('radar.intro_refresh')}
            </span>
        </span>
    </p>
</Intro>

<style>
    .mark {
        display: inline-flex;
    }

    /* The separators are the markup's: the legend in brackets, a bar between two items. */
    .sep {
        margin: 0 0.3em;
        color: var(--muted-txt, var(--muted));
    }
</style>
