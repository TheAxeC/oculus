// Layer 3, primitive. A bits-ui part built on first use around a wrapper drawn before it: whether
// the part is built, the attributes and handlers its trigger hands in through TriggerProps.svelte,
// and the hand-over of the event that builds it to the trigger's own handler for that event, so the
// event is answered as it is on a part built at mount. ui/menu/Tooltip.svelte and
// ui/menu/ContextMenu.svelte build theirs this way.

import { flushSync } from 'svelte';

/** One wrapper's lazily built bits-ui part. */
export type LazyTrigger = {
    /** Whether the part is built; once built it stays built. */
    readonly built: boolean;
    /** The trigger's attributes and handlers as TriggerProps last handed them, null until then. */
    readonly given: Record<string, unknown> | null;
    /** TriggerProps' `take`: keep each version of the trigger's attributes and handlers. */
    readonly take: (props: Record<string, unknown>) => void;
    /** Build the part now, so what follows is answered by it. */
    readonly build: () => void;
    /**
     * An event the trigger answers, arriving before the part is built: the part is built and the
     * event handed to the trigger's handler `name` as `wrapperOf` gives it. An event something
     * inside the wrapper already answered is left alone, as the trigger's own handlers leave it.
     */
    readonly hand: (name: string, event: Event, element: EventTarget | null) => void;
};

/**
 * The lazy part of one wrapper. `wrapperOf` turns the trigger's attributes and handlers into the
 * ones the wrapper carries, and is read at each hand-over, so it may read the component's props.
 */
export function lazyTrigger(
    wrapperOf: (given: Record<string, unknown>) => Record<string, unknown>
): LazyTrigger {
    let built = $state(false);
    let given: Record<string, unknown> | null = $state.raw(null);

    const build = (): void => {
        if (built) return;
        built = true;
        // The part draws its trigger now, so TriggerProps has handed `given` in before the
        // event that built it is handed over.
        flushSync();
    };

    return {
        get built() {
            return built;
        },
        get given() {
            return given;
        },
        take: (props) => {
            given = props;
        },
        build,
        hand: (name, event, element) => {
            if (event.defaultPrevented) return;
            build();
            const handler = given === null ? undefined : wrapperOf(given)[name];
            if (typeof handler === 'function') handler.call(element, event);
        }
    };
}
