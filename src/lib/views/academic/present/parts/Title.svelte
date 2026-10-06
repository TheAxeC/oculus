<script lang="ts">
    // Layer 3, Present partial. A title or a closing slide: the kicker, the headline, the lede, the
    // legend of the group the slide names and the contact line a closing slide may carry.

    import Legend from './Legend.svelte';
    import Words from './Words.svelte';

    type Props = {
        kind: 'title' | 'closing';
        kicker?: string;
        heading: string;
        lede: string;
        contact?: string;
        /** The domain keys the legend shows. */
        legend: string[];
    };

    let { kind, kicker, heading, lede, contact, legend }: Props = $props();
</script>

<section class="slide" data-slide-kind={kind}>
    {#if kicker !== undefined && kicker !== ''}
        <div class="kicker"><Words text={kicker} /></div>
    {/if}
    {#if heading !== ''}
        <h3 class="headline"><Words text={heading} /></h3>
    {/if}
    {#if lede !== ''}
        <div class="lede"><Words text={lede} block /></div>
    {/if}
    <Legend domains={legend} />
    {#if contact !== undefined && contact !== ''}
        <p class="hint"><Words text={contact} /></p>
    {/if}
</section>

<style>
    .slide {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .kicker {
        color: var(--accent-txt, var(--accent));
        font-size: var(--slide-fs-small);
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .headline {
        margin: 0.2em 0;
        font-size: var(--slide-fs-title);
        letter-spacing: -0.02em;
        line-height: 1.05;
    }

    .lede {
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-sub);
    }

    .hint {
        margin-top: 1.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--slide-fs-small);
    }
</style>
