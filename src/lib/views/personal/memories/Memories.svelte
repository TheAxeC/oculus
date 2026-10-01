<script module lang="ts">
    // Layer 3, view registration. The photo wall follows Help in the Help page's group, and is
    // drawn in the Help page's right pane with two of the hub's documents.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'memories',
        label: 'views.memories',
        glyph: 'views.memories_glyph',
        group: 'help',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. The photo wall: every picture of the configured folder as a tile, one of them
    // enlarged over the pane, and the control that adds another.
    //
    // The pictures are referenced by URL and never inlined: the folder is megabytes, the document
    // is not, and a browser caches a URL. The columns are CSS, a column count that falls with the
    // pane's width, and every tile is a box of its picture's own proportions, taken from the width
    // and height the folder's answer carries with each name, so the box has its final shape before
    // the picture arrives and nothing on the wall moves when it does. A picture far wider or taller
    // than a square stops at `TILE_BOUND` of state/life/memories.svelte.ts and is fitted
    // whole inside, and a picture whose header the server could not read keeps a 4:3 box it is
    // fitted into whole; no picture is cropped. Until it arrives the tile is a muted surface of
    // that same box, and a picture that fails draws its alternative words in the box instead, until
    // the folder answers again and the picture is asked for anew.
    //
    // The enlarged picture is this view's own overlay rather than a primitive, since it is the one
    // place in oculus where a picture is shown over the pane and `ui/` would gain a component with
    // one reader. It is a modal on bits-ui's Dialog, drawn in place in the pane: Tab stays inside
    // it while it shows and while its tab shows. It closes on its own Escape, on a press outside
    // the picture and on its own control, and the tile that opened it takes the keyboard back, so
    // the wall is where the reader left it.

    import { Dialog } from 'bits-ui';
    import { tick, untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import FileChooser from '$lib/ui/forms/file/FileChooser.svelte';
    import { encoded } from '$lib/ui/forms/file/file-data';
    import { t } from '$lib/state/shared/words/text';
    import { readMessage, tooLarge, uploadMessage } from '$lib/state/life/memories';
    import { tileRatio } from '$lib/state/life/memories.svelte';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { watchShown } from '$lib/ui/shown';

    const {
        memories: { wall, reload },
        writes: { addMemory }
    } = useState();

    let { instance }: ViewProps = $props();

    const held = $derived(wall());
    const images = $derived(held.images);

    /** What became of each tile's picture by name: absent while it loads. */
    let arrived: Record<string, 'loaded' | 'failed'> = $state({});

    /**
     * The answer of the folder at which each picture that failed is asked for again, by name. A new
     * answer drops what the wall knew of every picture that failed, so a picture rewritten under
     * its name is asked for again rather than left as its words, and asked for at an address of its
     * own: the browser keeps a picture's answer for an hour, and would draw the failed one from it.
     */
    let retried: Partial<Record<string, number>> = $state({});

    /** How many answers of the folder the wall has drawn. */
    let answers = 0;

    $effect(() => {
        if (held.loading) return;
        answers += 1;
        const known = untrack(() => arrived);
        const failed = Object.keys(known).filter((name) => known[name] === 'failed');
        if (failed.length === 0) return;
        arrived = Object.fromEntries(Object.entries(known).filter(([, one]) => one !== 'failed'));
        retried = {
            ...untrack(() => retried),
            ...Object.fromEntries(failed.map((name) => [name, answers]))
        };
    });

    /** The picture the overlay shows, and the empty string when it shows none. */
    let open = $state('');

    /** Every file of the last add that was not written, with the sentence saying why. */
    let failed: { name: string; said: string }[] = $state([]);

    /** True while an add is in flight, so a second press sends no second write. */
    let busy = $state(false);

    /** The file chooser the add control opens, which is the only way a file is chosen. */
    let chooser: { open: () => void } | null = $state(null);

    /**
     * The address one picture is served at, with the answer it is asked for again at after it
     * failed.
     */
    function source(name: string): string {
        const base = `/api/memories?file=${encodeURIComponent(name)}`;
        const again = retried[name];
        return again === undefined ? base : `${base}&again=${again}`;
    }

    /**
     * The overlay's own box, which takes the keyboard so Escape reaches it wherever it is pressed.
     */
    let overlay: HTMLDivElement | undefined = $state();

    /**
     * Whether the overlay's tab shows, so its focus trap holds nothing of the page while hidden.
     */
    let overlayShown = $state(true);

    $effect(() =>
        overlay === undefined ? undefined : watchShown(overlay, (shown) => (overlayShown = shown))
    );

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

    /**
     * Add every file the reader chose, then ask the folder again. Each file that was not written is
     * kept with its own sentence, so five chosen files that fail for three reasons say all three. A
     * file larger than the wall takes is refused here, before it is read: the request that carried
     * it would be refused by the server's own parser, and the reader would meet that and not a
     * sentence.
     */
    async function add(chosen: File[]): Promise<void> {
        if (busy) return;
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
            onclick={() => chooser?.open()}
        />
    </Toolbar>
{/snippet}

<Pane title={t('memories.title')} toolbar={tools} tinted>
    <div class="memories" bind:this={box} data-instance={instance.id} data-memories>
        <FileChooser
            bind:this={chooser}
            accept="image/jpeg,image/png"
            multiple
            onchoose={(files: File[]) => void add(files)}
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
        {#if held.error !== ''}
            <p class="failed" aria-live="polite">{readMessage(held.error)}</p>
        {:else if images.length === 0}
            <Empty message={t('memories.empty')} glyph={t('memories.empty_glyph')} />
        {:else}
            <div class="wall">
                {#each images as picture (picture.name)}
                    {@const name = picture.name}
                    <div
                        class="tile"
                        class:loaded={arrived[name] === 'loaded'}
                        style:aspect-ratio={tileRatio(picture)}
                        data-picture={name}
                        data-arrived={arrived[name] ?? 'loading'}
                    >
                        <ToolButton
                            cell
                            label={t('memories.open', name)}
                            title={t('memories.open', name)}
                            data={{ tile: name }}
                            onclick={() => void enlarge(name)}
                        >
                            {#if arrived[name] === 'failed'}
                                <span class="alt">{t('memories.tile', name)}</span>
                            {:else}
                                <img
                                    loading="lazy"
                                    src={source(name)}
                                    alt={t('memories.tile', name)}
                                    onload={() => (arrived[name] = 'loaded')}
                                    onerror={() => (arrived[name] = 'failed')}
                                />
                            {/if}
                        </ToolButton>
                    </div>
                {/each}
            </div>
        {/if}
        {#if open !== ''}
            <Dialog.Root open={overlayShown}>
                <Dialog.Content
                    forceMount
                    preventScroll={false}
                    onEscapeKeydown={(event: KeyboardEvent) => event.preventDefault()}
                    onInteractOutside={(event: PointerEvent) => event.preventDefault()}
                    onOpenAutoFocus={(event: Event) => event.preventDefault()}
                    onCloseAutoFocus={(event: Event) => event.preventDefault()}
                >
                    {#snippet child({ props })}
                        <div
                            {...props}
                            bind:this={overlay}
                            class="lightbox"
                            aria-label={t('memories.lightbox', open)}
                            tabindex="-1"
                            onkeydown={keys}
                        >
                            <span class="backdrop">
                                <ToolButton
                                    cell
                                    label={t('memories.close_outside')}
                                    onclick={() => void close()}
                                />
                            </span>
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
                    {/snippet}
                </Dialog.Content>
            </Dialog.Root>
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

    /* The wall is CSS columns: the column count falls with the pane, and every tile's box has its
       shape from the answer before its picture loads, so nothing has to be measured for a tile to
       sit under another. */
    .wall {
        column-width: 220px;
        column-gap: 8px;
    }

    /* The tile's box is its shape and the whole picture is fitted inside it, so the placeholder a
       loading picture shows is the box the picture is drawn in. The 4:3 here is the box of a
       picture with no size; a sized one sets its own ratio on the element. The ratio is the content
       box's, the border drawn outside it, so a picture of that ratio fills the box to the pixel;
       the border's width is one property, read by the border and by the width that leaves room for
       it. The box is a flex box, which stretches the pressable cell inside it to its whole area. */
    .tile {
        --tile-border: 1px;
        position: relative;
        display: flex;
        box-sizing: content-box;
        width: calc(100% - 2 * var(--tile-border));
        aspect-ratio: 4 / 3;
        margin: 0 0 8px;
        padding: 0;
        border: var(--tile-border) solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        overflow: hidden;
        break-inside: avoid;
    }

    /* Over a wallpaper the pane's own tint is the placeholder's surface, so the tile adds none and
       the view stays one translucent layer; its border still marks the picture's box. */
    :global(body.wall) .tile {
        background: transparent;
    }

    .tile:hover {
        border-color: var(--accent);
    }

    .tile img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0;
        transition: opacity 160ms ease-out;
    }

    .tile.loaded img {
        opacity: 1;
    }

    .alt {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        overflow-wrap: anywhere;
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
       and not a click handler on a box: the keyboard reaches it and the screen reader names it. The
       box is a flex box, which stretches the pressable cell inside it over the whole pane. */
    .backdrop {
        position: absolute;
        inset: 0;
        display: flex;
        background: var(--bg);
        opacity: 0.86;
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
