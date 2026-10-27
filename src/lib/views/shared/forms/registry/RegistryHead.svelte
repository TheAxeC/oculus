<script lang="ts">
    // Layer 3, view partial under views/shared/. The head a registry-line view draws above its
    // cards: the line the last write or open said, and the Add box. The control that adds an entry
    // is the view's header icon (AddButton.svelte), which opens the Add box this draws.
    //
    // The Pillars, Domains, Data and Venues views draw it the same way, so it lives here once. What
    // was last said belongs to the view's registry file (registry-file.svelte.ts), which a card of
    // the view also writes. Over a wallpaper the said line is read off a `Surface`.

    import Surface from '$lib/ui/frame/Surface.svelte';
    import AddAsk from '../entry/AddAsk.svelte';
    import type { RegistryFile } from './registry-file.svelte';

    type Props = {
        /** The view's registry file: the line the last write or open said, and the Add box. */
        file: RegistryFile;
    };

    let { file }: Props = $props();
</script>

{#if file.said !== ''}
    <Surface>
        <p class="said">{file.said}</p>
    </Surface>
{/if}
{#if file.asking !== null}
    <AddAsk ask={file.asking} onclose={file.closeAsk} />
{/if}

<style>
    .said {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
