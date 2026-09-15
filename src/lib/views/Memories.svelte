<script module lang="ts">
    // Layer 3, view registration. The photo wall sits in the Personal group with the two documents
    // of the hub that are drawn there.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'memories',
        label: 'views.memories',
        glyph: 'views.memories_glyph',
        group: 'personal',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. The photo wall: every picture of the configured folder as a tile, one of them
    // enlarged over the pane, and the control that adds another.
    //
    // The pictures are referenced by URL and never inlined: the folder is megabytes, the document is
    // not, and a browser caches a URL. The columns are CSS, so a tall picture and a wide one sit
    // beside each other without a library measuring anything: the wall is a column count that falls
    // with the pane's width and each tile is kept whole inside its column.
    //
    // The enlarged picture is this view's own overlay rather than a primitive, since it is the one
    // place in oculus where a picture is shown over the pane and `ui/` would gain a component with
    // one reader. It closes on Escape, on a press outside the picture and on its own control, and the
    // tile that opened it takes the keyboard back, so the wall is where the reader left it.

    import { tick } from 'svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { tooLarge, uploadMessage } from '$lib/state/memories';
    import { useState } from '$lib/state/use';
    import type { ViewProps } from './registry';

    const {
        memories: { wall, reload },
        writes: { addMemory }
    } = useState();

    let { instance }: ViewProps = $props();

    const held = $derived(wall());
    const images = $derived(held.images);

    /** The picture the overlay shows, and the empty string when it shows none. */
    let open = $state('');

    /** Every file of the last add that was not written, with the sentence saying why. */
    let failed: { name: string; said: string }[] = $state([]);

    /** True while an add is in flight, so a second press sends no second write. */
    let busy = $state(false);

    /** The hidden input the add control presses, which is the only way a file is chosen. */
    let chooser: HTMLInputElement | null = $state(null);

    /** The address one picture is served at. */
    function source(name: string): string {
        return `/api/memories?file=${encodeURIComponent(name)}`;
    }

    /** The overlay's own box, which takes the keyboard so Escape reaches it wherever it is pressed. */
    let overlay: HTMLDivElement | null = $state(null);

    /** This pane's own box, so a second Memories pane keeps its own tiles and its own keyboard. */
    let box: HTMLDivElement | null = $state(null);

    /** Show one picture over the pane, and put the keyboard inside it. */
    async function enlarge(name: string): Promise<void> {
        open = name;
        await tick();
        overlay?.focus();
    }

    /** Put the picture away and give the keyboard back to the tile that opened it. */
    async function close(): Promise<void> {
        const name = open;
        open = '';
        await tick();
        const tile = box?.querySelector(`[data-tile="${CSS.escape(name)}"]`);
        if (tile instanceof HTMLElement) tile.focus();
    }

    /** Escape closes the overlay, wherever the keyboard is inside it. */
    function keys(event: KeyboardEvent): void {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        void close();
    }

    /** One file as base64, which is what the endpoint takes. */
    function encoded(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error(t('memories.reading')));
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.readAsDataURL(file);
        });
    }

    /**
     * Add every file the reader chose, then ask the folder again. Each file that was not written is
     * kept with its own sentence, so five chosen files that fail for three reasons say all three.
     * A file larger than the wall takes is refused here, before it is read: the request that carried
     * it would be refused by the server's own parser, and the reader would meet that and not a
     * sentence.
     */
    async function add(event: Event): Promise<void> {
        const field = event.currentTarget;
        if (!(field instanceof HTMLInputElement) || field.files === null) return;
        const chosen = [...field.files];
        field.value = '';
        if (chosen.length === 0 || busy) return;
        busy = true;
        const refused: { name: string; said: string }[] = [];
        for (const file of chosen) {
            if (tooLarge(file.size)) {
                refused.push({
                    name: file.name,
                    said: uploadMessage({ ok: false, error: 'data' })
                });
                continue;
            }
            try {
                const answer = await addMemory(file.name, await encoded(file));
                if (!answer.ok) refused.push({ name: file.name, said: uploadMessage(answer) });
            } catch {
                refused.push({ name: file.name, said: t('memories.reading') });
            }
        }
        failed = refused;
        busy = false;
        reload();
    }
