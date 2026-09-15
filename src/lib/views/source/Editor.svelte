<script lang="ts">
    // Layer 3, partial of views/Source.svelte. One textarea over its escaped highlight mirror,
    // sharing font, padding, whitespace, and scroll position so the coloured text stays aligned.
    //
    // A Markdown file is written and read at once: the row under the toolbar splits into the editor
    // and the rendered half, with the handle between them, and the toolbar carries the control that
    // takes the rendered half away. A file of any other kind is the editor alone.

    import Preview from './Preview.svelte';
    import Sash from '$lib/ui/Sash.svelte';
    import TextArea from '$lib/ui/TextArea.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { SASH_PX } from '$lib/ui/sash-size';
    import { highlight, languageFor } from '$lib/state/highlight';
    import { t } from '$lib/state/text';

    type Props = {
        path: string;
        text: string;
        editable: boolean;
        message?: string;
        /** Whether the reader wants the rendered half, for a file that has one. */
        preview?: boolean;
        oninput: (value: string) => void;
        onsave: () => void;
        onrevert: () => void;
        /** Show or hide the rendered half. */
        onpreview: () => void;
    };

    let {
        path,
        text,
        editable,
        message = '',
        preview = true,
        oninput,
        onsave,
        onrevert,
        onpreview
    }: Props = $props();

    let mirror: HTMLPreElement | undefined = $state();
    let box: HTMLDivElement | undefined = $state();
    /** The share of the row the editor holds. The rendered half takes what is left. */
    let share = $state(0.5);
    /** How far the editor is scrolled through its text, which is what the rendered half follows. */
    let fraction = $state(0);

    const painted = $derived(highlight(text, languageFor(path)));
    const rendered = $derived(languageFor(path) === 'md');
    const split = $derived(rendered && preview);

    function sync(event: Event): void {
        if (!(event.currentTarget instanceof HTMLTextAreaElement)) return;
        const area = event.currentTarget;
        if (mirror !== undefined) {
            mirror.scrollTop = area.scrollTop;
            mirror.scrollLeft = area.scrollLeft;
        }
        const room = area.scrollHeight - area.clientHeight;
        fraction = room > 0 ? area.scrollTop / room : 0;
    }

    /** A drag is pixels; what the two halves are laid out by is a share, so the row's width sets it. */
    function moved(delta: number): void {
        const room = (box?.clientWidth ?? 0) - SASH_PX;
        if (room <= 0) return;
        share = Math.min(0.9, Math.max(0.1, share + delta / room));
    }

    function reset(): void {
        share = 0.5;
    }
</script>

<div class="source-editor" data-source-editor={path} data-editable={editable}>
    <Toolbar label={t('source.edit')}>
        {#if editable}
            <ToolButton label={t('editor.save')} glyph="check" onclick={onsave} />
        {/if}
        <ToolButton
            label={t('editor.revert')}
            glyph={t('editor.revert_glyph')}
            onclick={onrevert}
        />
        {#if rendered}
            <ToolButton
                label={t('source.preview')}
                glyph={t('source.preview_glyph')}
                pressed={preview}
                onclick={onpreview}
            />
        {/if}
        {#if message !== ''}
            <span class="message" aria-live="polite">{message}</span>
        {/if}
    </Toolbar>
    <div class="row" bind:this={box}>
        <div class="editor-wrap" style="flex: {split ? share : 1} 1 0">
            <!-- Keep pre and code on one line: a line break inside pre would enter the mirror's text. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- state/highlight.ts escapes the file text before it emits its own span classes -->
            <pre class="mirror" bind:this={mirror} aria-hidden="true"><code>{@html painted}</code
                ></pre>
            <div class="input">
                <TextArea
                    value={text}
                    label={path}
                    rows={24}
                    readOnly={!editable}
                    spellcheck={false}
                    {oninput}
                    onscroll={sync}
                />
            </div>
        </div>
        {#if split}
            <Sash dir="row" {share} onresize={moved} onreset={reset} />
            <div class="rendered" style="flex: {1 - share} 1 0">
                <Preview {path} {text} {fraction} />
            </div>
        {/if}
    </div>
</div>

<style>
    .source-editor {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        height: 100%;
        min-height: 0;
    }

    .message {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .row {
        display: flex;
        min-width: 0;
        min-height: 0;
    }

    .rendered {
        min-width: 0;
        min-height: 0;
    }

    .editor-wrap {
        position: relative;
        min-width: 0;
        min-height: 240px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
    }

    :global(body.wall) .editor-wrap {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .mirror,
    .input {
        position: absolute;
        inset: 0;
        box-sizing: border-box;
        margin: 0;
    }

    .mirror {
        overflow: hidden;
        padding: 8px;
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        white-space: pre;
        pointer-events: none;
    }

    .input :global(.area) {
        display: block;
        width: 100%;
        height: 100%;
        resize: none;
        overflow: auto;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: transparent;
        caret-color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        line-height: 1.45;
        padding: 8px;
        white-space: pre;
    }

    .mirror :global(.source-key),
    .mirror :global(.source-heading) {
        color: var(--c-blue-txt);
        font-weight: 700;
    }

    .mirror :global(.source-string) {
        color: var(--c-green-txt);
    }

    .mirror :global(.source-boolean),
    .mirror :global(.source-fence) {
        color: var(--c-violet-txt);
    }

    .mirror :global(.source-number),
    .mirror :global(.source-marker) {
        color: var(--c-amber-txt);
    }

    .mirror :global(.source-flow),
    .mirror :global(.source-link) {
        color: var(--c-cyan-txt);
    }

    .mirror :global(.source-code) {
        color: var(--c-orange-txt);
    }

    .mirror :global(.source-strong) {
        font-weight: 700;
    }

    .mirror :global(.source-punctuation),
    .mirror :global(.source-comment) {
        color: var(--muted-txt, var(--muted));
    }
</style>
