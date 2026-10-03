<script lang="ts">
    // Layer 3, partial of views/sources/search/Search.svelte. What a search is asked for: the
    // pattern, which root it runs over, the folder under that root it is scoped to, and the three
    // options. The folder is a line of its own with a control that sends the search back to the
    // whole root.
    //
    // Nothing here runs a search on a keystroke. Typing writes the tab's own state and stops there;
    // Enter in the box and the pane's Search action are the two ways a run starts, since a search
    // reads every file of a root and a run per keystroke would be one process per letter.
    //
    // It is drawn in the pane's bar: the Toggle Replace control that shows the replace row
    // (search/ReplaceRow.svelte), the query box, the root picker, and the three options as
    // pressable chips.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ALL_ROOTS } from '$lib/state/sources/search/search';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        q: string;
        /** A served root's key, or ALL_ROOTS. */
        root: string;
        /**
         * The folder under the root the search is scoped to, the empty string for the whole root.
         */
        under: string;
        word: boolean;
        case: boolean;
        regex: boolean;
        /** The keys of every root this page serves, in the order the file browser lists them. */
        roots: string[];
        onq: (value: string) => void;
        onroot: (value: string) => void;
        onclearscope: () => void;
        onword: () => void;
        oncase: () => void;
        onregex: () => void;
        onrun: () => void;
        /** Whether the replace row is shown. */
        replacing: boolean;
        ontogglereplace: () => void;
        /** The query box's input element, for the cursor to be put in it. */
        input?: HTMLInputElement | null;
        /** A key the query box leaves to the view: history, and Replace All. */
        onkey: (event: KeyboardEvent) => boolean;
    };

    let {
        q,
        root,
        under,
        word,
        case: matchCase,
        regex,
        roots,
        onq,
        onroot,
        onclearscope,
        onword,
        oncase,
        onregex,
        onrun,
        replacing,
        ontogglereplace,
        input = $bindable(null),
        onkey
    }: Props = $props();

    // The picker's empty choice is every root, which is what a search opens on: a search over
    // nothing is not a choice this view offers, so no value of it is the empty string.
    const picked = $derived(root === ALL_ROOTS ? '' : root);
    const choices = $derived(roots.map((key) => ({ id: key, label: key })));
</script>

<Toolbar label={t('search.toolbar')}>
    <ToolButton
        label={t('search.replace_toggle')}
        glyph={replacing ? t('search.toggle_glyph_open') : t('search.toggle_glyph_closed')}
        title={t('search.replace_toggle_title')}
        compact
        expanded={replacing}
        onclick={ontogglereplace}
    />
    <Search
        fill
        value={q}
        placeholder={t('search.placeholder')}
        oninput={onq}
        onenter={onrun}
        {onkey}
        bind:input
    />
    <Select
        value={picked}
        label={t('search.root')}
        empty={t('search.root_all')}
        {choices}
        onchange={(value: string) => onroot(value === '' ? ALL_ROOTS : value)}
    />
    <Chip label={t('search.word')} title={t('search.word_title')} pressed={word} onclick={onword} />
    <Chip
        label={t('search.case')}
        title={t('search.case_title')}
        pressed={matchCase}
        onclick={oncase}
    />
    <Chip
        label={t('search.regex')}
        title={t('search.regex_title')}
        pressed={regex}
        onclick={onregex}
    />
</Toolbar>
{#if under !== ''}
    <p class="scope">
        <span>{t('search.in_folder', root, under)}</span>
        <ToolButton
            label={t('search.clear_scope')}
            glyph={t('search.clear_scope_glyph')}
            compact
            onclick={onclearscope}
        />
    </p>
{/if}

<style>
    /* The folder line takes the bar's whole width, so it sits under the query row. */
    .scope {
        display: flex;
        flex-basis: 100%;
        align-items: center;
        gap: 6px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
