<script lang="ts">
    // Layer 3, view partial of Source.svelte. A file the tab holds but may not write, drawn as the
    // line saying why over the read-only code window, rather than as an editor that would take
    // typing and refuse every save: a file this machine's mode locks, a file too long to have been
    // read whole, and a version at HEAD or in the index. The window carries the tab's own gutter,
    // and the tab is told every scroll so the gutter's lines follow. The line and the window are
    // two rows of the tab's grid (Source.svelte).

    import type { Snippet } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';
    import Code from '../../../shared/prose/Code.svelte';

    type Props = {
        /** Why the file may not be written. */
        locked: string;
        text: string;
        language: string;
        path: string;
        /** The tab's gutter, drawn in place of the plain line numbers. */
        gutter: Snippet;
        onscrolled: (top: number) => void;
    };

    let { locked, text, language, path, gutter, onscrolled }: Props = $props();
</script>

<p class="locked" data-source-locked={path}>
    <Glyph name={t('source.locked_glyph')} />
    {locked}
</p>
<Code {text} {language} {path} {gutter} {onscrolled} />

<style>
    .locked {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
