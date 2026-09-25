<script module lang="ts">
    // Layer 3, view registration. Findings follows Status in the system group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'findings',
        label: 'views.findings',
        glyph: 'views.findings_glyph',
        group: 'system',
        order: 1
    };
</script>

<script lang="ts">
    // Layer 3, view. Everything the build found wrong, in one list: the snapshot's findings, which
    // come from validate over the hub's YAML, and the config channel's own, which come from reading
    // config/. A finding is reported and never repaired, so this view is where a bad manifest edit
    // shows up within a second of being saved.

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

<div class="view" data-instance={instance.id}>
    {#if found.length === 0}
        <p class="none">{t('views.findings_none')}</p>
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

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    .none {
        color: var(--muted-txt, var(--muted));
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    li {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 4px 0;
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
