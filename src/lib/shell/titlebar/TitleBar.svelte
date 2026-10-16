<script lang="ts">
    // Layer 3, shell. The window's title bar strip, drawn as VS Code's title bar across the top of
    // the window, above the rail and the area, in the desktop app's windows only (a page in a
    // browser has the browser's own bar above it, and reaches Go Back, Go Forward, the dock toggles
    // and the palette through their keys and the palette, the editor actions in each pane): 35 px
    // high in the theme's title bar colours. From left to right: Go Back and Go Forward, which walk
    // the window's navigation history (history-walk.ts) and are drawn disabled at either end of it;
    // the Command Center in the middle, a box as wide as VS Code's, whose words are the open
    // workspace's name and whose press opens the palette empty, as VS Code's opens Quick Open; the
    // editor actions of the pane that leads the window, when the tab bar is not drawn and the
    // actions stand at their first place (strip-actions.svelte.ts); and at the right the three dock
    // toggles, each hiding or showing the float docked at its edge, drawn pressed while it shows
    // and disabled with none docked.
    //
    // The window of a popped-out float draws the same strip with that float's own title in the
    // middle and no toggles, since the docks are the main window's.
    //
    // In the desktop app the window has no title bar of the system's: the strip is the window's
    // drag region, its controls excepted, and it leaves room for the window buttons, at its left on
    // macOS, where they sit inside it, and at its right elsewhere, where the system draws them over
    // it; in full screen, where macOS hides them, it leaves none, the host saying when the window
    // enters and leaves full screen. A double press on the strip's empty part asks the host to do
    // what the system's title bar does, which on macOS is its own setting: zoom, minimise or
    // nothing. In a browser the strip moves nothing and a double press does nothing.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { onMac } from '$lib/ui/controls/editor/kit/load';
    import type { DockEdge } from '$lib/state/workbench/layout';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { useWalk } from './history-walk';
    import { useStripActions } from './strip-actions.svelte';
    import { buttonsRoom, centerWords } from './titlebar';

    type Props = {
        /** The title of a popped-out float's window; given, the strip draws no Command Center. */
        title?: string;
        /** Open the palette with a prefill, as Cmd+K opens it. */
        onpalette?: (prefill: string) => void;
    };

    let { title, onpalette = () => undefined }: Props = $props();

    const client = useState();
    const {
        layout: { floats, dockHidden, toggleDock },
        fs: { workspaces }
    } = client;
    const walk = useWalk();
    const actions = useStripActions();

    /** Whether the window is in full screen, as the desktop host says. */
    let full = $state(false);

    $effect(() => {
        const bridge = client.desktop?.bridge;
        if (bridge === undefined) return;
        void bridge.fullScreen().then((now) => (full = now));
        return bridge.on('full-screen', (now) => (full = now));
    });

    const room = $derived(buttonsRoom(client.desktop !== undefined, onMac(), full));

    const words = $derived.by(() => {
        const held = workspaces();
        return centerWords(held.open, held.loading, t('ui.titlebar_untitled'));
    });

    const handed = $derived(actions?.drawn() ?? null);

    /** Whether a float is docked at an edge, which is what its toggle hides and shows. */
    const docked = (edge: DockEdge): boolean =>
        floats().some((one) => one.place.kind === 'dock' && one.place.edge === edge);

    /** A second press on the strip's empty part: the host does what a title bar does. */
    function doubled(event: MouseEvent): void {
        const target = event.target;
        if (target instanceof Element && target.closest('button, input, [role="menu"]') !== null) {
            return;
        }
        client.desktop?.bridge.titleDoubleClick();
    }
</script>

