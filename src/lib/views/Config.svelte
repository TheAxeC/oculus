<script module lang="ts">
    // Layer 3, view registration. Config closes the System group.
    import type { ViewRegistration } from './registry';

    export const registration: ViewRegistration = {
        id: 'config',
        label: 'views.config',
        glyph: 'views.config_glyph',
        group: 'system',
        order: 6
    };
</script>

<script lang="ts">
    // Layer 3, view. The files of the engine's config folder, one card each: the name, how many
    // lines it holds, the one line saying what is in it, the raw text under a disclosure, and the
    // control that opens it in a source tab.
    //
    // The folder is read through the file browser's own endpoint under the `engine` root, which
    // serves the engine's config folder and nothing above it, so listing a folder, reading a file and
    // saving an edit are the three things this view does and each is a route that already exists. An
    // edit saved from the source tab lands in that folder, which the config watcher is watching, and
    // the push it sends moves the config channel's version; the effect below hands that version to
    // the file browser's store, which asks again for this root's listing and texts and for nothing
    // under any other root, so a saved edit shows here without a reload.
    //
    // The machine-local file, local.yml, is a file of that folder like the tracked ones, so it is
    // listed, read and saved the same way; it is drawn last and carries a tag saying it is this
    // machine's own, since its keys are read by loadLocal and never merged into the configuration.

    import Card from '$lib/ui/Card.svelte';
    import Disclosure from '$lib/ui/Disclosure.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Tag from '$lib/ui/Tag.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { configFiles, descriptionKey, isLocalFile, lineCount } from './config/files';
    import { ENGINE_ROOT } from '$lib/state/fs';
    import { sourceTabState } from '$lib/state/source.svelte';
    import { lookup, t } from '$lib/state/text';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        entities: { message },
        fs: { entries, fileText, refresh },
        layout: { openView },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The version of the config channel, which the watcher moves after a write under the folder. */
    const pushed = $derived(message('config')?.version ?? 0);

    // The version is drawn on the box as well as handed to the store, so what the cards were last
    // read at is a fact on the page rather than something only the store knows.
    $effect(() => {
        refresh(ENGINE_ROOT, pushed);
    });

    /** The folder's own YAML, the machine's own file last. Nothing under `text/` is a card. */
    const names = $derived(configFiles(entries(ENGINE_ROOT, '')));

    /** Which previews the tab was left showing, so a tab switch does not close them. */
    const open = $derived(readOpen(instanceState(instance.id)));

    function readOpen(state: unknown): string[] {
        if (typeof state !== 'object' || state === null || Array.isArray(state)) return [];
        const held = (state as Record<string, unknown>).open;
        if (!Array.isArray(held)) return [];
        return held.filter((one): one is string => typeof one === 'string');
    }

    function toggle(name: string): void {
        const next = open.includes(name) ? open.filter((one) => one !== name) : [...open, name];
        setInstanceState(instance.id, { open: next });
    }

    /** Open one file in a source tab, which is where it is read whole and saved. */
    function edit(name: string): void {
        openView('source', sourceTabState(ENGINE_ROOT, name));
    }
</script>

<Pane title={t('views.config')}>
    <div class="view" data-instance={instance.id} data-config={pushed}>
        <p class="intro">{t('config.intro')}</p>
        {#if names.length === 0}
            <Empty message={t('config.none')} glyph={t('config.none_glyph')} />
        {:else}
            {#each names as name (name)}
                {@const held = fileText(ENGINE_ROOT, name)}
                <!-- The count is of the text the window holds: a file cut at the limit says so on
                     the line under the control, and what is drawn is its first part. -->
                {@const lines = lineCount(held.text)}
                <Card id={name} cursor={false} title={name} level={3}>
                    {#snippet meta()}
                        {#if isLocalFile(name)}
                            <Tag label={t('config.local_tag')} />
                        {/if}
                        <ToolButton
                            label={t('config.edit')}
                            glyph="edit"
                            title={t('config.edit_tip', name)}
                            onclick={() => edit(name)}
                        />
                    {/snippet}
                    <p class="desc">{lookup(descriptionKey(name))}</p>
                    {#if held.error !== ''}
                        <p class="desc">{t('config.failed', held.error)}</p>
                    {:else if held.loading}
                        <p class="desc">{t('config.loading')}</p>
                    {:else}
                        <Disclosure
                            count={lines}
                            label={t('config.lines')}
                            expanded={open.includes(name)}
                            onclick={() => toggle(name)}
                        />
                        {#if held.truncated}
                            <p class="desc" data-cut={name}>{t('file.truncated')}</p>
                        {/if}
                        {#if open.includes(name)}
                            <pre class="raw" data-file={name}>{held.text}</pre>
                        {/if}
                    {/if}
                </Card>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .view {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
    }

    .intro,
    .desc {
        margin: 0 0 6px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .raw {
        max-height: 24rem;
        overflow: auto;
        margin: 6px 0 0;
        padding: 8px;
        background: var(--chip);
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        color: var(--ink-txt, var(--ink));
    }

    :global(body.wall) .raw {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
