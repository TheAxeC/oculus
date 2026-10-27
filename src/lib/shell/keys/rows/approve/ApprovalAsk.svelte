<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The confirm the palette's approval rows ask
    // before they approve a repository's code to run: a message, the path or files it is about, a
    // confirm and a cancel in the words of the caller. ChoiceRows.svelte asks it for an interpreter
    // and for the Svelte and Vite configuration, LintConfigRows.svelte for the ESLint
    // configuration.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        message: string;
        /** The path or the files the approval is about, one a line. */
        detail: string;
        /** The confirm's words. */
        yes: string;
        onyes: () => void;
        onno: () => void;
    };

    let { message, detail, yes, onyes, onno }: Props = $props();
</script>

<Confirm
    level="sheet"
    {message}
    {detail}
    confirm={yes}
    cancel={t('ui.confirm_cancel')}
    onconfirm={onyes}
    oncancel={onno}
/>
