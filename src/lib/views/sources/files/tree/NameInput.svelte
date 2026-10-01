<script lang="ts">
    // Layer 3, partial of views/sources/files/tree/Tree.svelte. The input in the row where a name
    // is typed: a new file's or folder's, or a row's new name. It opens with the text it was given
    // selected as far as `select` says, and says what is wrong with the text as it is typed
    // (nameMessage in row-ops.ts), after the first key.
    //
    // Enter and leaving the input accept a valid name, and Escape cancels it. An empty name and an
    // unchanged name cancel. A name that is refused is kept by Enter, with its message under it,
    // and is cancelled by leaving the input. The row's request is the caller's, handed the accepted
    // text.

    import NameField from '$lib/ui/tree/NameField.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { nameMessage } from './row-ops';

    type Props = {
        /** The name the row has, and the empty string for a new item. */
        value: string;
        /** How many characters from the start open selected; all of them when omitted. */
        select?: number;
        /** Whether the folder already holds a name, as the folder compares names. */
        taken: (name: string) => boolean;
        onaccept: (name: string) => void;
        oncancel: () => void;
    };

    let { value, select, taken, onaccept, oncancel }: Props = $props();

    /** The text as it stands, and whether a key has been typed in the box. */
    let text = $derived(value);
    let typed = $state(false);

    /**
     * Whether the row has been answered, so the focus leaving a row that is going does not answer
     * it twice.
     */
    let settled = false;

    const message = $derived(typed ? nameMessage(text, taken, t) : null);

    function finish(now: string, enter: boolean): void {
        if (settled) return;
        if (now.trim() === '' || now === value) {
            settled = true;
            oncancel();
            return;
        }
        if (nameMessage(now, taken, t)?.error === true) {
            if (enter) {
                typed = true;
                return;
            }
            settled = true;
            oncancel();
            return;
        }
        settled = true;
        onaccept(now);
    }
</script>

<NameField
    {value}
    label={t('files.name_label')}
    {select}
    {message}
    oninput={(next: string) => {
        text = next;
        typed = true;
    }}
    onsubmit={(now: string) => finish(now, true)}
    onleave={(now: string) => finish(now, false)}
    oncancel={() => {
        settled = true;
        oncancel();
    }}
/>
