<script lang="ts">
    // Layer 3, view partial of Source.svelte. A file the tab holds but may not write, drawn as the
    // line saying why. A file too long to have been read whole and a version at HEAD or in the
    // index are drawn by the line over the read-only code window, which carries the tab's own
    // gutter, and the tab is told every scroll so the gutter's lines follow. A file this machine's
    // mode locks is drawn by the line alone, over the tab's editor in its read-only form
    // (SourceBody.svelte draws the editor), so the editor is never replaced when the mode changes.
    // The line and the window are two rows of the tab's grid (SourceBody.svelte). Over a
    // wallpaper the line is read off a `Surface`, and the code window is its own surface at the
    // editor's share.

    import type { Snippet } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import { t } from '$lib/state/shared/words/text';
    import Code from '../../../shared/prose/Code.svelte';
    import type { Locked } from './locked-words';

    type Props = {
        /** Why the file may not be written, and whether the code window draws the text under it. */
        lock: Locked;
        text: string;
        language: string;
        path: string;
        /** The tab's gutter, drawn in place of the plain line numbers. */
        gutter: Snippet;
        onscrolled: (top: number) => void;
    };

    let { lock, text, language, path, gutter, onscrolled }: Props = $props();
</script>

<Surface>
    <p class="locked" data-source-locked={path}>
        <Glyph name={t('source.locked_glyph')} />
        {lock.words}
    </p>
</Surface>
{#if lock.window}
    <div class="window">
        <Code {text} {language} {path} {gutter} {onscrolled} />
    </div>
{/if}

<style>
    /* Over a wallpaper the code window keeps the editor's share of its colour, `--wall-editor`
       (the option `editor.opacity`), as the tab's editor does. The wrapper draws no box. */
    .window {
        display: contents;
        --chip-on-wall: color-mix(in srgb, var(--chip) var(--wall-editor), transparent);
    }

    .locked {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        padding: 4px 12px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
