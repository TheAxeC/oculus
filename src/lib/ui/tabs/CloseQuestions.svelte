<script lang="ts">
    // Layer 3, primitive. The two questions closing a page asks, drawn once for every surface that
    // closes pages (the Pages view and the rail's Workbenches menu): the close that waits on its
    // dialog, which names what the page would take away, and the question a reset or a tab holding
    // unsaved text waits on, which carries its own answer. A yes to the first hands the page's id
    // to `onclose` and then `onclear`; a no calls `onclear`. Nothing is drawn while neither holds a
    // message.

    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';

    type Props = {
        /** The close waiting on its dialog: the words it asks and the page a yes closes. */
        closing: { message: string; id: string } | null;
        /** The question a reset or an unsaved tab waits on, answered through its own callback. */
        question: { message: string; detail?: string; answer: (yes: boolean) => void } | null;
        /** Close the page a yes was given for. */
        onclose: (id: string) => void;
        /** Drop the held close, after either answer. */
        onclear: () => void;
    };

    let { closing, question, onclose, onclear }: Props = $props();

    function confirmed(): void {
        const id = closing?.id;
        onclear();
        if (id !== undefined) onclose(id);
    }
</script>

<CloseQuestion message={closing?.message ?? null} onconfirm={confirmed} oncancel={onclear} />

<CloseQuestion
    message={question?.message ?? null}
    detail={question?.detail}
    onconfirm={() => question?.answer(true)}
    oncancel={() => question?.answer(false)}
/>
