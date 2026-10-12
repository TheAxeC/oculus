<script module lang="ts">
    // Layer 3, view registration. The Debug view is a tab of the Explorer pane, after the TeX view,
    // and a pause of the program opens it there.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';

    export const registration: ViewRegistration = {
        id: 'debug',
        label: 'views.debug',
        glyph: 'views.debug_glyph',
        group: 'explorer',
        order: 6
    };
</script>

<script lang="ts">
    // Layer 3, view. The debugger of rite: the configuration picker with Start, Add Configuration
    // and Open launch.yml, the findings of the repository's launch file, a line saying what the
    // session is doing, and the sections Variables, Watch, Call Stack and Breakpoints. The
    // repository is the one of the source tab on screen, else of the one focused last; its
    // configurations are those of `.oculus/launch.yml`, and a repository with none runs the open
    // `.rite` file. Start stays drawn while a session runs and answers with the refusal then. The
    // stepping controls are the floating toolbar's (shell/commands/debug/DebugToolbar.svelte),
    // drawn over the workbench while a session runs.
    //
    // A section's open state is the tab's own and is saved in its instance state; every section
    // starts open.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import { instanceMap } from '$lib/state/workbench/layout/instance';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import Breakpoints from './sections/Breakpoints.svelte';
    import CallStack from './sections/CallStack.svelte';
    import Variables from './sections/Variables.svelte';
    import Watch from './sections/Watch.svelte';

    const { debug, layout } = useState();

    let { instance }: ViewProps = $props();

    /** The sections the reader closed, kept with the tab. */
    const closed = $derived(instanceMap(instance.state).closed);
    const isClosed = (name: string): boolean => Array.isArray(closed) && closed.includes(name);
    function toggle(name: string): void {
        const now = Array.isArray(closed)
            ? closed.filter((one): one is string => typeof one === 'string')
            : [];
        const next = now.includes(name) ? now.filter((one) => one !== name) : [...now, name];
        layout.restateInstance(instance.id, { ...instanceMap(instance.state), closed: next });
    }

    const repo = $derived(debug.repo());
    const listed = $derived(repo === null ? null : debug.launches(repo));
    const chosen = $derived(repo === null ? null : debug.chosen(repo, listed));
    const choices = $derived(
        (listed?.configurations ?? []).map((one) => ({ id: one.name, label: one.name }))
    );

    /** Read the repository's launch file for as long as the view is drawn. */
    $effect(() => {
        const path = repo;
        if (path === null) return undefined;
        return debug.watch(path);
    });

    const running = $derived(debug.ran());
</script>

<Pane title={t('views.debug')} tinted>
    <div class="debug" data-instance={instance.id} data-repo={repo ?? ''}>
        {#if repo === null}
            <Empty message={t('debug.no_file')} glyph={t('views.debug_glyph')} />
        {:else}
            <div class="head">
                {#if choices.length > 0}
                    <Select
                        value={chosen?.name ?? ''}
                        label={t('debug.configuration')}
                        {choices}
                        onchange={(name: string) => debug.choose(repo, name)}
                    />
                {:else}
                    <span class="default">{t('debug.default_name')}</span>
                {/if}
                <ToolButton
                    primary
                    label={t('debug.start')}
                    glyph="debug_start"
                    onclick={() => void debug.start()}
                />
            </div>
            <div class="head">
                <ToolButton
                    plain
                    label={t('debug.add_configuration')}
                    glyph="add"
                    onclick={() => void debug.addConfiguration(repo)}
                />
                {#if listed?.exists === true}
                    <ToolButton
                        plain
                        label={t('debug.open_launch')}
                        glyph="open_file"
                        onclick={() => debug.openLaunch(repo, chosen?.line ?? 1)}
                    />
                {/if}
            </div>
            {#if listed !== null && listed.findings.length > 0}
                <ul class="findings">
                    {#each listed.findings as finding, at (at)}
                        <li>
                            <TreeItem
                                label={finding.message}
                                tone="warn"
                                title={`${finding.file} ${finding.field}`}
                            >
                                {#snippet detail()}{finding.field}{/snippet}
                            </TreeItem>
                        </li>
                    {/each}
                </ul>
            {/if}
        {/if}
        {#if running}
            <p class="state" data-debug-state>{debug.stateWords()}</p>
        {/if}
        <Variables open={!isClosed('variables')} ontoggle={() => toggle('variables')} />
        <Watch open={!isClosed('watch')} ontoggle={() => toggle('watch')} />
        <CallStack open={!isClosed('stack')} ontoggle={() => toggle('stack')} />
        <Breakpoints open={!isClosed('breakpoints')} ontoggle={() => toggle('breakpoints')} />
    </div>
</Pane>

<style>
    .debug {
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .head {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 4px 8px;
        min-width: 0;
    }

    .default {
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .findings {
        list-style: none;
        margin: 0;
        padding: 0 8px;
    }

    .state {
        margin: 0;
        padding: 4px 8px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
