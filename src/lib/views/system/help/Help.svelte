<script module lang="ts">
    // Layer 3, view registration. Help opens the Help page's group, and is drawn in the Help
    // page's left pane beside the HPC how-to.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'help',
        label: 'views.help',
        glyph: 'views.help_glyph',
        group: 'help',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. Oculus's own manual: tools/oculus/HELP.md, drawn as prose.
    //
    // The manual is a file beside DESIGN.md rather than text in the catalog, because it is pages of
    // prose about the whole tool and a catalog is words a surface draws. It is read through
    // api/docs, the one route that turns Markdown into HTML, which serves that one path of the
    // engine directory and nothing else around it.
    //
    // The manual shows the diagrams bin/diagrams/diagrams.mjs draws from the source. Each is an
    // image of docs/diagrams/ in HELP.md, which manual.ts cuts out of the HTML so Diagram.svelte
    // can draw it in the page's text colour; the prose between them is drawn by the Markdown
    // partial, one run at a time. The prose is drawn straight into the box, so over a wallpaper the
    // box asks for the tint and is the one surface the manual is read off.

    import Pane from '$lib/ui/frame/Pane.svelte';
    import Markdown from '../../shared/prose/Markdown.svelte';
    import Diagram from './Diagram.svelte';
    import { splitManual, type ManualPart } from './manual';
    import type { DocState } from '$lib/state/system/docs.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        docs: { manual }
    } = useState();

    let { instance }: ViewProps = $props();

    const shown = $derived(manual());

    const parts = $derived(splitManual(shown.html));

    /** One run of prose as the document the Markdown partial draws, the manual's state kept. */
    function prose(part: ManualPart): DocState {
        return { ...shown, html: part.kind === 'html' ? part.html : '' };
    }
</script>

<Pane title={t('views.help')} tinted>
    <div class="view" data-instance={instance.id}>
        {#if shown.loading || shown.error !== ''}
            <Markdown
                doc={shown}
                loading={t('help.loading')}
                failed={t('help.failed', shown.error)}
                surface={false}
            />
        {:else}
            {#each parts as part, at (at)}
                {#if part.kind === 'diagram'}
                    <Diagram name={part.name} alt={part.alt} />
                {:else}
                    <Markdown
                        doc={prose(part)}
                        loading={t('help.loading')}
                        failed={t('help.failed', shown.error)}
                        surface={false}
                    />
                {/if}
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
    }

    :global(body.rice) .view {
        font-family: var(--font-mono);
    }
</style>