{#snippet dock(edge: DockEdge, label: string, glyph: string)}
    <ToolButton
        {label}
        {glyph}
        bare
        pressed={docked(edge) && !dockHidden(edge)}
        disabled={!docked(edge)}
        title={docked(edge) ? label : t('ui.titlebar_dock_none', label)}
        data={{ 'titlebar-dock': edge }}
        onclick={() => toggleDock(edge)}
    />
{/snippet}

<!-- The double press is the pointer's alone: the keyboard reaches each control of the strip, and
     the window's zoom and minimise have the system's own keys. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
    class="titlebar"
    class:left={room === 'left'}
    class:right={room === 'right'}
    aria-label={t('ui.titlebar')}
    data-titlebar
    ondblclick={doubled}
>
    <div class="side start">
        <div class="controls">
            <ToolButton
                label={t('ui.titlebar_back')}
                glyph={t('ui.titlebar_back_glyph')}
                bare
                disabled={!walk.canBack()}
                data={{ 'titlebar-walk': 'back' }}
                onclick={() => void walk.back()}
            />
            <ToolButton
                label={t('ui.titlebar_forward')}
                glyph={t('ui.titlebar_forward_glyph')}
                bare
                disabled={!walk.canForward()}
                data={{ 'titlebar-walk': 'forward' }}
                onclick={() => void walk.forward()}
            />
        </div>
    </div>
    <div class="middle">
        {#if title === undefined}
            <div class="controls center">
                <ToolButton
                    label={words}
                    glyph="search"
                    small
                    wide
                    cut
                    title={t('ui.titlebar_center_title', words)}
                    data={{ 'titlebar-center': '' }}
                    onclick={() => onpalette('')}
                />
            </div>
        {:else}
            <span class="title" {title}>{title}</span>
        {/if}
    </div>
    <div class="side end">
        {#if handed !== null}
            <div
                class="controls"
                role="group"
                aria-label={t('ui.titlebar_actions')}
                data-titlebar-actions
            >
                {@render handed()}
            </div>
        {/if}
        {#if title === undefined}
            <div class="controls" role="group" aria-label={t('ui.titlebar_docks')}>
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render dock(
                    'left',
                    t('app.palette.cmd_toggle_left_dock'),
                    t('ui.titlebar_dock_left_glyph')
                )}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render dock(
                    'bottom',
                    t('app.palette.cmd_toggle_bottom_dock'),
                    t('ui.titlebar_dock_bottom_glyph')
                )}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render dock(
                    'right',
                    t('app.palette.cmd_toggle_right_dock'),
                    t('ui.titlebar_dock_right_glyph')
                )}
            </div>
        {/if}
    </div>
</header>

<style>
    /* VS Code's title bar: 35 px, the Command Center centred in the window whatever the two sides
       hold, the sides as wide as the room either side of it. Its colours are the title bar tokens
       of tokens.css, the window chrome's unless a theme sets its own, which a converted VS Code
       theme takes from its title bar keys (themes/vscode-map.ts). The whole strip drags the
       window in the app; its controls take presses. */
    .titlebar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        flex: none;
        height: var(--titlebar-height);
        padding: 0 var(--titlebar-pad);
        box-sizing: border-box;
        background: var(--titlebar-bg);
        color: var(--titlebar-txt, var(--ink-txt, var(--ink)));
        border-bottom: 1px solid var(--titlebar-line);
        -webkit-user-select: none;
        user-select: none;
        -webkit-app-region: drag;
    }

    /* The window buttons of macOS sit in the strip's left end. */
    .titlebar.left {
        padding-left: var(--titlebar-buttons);
    }

    /* Elsewhere the system draws them over the strip's right end, in the area the window controls
       overlay leaves to the page (`titlebar-area-*`). */
    .titlebar.right {
        padding-right: calc(
            100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw) +
                var(--titlebar-pad)
        );
    }

    .side {
        display: flex;
        align-items: center;
        gap: var(--titlebar-gap);
        min-width: 0;
    }

    .end {
        justify-content: flex-end;
    }

    /* The middle is as wide as VS Code's Command Center. */
    .middle {
        display: flex;
        justify-content: center;
        box-sizing: border-box;
        width: var(--titlebar-center-width);
        min-width: 0;
        padding: 0 var(--titlebar-gap);
    }

    /* The controls take presses: no part of a group drags the window. */
    .controls {
        display: flex;
        align-items: center;
        gap: var(--tab-action-gap);
        min-width: 0;
        -webkit-app-region: no-drag;
    }

    /* The Command Center takes the whole of the middle. */
    .center {
        flex: 1;
    }

    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
    }

    :global(body.wall) .titlebar {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
