<script module lang="ts">
    // Layer 3, view registration. Help sits in the System group, after Live usage.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'help',
        label: 'views.help',
        glyph: 'views.help_glyph',
        group: 'system',
        order: 5
    };
</script>

<script lang="ts">
    // Layer 3, view. Oculus's own manual: tools/oculus/HELP.md, drawn as prose.
    //
    // The manual is a file beside DESIGN.md rather than text in the catalog, because it is pages of
    // prose about the whole tool and a catalog is words a surface draws. It is read through api/docs,
    // the one route that turns Markdown into HTML, which serves that one path of the engine directory
    // and nothing else around it.

    import Pane from '$lib/ui/Pane.svelte';
    import Markdown from './shared/Markdown.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        docs: { manual }
    } = useState();

    let { instance }: ViewProps = $props();

    const shown = $derived(manual());
</script>

<Pane title={t('views.help')}>
    <div class="view" data-instance={instance.id}>
        <Markdown doc={shown} loading={t('help.loading')} failed={t('help.failed', shown.error)} />
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
