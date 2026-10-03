<script module lang="ts">
    // Layer 3, view registration. Findings follows Status in the System page's group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'findings',
        label: 'views.findings',
        glyph: 'views.findings_glyph',
        group: 'views',
        order: 5
    };
</script>

<script lang="ts">
    // Layer 3, view. Everything the build found wrong, in one list: the snapshot's findings, which
    // come from validate over the hub's YAML, and the config channel's own, which come from reading
    // config/. A finding is reported and never repaired, so this view is where a bad manifest edit
    // shows up within a second of being saved. The list is drawn straight into the pane, so the
    // pane asks for the tint; a clear list is said with the Empty primitive.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { allFindings } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config, portfolio }
    } = useState();

    let { instance }: ViewProps = $props();

    const found = $derived(allFindings(portfolio(), config()));
</script>

<Pane title={t('views.findings')} tinted>
    <div class="view" data-instance={instance.id}>
        {#if found.length === 0}
            <Empty message={t('views.findings_none')} glyph={t('views.findings_none_glyph')} />
        {:else}
            <ul>
                {#each found as finding, index (`${finding.file}:${finding.key}:${index}`)}
                    <li>
                        <span class="file">{finding.file}</span>
                        <span class="key">{finding.key}</span>
                        <span class="message">{finding.message}</span>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</Pane>

<style>
    .view {
        min-width: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    /* One line of the tree's row height, growing by whole lines when the words wrap. */
    li {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        border-bottom: 1px solid var(--line);
    }

    .file,
    .key {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    /* No fallback to `--c-amber`: a hue's own value on the panel is a pair
       tests/checks/look/contrast.test.ts never measured, so the colour rule refuses it. Until
       applyTheme has set the derived tokens the declaration computes to the inherited ink, which is
       what the rest of the view is painted in. */
    .message {
        color: var(--c-amber-txt);
    }
</style>
