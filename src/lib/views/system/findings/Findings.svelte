<script module lang="ts">
    // Layer 3, view registration. Findings follows Status in the System page's group. Its badge is
    // how many findings it lists, its count; its row of `counts` says where it is drawn.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    import { countText } from '$lib/state/workbench/rail-badges/rail-badges';
    export const registration: ViewRegistration = {
        id: 'findings',
        label: 'views.findings',
        glyph: 'views.findings_glyph',
        group: 'views',
        order: 5,
        unique: true,
        badge: (client) => countText(client.railBadges.findingsCount()),
        countPart: (client) => ({ count: client.railBadges.findingsCount() })
    };
</script>

<script lang="ts">
    // Layer 3, view. Everything the build found wrong, in one list: the snapshot's findings, which
    // come from validate over the hub's YAML, the config channel's own, which come from reading
    // config/, the apps channel's, and the page's own, a project board the page left out of the
    // registry (the registry's `refused`). A finding is reported and never repaired, so this view
    // is where a bad manifest edit shows up within a second of being saved. The list is drawn
    // straight into the pane, so the pane asks for the tint; a clear list is said with the Empty
    // primitive. A row names its file relative to the folder of the root that holds it (its hub's,
    // or a repository's), as VS Code's Problems view names a file relative to the workspace, on one
    // line cut with an ellipsis at its end, the whole path in its tooltip; a file no root holds is
    // named by its whole path. A finding of a data file with no primary key whose cause a chosen
    // field mends offers that choice under its row (KeyChoice.svelte), once for each file.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import KeyChoice from './KeyChoice.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { allFindings } from '$lib/state/workbench/navigation/status';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import { fileUnder } from '$lib/state/shared/page/hubs';
    import { keyChoicesOf } from '$lib/state/boards/collection/key-choice';

    const {
        apps: { findings: appFindings },
        entities: { config, portfolio },
        fs: { primary, roots },
        registry
    } = useState();

    let { instance }: ViewProps = $props();

    const found = $derived(
        allFindings(
            portfolio(),
            config(),
            { findings: appFindings() },
            { findings: registry.refused() }
        )
    );

    /** The choice of a primary key each finding that offers one carries, by its place. */
    const keyed = $derived(
        keyChoicesOf(found, Object.values(portfolio()?.entities.collections ?? {}))
    );

    /** A finding's file under the root that holds it, with its line when it names one. */
    function named(file: string, line: number | undefined): string {
        const path = fileUnder(file, roots(), primary())?.path ?? file;
        return line === undefined ? path : `${path}:${String(line)}`;
    }
</script>

<Pane title={t('views.findings')} tinted>
    <div class="view" data-instance={instance.id}>
        {#if found.length === 0}
            <Empty message={t('views.findings_none')} glyph={t('views.findings_none_glyph')} />
        {:else}
            <ul>
                {#each found as finding, index (`${finding.file}:${finding.key}:${index}`)}
                    {@const choice = keyed.get(index)}
                    <li>
                        <span class="file" title={finding.file}
                            >{named(finding.file, finding.line)}</span
                        >
                        <span class="key">{finding.key}</span>
                        <span class="message">{finding.message}</span>
                        {#if choice !== undefined}
                            <KeyChoice {choice} />
                        {/if}
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
    }

    /* The file on one line, cut with an ellipsis where the row is narrower than it. */
    .file {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .key {
        word-break: break-all;
    }

    /* No fallback to `--c-amber`: a hue's own value on the panel is a pair
       tests/checks/look/contrast.test.ts never measured, so the colour rule refuses it. The token
       is derived for every theme, and the page's first HTML carries it for the theme the page
       starts on (hooks.server.ts), so the message is drawn in the theme's readable amber from the
       first paint. */
    /* A message holding a long path breaks inside it rather than running past a narrow pane. */
    .message {
        min-width: 0;
        color: var(--c-amber-txt);
        overflow-wrap: anywhere;
    }
</style>