</script>

{#snippet tools()}
    <Toolbar label={t('memories.toolbar')}>
        <ToolButton
            label={t('memories.add')}
            glyph={t('memories.add_glyph')}
            title={t('memories.add_tip')}
            disabled={busy}
            onclick={() => chooser?.click()}
        />
    </Toolbar>
{/snippet}

<Pane title={t('memories.title')} toolbar={tools} tinted>
    <div class="memories" bind:this={box} data-instance={instance.id} data-memories>
        <input
            class="chooser"
            bind:this={chooser}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            hidden
            onchange={(event: Event) => void add(event)}
        />
        {#if failed.length === 1}
            <p class="failed" aria-live="polite">
                {t('memories.failed', failed[0].name, failed[0].said)}
            </p>
        {:else if failed.length > 1}
            <div class="failed" aria-live="polite">
                <p>{t('memories.failed_many', failed.length)}</p>
                <ul>
                    {#each failed as one (one.name)}
                        <li>{t('memories.failed', one.name, one.said)}</li>
                    {/each}
                </ul>
            </div>
        {/if}
        {#if images.length === 0}
            <Empty message={t('memories.empty')} glyph={t('memories.empty_glyph')} />
        {:else}
            <div class="wall">
                {#each images as name (name)}
                    <button
                        type="button"
                        class="tile"
                        data-tile={name}
                        title={t('memories.open', name)}
                        onclick={() => void enlarge(name)}
                    >
                        <img loading="lazy" src={source(name)} alt={t('memories.tile', name)} />
                    </button>
                {/each}
            </div>
        {/if}
        {#if open !== ''}
            <div
                bind:this={overlay}
                class="lightbox"
                role="dialog"
                aria-modal="true"
                aria-label={t('memories.lightbox', open)}
                tabindex="-1"
                onkeydown={keys}
            >
                <button
                    type="button"
                    class="backdrop"
                    aria-label={t('memories.close_outside')}
                    onclick={() => void close()}
                ></button>
                <figure class="shown">
                    <img src={source(open)} alt={t('memories.tile', open)} />
                </figure>
                <span class="shut">
                    <ToolButton
                        label={t('memories.close')}
                        glyph={t('memories.close_glyph')}
                        onclick={() => void close()}
                    />
                </span>
            </div>
        {/if}
    </div>
</Pane>

<style>
    .memories {
        position: relative;
        min-width: 0;
    }

    .failed {
        margin: 0 0 8px;
        color: var(--c-red-txt);
        font-size: var(--fs-sm);
    }

    .failed p {
        margin: 0;
    }

    .failed ul {
        margin: 2px 0 0;
        padding-left: 18px;
    }

    /* The wall is CSS columns rather than a grid: a picture keeps its own proportions, the column
       count falls with the pane, and nothing has to be measured for a tile to sit under another. */
    .wall {
        column-width: 220px;
        column-gap: 8px;
    }

    .tile {
        display: block;
        width: 100%;
        margin: 0 0 8px;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: none;
        overflow: hidden;
        cursor: pointer;
        break-inside: avoid;
    }

    .tile:hover {
        border-color: var(--accent);
    }

    .tile:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .tile img {
        display: block;
        width: 100%;
        height: auto;
    }

    .lightbox:focus-visible {
        outline: none;
    }

    .lightbox {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* The press outside the picture is a control of its own, so closing that way is a button press
       and not a click handler on a box: the keyboard reaches it and the screen reader names it. */
    .backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: var(--bg);
        opacity: 0.86;
        cursor: pointer;
    }

    .shown {
        position: relative;
        margin: 0;
        max-width: 92%;
        max-height: 92%;
    }

    .shown img {
        display: block;
        max-width: 100%;
        max-height: 92vh;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
    }

    .shut {
        position: absolute;
        top: 12px;
        right: 12px;
    }

    /* The terminal shape: a square frame round each picture, as every box takes there. */
    :global(body.rice) .tile,
    :global(body.rice) .shown img {
        border-radius: 0;
    }
</style>
