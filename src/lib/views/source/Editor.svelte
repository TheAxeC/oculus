<script lang="ts">
    // Layer 3, partial of views/Source.svelte. One textarea over its escaped highlight mirror,
    // sharing font, padding, whitespace, and scroll position so the coloured text stays aligned.

    import TextArea from '$lib/ui/TextArea.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import { highlight, languageFor } from '$lib/state/highlight';
    import { t } from '$lib/state/text';

    type Props = {
        path: string;
        text: string;
        editable: boolean;
        message?: string;
        oninput: (value: string) => void;
        onsave: () => void;
        onrevert: () => void;
    };

    let { path, text, editable, message = '', oninput, onsave, onrevert }: Props = $props();
    let mirror: HTMLPreElement | undefined = $state(undefined);

    const painted = $derived(highlight(text, languageFor(path)));

    function sync(event: Event): void {
        if (mirror === undefined || !(event.currentTarget instanceof HTMLTextAreaElement)) return;
        mirror.scrollTop = event.currentTarget.scrollTop;
        mirror.scrollLeft = event.currentTarget.scrollLeft;
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
        {#if message !== ''}
            <span class="message" aria-live="polite">{message}</span>
        {/if}
    </Toolbar>
    <div class="editor-wrap">
        <!-- Keep pre and code on one line: a line break inside pre would enter the mirror's text. -->
        <pre class="mirror" bind:this={mirror} aria-hidden="true"><code>{@html painted}</code></pre>
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

    .editor-wrap {
        position: relative;
        min-width: 0;
        min-height: 240px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
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
