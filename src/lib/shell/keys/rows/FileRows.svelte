<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the file mode: the files whose
    // name or path the query matches, or with nothing typed the files open in tabs. Each row names
    // the file with the letters the query matched marked, its folder as the hint, and the key of
    // its root after it when more than one root holds files. A press opens the file in the view
    // that can show it, as a kept tab that takes the keyboard. Under the rows the list says what is
    // missing from it: that the names are being read or why they did not come (whatever is typed,
    // below the open files when nothing is), that the matcher has not answered yet, that no file
    // matches the query, that the list stops at the configured number of names, and which roots are
    // listed in part. Between keystrokes the rows of the matcher's last answer stay, and so does
    // its no-match sentence, until the newest query is answered.

    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { FileNames } from '$lib/shell/keys/lists/file-names.svelte';
    import { fileValue, type FileEntry, type FileMatch } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { paletteSource } = useState();

    type Props = {
        /** The rows to draw: the open files, or the matches of the query. */
        found: FileMatch[];
        /** Whether the query is empty, which lists the open files. */
        listingOpen: boolean;
        names: FileNames;
        onclose: () => void;
    };

    let { found, listingOpen, names, onclose }: Props = $props();

    const where = $derived(names.names());
    const list = $derived(where.phase === 'ready' ? where.summary : null);
    /** Whether the files are of more than one root, which the rows then name. */
    const several = $derived(
        listingOpen ? new Set(found.map((one) => one.entry.root)).size > 1 : (list?.roots ?? 0) > 1
    );

    /** Close the palette, then open the file; the tab takes the keyboard once it is drawn. */
    function open(entry: FileEntry): void {
        onclose();
        void paletteSource.openFile(entry.root, entry.path);
    }
</script>

{#each found as one (fileValue(one.entry))}
    <PaletteRow
        row={{
            value: fileValue(one.entry),
            kind: t('app.palette.kind_file'),
            label: one.entry.path,
            parts: one.name,
            file: one.entry.name,
            hintParts: one.folder,
            trail: several ? one.entry.root : undefined,
            pick: () => open(one.entry)
        }}
    />
{/each}
{#if listingOpen && found.length === 0}
    <p class="empty" data-palette-files-empty>{t('app.palette.files_open_none')}</p>
{/if}
{#if where.phase === 'refused'}
    <p class="empty" data-palette-files-refused>{where.error}</p>
{:else if where.phase === 'loading' || (!listingOpen && !names.started())}
    <p class="empty" data-palette-files-loading>{t('app.palette.files_loading')}</p>
{:else if !listingOpen && found.length === 0}
    <p class="empty" data-palette-files-empty>{t('app.palette.files_none')}</p>
{/if}
{#if list?.cut === true}
    <p class="empty" data-palette-files-cut>{t('app.palette.files_cut', list.count)}</p>
{/if}
{#if list !== null && list.partial.length > 0}
    <p class="empty" data-palette-files-partial>
        {t('app.palette.files_partial', list.partial.join(', '))}
    </p>
{/if}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
