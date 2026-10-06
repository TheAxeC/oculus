<script lang="ts">
    // Layer 3, shell. The floats over every page. A docked float is a strip along the window's
    // left, right or bottom edge, placed in the grid the workbench body lays out (float-geometry's
    // bodyTracks), with a sash on its inner edge that sets its size. A free float is drawn at its
    // fractions of the window, so it scales with the window and never leaves it, above the panes
    // and below the drag layer, the palette and every menu; a press on it brings it in front of the
    // other free floats. Each float is a PaneView of its one pane, with the float's id as its page,
    // so the tab strip, the menus, the keyboard and the drops reach it as they reach the pane of a
    // page.
    //
    // A float placed in a window of the desktop app is left out: that window's page draws it.
    //
    // One keyed block draws every float and its place is a class and a style, so docking or
    // freeing a float changes the class and mounts no PaneView again. This is mounted once, outside
    // the block the workbench keys by the page, so a switch of page never mounts a float's views
    // again, and it is drawn whether or not a pane of the page is maximised. The tree of a page is
    // not touched by anything here.
    //
    // A free float moves by a drag of the empty part of its tab strip and resizes by its edges and
    // corners (float-gesture.ts, on interactjs, attached while the float is free). While a gesture
    // runs the float follows the pointer from a draft held here; the store is written once, when
    // the gesture ends. A float let go with its pointer within SNAP_PX of the area's left, right or
    // bottom edge docks there.

    import Sash from '$lib/ui/frame/Sash.svelte';
    import { START_DOCK, type DockEdge } from '$lib/state/workbench/layout';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import PaneView from '../PaneView.svelte';
    import { gesture } from './float-gesture';
    import {
        depthOf,
        dockedSize,
        floatStyle,
        raised,
        snapEdge,
        stackOf,
        type DrawnFloat,
        type FreePlace
    } from './float-geometry';

    const {
        layout: { dockFloat, floats, placeFloat }
    } = useState();

    type Props = {
        /**
         * The area of the workbench, whose left, right and bottom edges a released float docks on.
         */
        area?: HTMLElement;
        /** Open the palette with a prefill, as a pane's strip menu opens it. */
        onpalette?: (prefill: string) => void;
    };

    let { area, onpalette = () => undefined }: Props = $props();

    /** The floats this layer draws: every one not placed in a window of the app. */
    const drawn = $derived(
        floats().filter((one): one is DrawnFloat => one.place.kind !== 'window')
    );

    const free = $derived(drawn.filter((one) => one.place.kind === 'free').map((one) => one.id));

    /** The place a running gesture has reached, for the one float it is on. */
    let draft: { id: string; place: FreePlace } | null = $state(null);

    /** The order the floats were pressed in, the last at the end; read through stackOf. */
    let order: string[] = $state([]);

    const stack = $derived(stackOf(order, free));

    function style(float: DrawnFloat): string {
        const place = draft?.id === float.id ? draft.place : float.place;
        if (place.kind === 'dock') return floatStyle(place);
        return `${floatStyle(place)}; z-index: ${depthOf(stack, float.id)}`;
    }

    function raise(id: string): void {
        order = raised(order, free, id);
    }

    /** A gesture on a free float: what it reads and where it reports. */
    function gestureOf(float: DrawnFloat, place: FreePlace) {
        return {
            place: () => place,
            raise: () => raise(float.id),
            follow: (reached: FreePlace | null) => {
                draft = reached === null ? null : { id: float.id, place: reached };
            },
            done: (reached: FreePlace, point: { x: number; y: number } | null) => {
                const rect = area?.getBoundingClientRect();
                const edge =
                    point === null || rect === undefined
                        ? null
                        : snapEdge(point, {
                              left: rect.left,
                              right: rect.right,
                              bottom: rect.bottom
                          });
                if (edge === null) placeFloat(float.id, reached);
                else dockFloat(float.id, edge);
            }
        };
    }

    /** The window's extent a dock's size is a fraction of: its height for the bottom edge. */
    function extent(edge: DockEdge): number {
        return edge === 'bottom' ? window.innerHeight : window.innerWidth;
    }

    function sized(float: DrawnFloat, delta: number): void {
        const place = float.place;
        if (place.kind !== 'dock') return;
        const size = dockedSize(place.edge, place.size, delta, extent(place.edge));
        placeFloat(float.id, { kind: 'dock', edge: place.edge, size });
    }

    function reset(float: DrawnFloat): void {
        const place = float.place;
        if (place.kind === 'dock') {
            placeFloat(float.id, { kind: 'dock', edge: place.edge, size: START_DOCK });
        }
    }
</script>

{#each drawn as float (float.id)}
    {@const place = float.place}
    <!-- The press only brings a free float in front of the others; the float is no control. -->
    <div
        class={place.kind === 'dock' ? `float dock ${place.edge}` : 'float free'}
        role="group"
        aria-label={t('ui.float_label')}
        data-float={float.id}
        data-float-place={place.kind === 'dock' ? place.edge : 'free'}
        style={style(float)}
        onpointerdowncapture={() => raise(float.id)}
        {@attach place.kind === 'free' ? gesture(gestureOf(float, place)) : null}
    >
        {#if place.kind === 'dock'}
            <Sash
                dir={place.edge === 'bottom' ? 'col' : 'row'}
                share={place.size}
                onresize={(delta: number) => sized(float, delta)}
                onreset={() => reset(float)}
            />
        {/if}
        <div class="fill">
            <PaneView node={float.pane} path={[]} page={float.id} {onpalette} />
        </div>
    </div>
{/each}

<style>
    .float {
        display: flex;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        overflow: hidden;
    }

    .dock {
        background: var(--panel);
    }

    /* A docked float takes the track the body's grid gives it: the left and right ones beside the
       area, the bottom one under it and across, as workbench's .body places them. */
    .dock.left {
        grid-column: 2;
        grid-row: 1;
        flex-direction: row-reverse;
    }

    .dock.right {
        grid-column: 4;
        grid-row: 1;
        flex-direction: row;
    }

    .dock.bottom {
        grid-column: 2 / -1;
        grid-row: 2;
        flex-direction: column;
    }

    /* The pane fills what the sash leaves. The sash sits on the inner edge of the strip: before the
       pane for the right and bottom docks, after it for the left one, which the reversed row of the
       left dock gives. */
    .fill {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
    }

    .free {
        position: fixed;
        background: var(--panel);
        border-radius: var(--radius);
        overflow: hidden;
    }

    /* Over a wallpaper a docked float is a panel as a pane is, and a free float, which covers the
       page it floats over, takes the popover's firmer share so the page does not read through its
       text. The pane inside draws nothing over a wallpaper, so these are the floats' fill. */
    :global(body.wall) .dock {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
    }

    :global(body.wall) .free {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
    }

    /* A move starts on the strip, which a touch screen would otherwise scroll. */
    .free :global([data-tab-strip]) {
        touch-action: none;
    }
</style>
