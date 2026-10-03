<script lang="ts">
    // Layer 3, view partial. The source tab's controls, which the tab hands up to the pane's tab
    // strip to draw at its end: Save and Revert while the text may be written, the star, the
    // program button, and the toggles for the rendered half and for Blame. Source.svelte decides
    // which of them the tab offers and what each does; this draws them in the strip's Toolbar.
    //
    // The star is `shared/links/BookmarkStar.svelte`, which the file view draws too, so a reader
    // bookmarks the file in front of them whichever of the two tabs is showing it. The program
    // button, `shared/links/ProgramButton.svelte`, is drawn for a file whose extension
    // `open.program_ext` names an application for, such as a `.rtf` whose bytes are text. The
    // rendered half of a Markdown file is off until turned on.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import BookmarkStar from '../../shared/links/BookmarkStar.svelte';
    import ProgramButton from '../../shared/links/ProgramButton.svelte';

    type Props = {
        root: string;
        path: string;
        /** Whether the text may be written, which is when Save and Revert are drawn. */
        editing: boolean;
        /** Whether the file can be bookmarked: it is a served file and not one read at HEAD. */
        bookmarkable: boolean;
        /** Whether an application is configured for the file, so Open in Program is drawn. */
        program: boolean;
        /** Whether the editor has a rendered half to toggle, and whether it is shown. */
        previewable: boolean;
        rendered: boolean;
        /** Whether the file is in a repository, and whether Blame is on. */
        blameable: boolean;
        blamed: boolean;
        onsave: () => void;
        onrevert: () => void;
        onpreview: () => void;
        onblame: () => void;
        /** What a refused bookmark write or open said. */
        onsaid: (words: string) => void;
    };

    let {
        root,
        path,
        editing,
        bookmarkable,
        program,
        previewable,
        rendered,
        blameable,
        blamed,
        onsave,
        onrevert,
        onpreview,
        onblame,
        onsaid
    }: Props = $props();
</script>

<Toolbar label={t('source.toolbar')} overflow>
    {#if editing}
        <ToolButton bare label={t('editor.save')} glyph="check" onclick={onsave} />
        <ToolButton
            bare
            label={t('editor.revert')}
            glyph={t('editor.revert_glyph')}
            onclick={onrevert}
        />
    {/if}
    {#if bookmarkable}
        <BookmarkStar bare {root} {path} {onsaid} />
    {/if}
    {#if program}
        <ProgramButton bare {root} {path} {onsaid} />
    {/if}
    {#if previewable}
        <Chip
            label={t('source.preview')}
            title={t('source.preview_title')}
            glyph={t('source.preview_glyph')}
            pressed={rendered}
            onclick={onpreview}
        />
    {/if}
    {#if blameable}
        <Chip
            label={t('source.blame')}
            title={t('source.blame_title')}
            glyph="blame"
            pressed={blamed}
            onclick={onblame}
        />
    {/if}
</Toolbar>
