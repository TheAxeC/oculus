<script lang="ts">
    // Layer 3, shell. The status bar items the apps add, for one side of the bar: left items are
    // drawn after the LaTeX build item and right items before the live sessions, each side by
    // priority and then by the app. An item is VS Code's: its text with `$(name)` glyphs, a
    // tooltip, the command a press runs and, for the warning and error tones, a fill behind it. The
    // reader hides an item from the bar's right-click menu as the bar's own items are hidden. On
    // the left the progress the apps run in the window comes first, a spinner and its words.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        side: 'left' | 'right';
        /** The keys of the items the reader hid. */
        hidden: string[];
    };

    let { side, hidden }: Props = $props();

    const { appShell } = useState();

    const items = $derived(appShell.statusItems(side).filter((one) => !hidden.includes(one.key)));
    const progress = $derived(side === 'left' ? appShell.requests.windowProgress() : []);
</script>

{#each progress as running (running.id)}
    <span data-status="app-progress">
        <ToolButton
            label={running.title}
            title={running.cancellable ? t('statusbar.app_progress_cancel', running.title) : ''}
            status
            inert={!running.cancellable}
            onclick={() => appShell.requests.cancel(running.id)}
        >
            <Glyph name="sync" turning />
            {running.title}
        </ToolButton>
    </span>
{/each}
{#each items as { key, app, item } (key)}
    <span data-status="app" data-app-item={key}>
        <ToolButton
            label={item.accessibility === '' ? item.name || item.id : item.accessibility}
            title={item.tooltip}
            status
            fill={item.background === '' ? undefined : item.background}
            inert={item.command === ''}
            onclick={() => void appShell.run(app, item.command, [])}
        >
            {#each appShell.textParts(item.text) as part, at (at)}
                {#if 'glyph' in part}
                    <Glyph name={part.glyph} turning={part.turning} />
                {:else}
                    {part.text}
                {/if}
            {/each}
        </ToolButton>
    </span>
{/each}
