<script lang="ts">
    // Layer 3, primitive. The two questions closing a page asks, drawn once for every surface that
    // closes or resets pages (the Pages view, the rail's Workbenches menu, the rail's reset and the
    // reset of every page): the close that waits on its dialog, which names what the page would
    // take away, and the question a reset or a tab holding unsaved text waits on, which carries its
    // own answer. A surface that only resets passes the question alone. A yes to the close hands
    // the page's id to `onclose` and then `onclear`; a no calls `onclear`. A close over unsaved
    // text asks whether to save it, and its Save runs the held close's own save after `onclear`; a
    // question over unsaved text answers `save` to its Save. Nothing is drawn while neither holds a
    // message.

    import CloseQuestion from '$lib/ui/controls/confirm/CloseQuestion.svelte';

    /**
     * A close waiting on its dialog: the words it asks, the page a yes closes, its unsaved tabs,
     * and its Save, which saves them and closes what the saves let go.
     */
    type HeldClose = { message: string; id: string; dirty: string[]; save: () => Promise<void> };

    /**
     * A question a reset or an unsaved tab waits on: its words, whether it is over unsaved text
     * (`saves`, which draws a Save), and the callback its answer goes to.
     */
    type Question = {
        message: string;
        detail: string;
        saves: boolean;
        answer: (given: 'yes' | 'no' | 'save') => void;
    };

    type Props = {
        /** The close waiting on its dialog: the words it asks and the page a yes closes. */
        closing?: HeldClose | null;
        /** The question a reset or an unsaved tab waits on, answered through its own callback. */
        question: Question | null;
        /** Close the page a yes was given for. */
        onclose?: (id: string) => void;
        /** Drop the held close, after either answer. */
        onclear?: () => void;
    };

    let { closing = null, question, onclose, onclear }: Props = $props();

    function confirmed(): void {
        const id = closing?.id;
        onclear?.();
        if (id !== undefined) onclose?.(id);
    }

    /** The question's Save, answered while it is still asked. */
    function savedAnswer(): void {
        question?.answer('save');
    }

    function saved(): void {
        const held = closing;
        onclear?.();
        if (held !== null) void held.save();
    }
</script>

<CloseQuestion
    message={closing?.message ?? null}
    onconfirm={confirmed}
    oncancel={() => onclear?.()}
    onsave={closing !== null && closing.dirty.length > 0 ? saved : undefined}
/>

<CloseQuestion
    message={question?.message ?? null}
    detail={question?.detail}
    onconfirm={() => question?.answer('yes')}
    oncancel={() => question?.answer('no')}
    onsave={question?.saves === true ? savedAnswer : undefined}
/>
