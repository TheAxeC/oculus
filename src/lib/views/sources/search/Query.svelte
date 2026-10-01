<script lang="ts">
    // Layer 3, partial of views/sources/search/Search.svelte. What a search is asked for: the
    // pattern, which root it runs over, the folder under that root it is scoped to, and the three
    // options. The folder is a line of its own with a control that sends the search back to the
    // whole root.
    //
    // Nothing here runs a search on a keystroke. Typing writes the tab's own state and stops there;
    // Enter in the box and the Search control are the two ways a run starts, since a search reads
    // every file of a root and a run per keystroke would be one process per letter.

    import Search from '$lib/ui/controls/text/Search.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ALL_ROOTS } from '$lib/state/sources/search';
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
        /** Whether a run is in flight, which is what the control says while it waits. */
        running: boolean;
        onq: (value: string) => void;
        onroot: (value: string) => void;
        onclearscope: () => void;
        onword: () => void;
        oncase: () => void;
        onregex: () => void;
        onrun: () => void;
    };

    let {
        q,
        root,
        under,
        word,
        case: matchCase,
        regex,
        roots,
        running,
        onq,
        onroot,
        onclearscope,
        onword,
        oncase,
        onregex,
        onrun
    }: Props = $props();

    // The picker's empty choice is every root, which is what a search opens on: a search over
    // nothing is not a choice this view offers, so no value of it is the empty string.
    const picked = $derived(root === ALL_ROOTS ? '' : root);
    const choices = $derived(roots.map((key) => ({ id: key, label: key })));
</script>

<div class="query">
    <Toolbar label={t('search.toolbar')}>
        <Search value={q} placeholder={t('search.placeholder')} oninput={onq} onenter={onrun} />
        <Select
            value={picked}
            label={t('search.root')}
            empty={t('search.root_all')}
            {choices}
            onchange={(value: string) => onroot(value === '' ? ALL_ROOTS : value)}
        />
        <ToolButton
            label={t('search.word')}
            title={t('search.word_title')}
            pressed={word}
            onclick={onword}
        />
        <ToolButton
            label={t('search.case')}
            title={t('search.case_title')}
            pressed={matchCase}
            onclick={oncase}
        />
        <ToolButton
            label={t('search.regex')}
            title={t('search.regex_title')}
            pressed={regex}
            onclick={onregex}
        />
        <ToolButton
            label={t('search.run')}
            glyph={t('search.run_glyph')}
            title={t('search.run_title')}
            disabled={running}
            onclick={onrun}
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
</div>

<style>
    .scope {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
        color: var(--muted-txt, var(--muted));
    }
</style>
