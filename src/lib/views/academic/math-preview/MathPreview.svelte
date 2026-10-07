<script module lang="ts">
    // Layer 3, view registration. Math Preview is opened beside the LaTeX source tab by its Math
    // Preview action (Cmd+Alt+M), never from the view catalogue: it is about the tab it follows.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'math-preview',
        label: 'views.math_preview',
        glyph: 'views.math_preview_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. LaTeX Workshop's Math Preview: the formula the caret of the LaTeX source tab
    // being edited is inside, typeset by KaTeX. It follows the source tab the reader looked at last
    // (shared/latex/followed.svelte.ts), redraws as the caret moves or the text changes, and draws
    // the macros the document defines with `\newcommand`, `\renewcommand`, `\providecommand` and
    // `\DeclareMathOperator` (data/prose/latex.ts `macrosOf`), so a formula that uses them is drawn
    // as the document means it. A caret outside a formula says so, and a source tab not followed
    // says that. The span is found by the editor's own reader
    // (ui/controls/editor/kit/latex/latex.ts), the one that draws the formula in the editor, so the
    // two agree on what a formula is.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { mathSpanAt } from '$lib/ui/controls/editor/kit/latex/latex';
    import { macrosOf } from '$lib/state/sessions/latex/latex-state';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { createFollowed } from '../../shared/latex/followed.svelte';
    import { typeset } from '../../shared/latex/math';

    const client = useState();
    const {
        editorStatus,
        source: { sourceDraft }
    } = client;

    let { instance }: ViewProps = $props();

    const followed = createFollowed(client);
    const source = $derived(followed.source);

    const text = $derived(source === null ? '' : sourceDraft(source.id).text);
    const caret = $derived(
        source === null ? null : (editorStatus.statusOf(source.id)?.caret ?? null)
    );

    /** The offset of the caret in the text: its line and column are counted from one. */
    const offset = $derived.by(() => {
        if (caret === null) return -1;
        const lines = text.split('\n');
        let at = 0;
        for (let line = 0; line < Math.min(caret.line - 1, lines.length); line += 1) {
            at += lines[line].length + 1;
        }
        return at + Math.max(0, caret.column - 1);
    });

    const span = $derived(offset < 0 ? null : mathSpanAt(text, offset));
    const macros = $derived(macrosOf(text));

    let node: HTMLElement | undefined = $state();

    $effect(() => {
        if (node === undefined || span === null) return;
        void typeset(node, span.source, span.display, macros);
    });
</script>

<Pane title={t('math_preview.title')} tinted>
    <div class="preview" data-instance={instance.id}>
        {#if source === null}
            <Empty message={t('math_preview.no_source')} glyph={t('math_preview.glyph')} />
        {:else if span === null}
            <Empty message={t('math_preview.no_formula')} glyph={t('math_preview.glyph')} />
        {:else}
            <div class="formula" bind:this={node} data-math-preview></div>
        {/if}
    </div>
</Pane>

<style>
    .preview {
        min-width: 0;
        padding: 12px;
        overflow: auto;
    }

    .formula {
        font-size: 1.4em;
    }
</style>
