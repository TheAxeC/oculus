<script module lang="ts">
    // Layer 3, view registration. The viewer is only ever opened for one customization file, so the
    // catalogue does not list it.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'customization',
        label: 'customize.view',
        glyph: 'customize.view_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. One file the Customizations section listed, read only: an account's CLAUDE.md,
    // a skill, a subagent, a settings file. The file server serves the folders of the workspace and
    // nothing outside them, and an account's folder is outside every one, so this view reads the
    // file through GET /api/customizations, which answers only a path its own listing gives for the
    // same agent, account and workspace. Nothing here writes.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { instanceText } from '$lib/state/workbench/layout';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        agents: { customizationText },
        layout: { instanceLayoutState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The file and the listing it came from, as the section opened the tab. */
    const opened = $derived.by(() => {
        const state = instanceLayoutState(instance.id);
        const word = (key: string): string => instanceText(state, key);
        return {
            agent: word('agent') === 'codex' ? ('codex' as const) : ('claude' as const),
            account: word('account'),
            workspace: word('workspace'),
            path: word('path')
        };
    });

    const read = $derived(
        opened.path === '' || opened.workspace === ''
            ? null
            : customizationText(
                  { agent: opened.agent, account: opened.account, workspace: opened.workspace },
                  opened.path
              )
    );
</script>

<Pane title={t('customize.view')} tinted>
    <div class="viewer" data-customization={opened.path}>
        {#if read === null}
            <Empty message={t('customize.view_none')} glyph={t('customize.view_glyph')} />
        {:else if read.error !== ''}
            <Empty error message={read.error} />
        {:else if read.pending || read.value === null}
            <p class="line">{t('customize.loading')}</p>
        {:else}
            <p class="path" title={read.value.path}>{read.value.path}</p>
            <pre class="text">{read.value.text}</pre>
        {/if}
    </div>
</Pane>

<style>
    .viewer {
        display: flex;
        flex-direction: column;
        gap: 6px;
        height: 100%;
        min-height: 0;
    }

    .path,
    .line {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .text {
        flex: 1 1 auto;
        min-height: 0;
        margin: 0;
        overflow: auto;
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }
</style>
