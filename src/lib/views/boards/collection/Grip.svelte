<script lang="ts">
    // Layer 3, view partial of views/boards/collection/EntryCard.svelte. The handle a card is
    // dragged by. While `blocked` holds the words saying why the file cannot be written, the handle
    // is drawn disabled with them as its title and a press arms nothing.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = { blocked: string; onpress: () => void };

    let { blocked, onpress }: Props = $props();
</script>

<span
    class="grip"
    class:off={blocked !== ''}
    title={blocked === '' ? t('collection.reorder_hint') : blocked}
    onmousedown={() => {
        if (blocked === '') onpress();
    }}
    role="presentation"
>
    <Glyph name={t('collection.grip_glyph')} />
</span>

<style>
    .grip {
        color: var(--muted-txt, var(--muted));
    }

    .grip:not(.off) {
        cursor: grab;
    }

    .grip.off {
        opacity: 0.5;
    }
</style>
