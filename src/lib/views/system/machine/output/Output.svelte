<script module lang="ts">
    // Layer 3, view registration. A language server's output is opened from a source tab's Show
    // Language Server Output and is not listed.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'lsp-output',
        label: 'views.lsp_output',
        glyph: 'views.lsp_output_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. The log of one language server, the last 2000 lines it wrote to its standard
    // error, in a read-only window as plain text, as VS Code's Output channel of that server shows
    // it. The tab's state names the root and the language; it asks the relay for the log when it
    // opens and tells the relay to stop when it closes, and the relay sends the lines again after
    // a reconnect. The window follows the end of the log while the reader has not scrolled up.

    import { tick } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Code from '$lib/views/shared/prose/Code.svelte';
    import { instanceText } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { lsp } = useState();

    let { instance }: ViewProps = $props();

    const root = $derived(instanceText(instance.state, 'root'));
    const language = $derived(instanceText(instance.state, 'language'));
    const label = $derived(instanceText(instance.state, 'label'));
    const lines = $derived(lsp.output(root, language));
    const text = $derived(lines.join('\n'));

    let box: HTMLDivElement | undefined = $state();
    /** Whether the window is at its end, so the next lines scroll it on. */
    let following = true;

    /** The box that scrolls: the code window's text. */
    function scroller(): HTMLElement | null {
        return box?.querySelector<HTMLElement>('[data-tab-focus]') ?? null;
    }

    function scrolled(top: number): void {
        const one = scroller();
        if (one !== null) following = top + one.clientHeight >= one.scrollHeight - 4;
    }

    // The log is asked for while the tab is open.
    $effect(() => {
        if (root === '' || language === '') return;
        return lsp.watchOutput(root, language);
    });

    $effect(() => {
        if (lines.length === 0 || !following) return;
        void tick().then(() => {
            const one = scroller();
            if (one !== null) one.scrollTop = one.scrollHeight;
        });
    });
</script>

<Pane title={label === '' ? t('views.lsp_output') : label}>
    <div class="output" bind:this={box} data-lsp-output={root}>
        {#if lines.length === 0}
            <Empty message={t('output.empty')} glyph="lsp_output" />
        {:else}
            <Code {text} language="plaintext" path={label} onscrolled={scrolled} />
        {/if}
    </div>
</Pane>

<style>
    .output {
        height: 100%;
        min-height: 0;
    }
</style>
