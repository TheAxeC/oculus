<script lang="ts">
    // Layer 3, partial of views/sources/search/Search.svelte. The replace row under the query row:
    // the replace box, the Preserve Case toggle and Replace All, shown while Toggle Replace is on.
    //
    // Nothing here writes a file. Typing writes the tab's own state, which the results read to draw
    // the text each hit would be replaced with. Enter runs the search, as Enter in the query box
    // does, and Replace All asks the question first (Search.svelte). Replace All waits while a
    // replace is in flight, so a second press while one is out sends nothing.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        replace: string;
        preserve: boolean;
        /** Whether a replace is in flight or there is nothing listed to replace. */
        disabled: boolean;
        /** The replace box's input element, for the cursor to be put in it. */
        input?: HTMLInputElement | null;
        onreplace: (value: string) => void;
        onpreserve: () => void;
        onall: () => void;
        onrun: () => void;
        /** A key the replace box leaves to the view: history, and Replace All. */
        onkey: (event: KeyboardEvent) => boolean;
    };

    let {
        replace,
        preserve,
        disabled,
        input = $bindable(null),
        onreplace,
        onpreserve,
        onall,
        onrun,
        onkey
    }: Props = $props();
</script>

<div class="replace" data-search-replace>
    <Toolbar label={t('search.replacing_aria')}>
        <span class="box">
            <TextInput
                value={replace}
                label={t('search.replace_box')}
                placeholder={t('search.replace_box')}
                oninput={onreplace}
                onenter={onrun}
                {onkey}
                bind:input
            />
        </span>
        <Chip
            label={t('search.preserve')}
            title={t('search.preserve_title')}
            pressed={preserve}
            onclick={onpreserve}
        />
        <ToolButton
            label={t('search.replace_all')}
            glyph={t('search.replace_all_glyph')}
            title={t('search.replace_all_title')}
            compact
            {disabled}
            onclick={onall}
        />
    </Toolbar>
</div>

<style>
    /* The row takes the bar's whole width, so it sits under the query row. */
    .replace {
        flex-basis: 100%;
        min-width: 0;
    }

    .box {
        display: flex;
        flex: 1 1 12em;
        max-width: 32em;
        min-width: 0;
    }
</style>
