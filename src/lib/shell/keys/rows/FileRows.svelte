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
    // its no-match sentence, until the newest query is answered; before the matcher has answered a
    // query the open files stay, so the first key changes the rows drawn in place, as every later
    // key does.
    //
    // The list draws a page of the rows and holds the height of the rest under it, so the scroll
    // bar is the whole list's (lists/file-window.svelte.ts says how many). The next page is drawn
    // when the held height comes into the list's view, and before the Command moves the selection:
    // ArrowDown near the last row drawn draws the next page, and End, or ArrowUp on the first row,
    // which the Command's loop takes to the last, draws every row. A row is kept by its place in
    // the list, so a new answer changes the rows drawn in place rather than drawing them again.
    //
    // The Command moves its selection to the first row whenever a row is drawn with a value it has
    // not seen, two ticks after the row is drawn, and its scroll into view leaves the first row out
    // when the list has no group heading. So a page drawn under the selection puts the selection
    // back on the row it was on once the Command has moved it (`keep`), and a new answer puts the
    // selection on the answer's first row and brings that row into view, so a list scrolled down
    // before the answer shows the row the keyboard is on.

    import { flushSync, tick, untrack } from 'svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import type { FileNames } from '$lib/shell/keys/lists/file-names.svelte';
    import { FILE_OVERSCAN, createFileWindow } from '$lib/shell/keys/lists/file-window.svelte';
    import { fileValue, type FileEntry, type FileMatch } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { paletteSource, float } = useState();

    type Props = {
        /** The rows to draw: the open files, or the matches of the query. */
        found: FileMatch[];
        /** Whether the query is empty, which lists the open files. */
        listingOpen: boolean;
        names: FileNames;
        onclose: () => void;
        /** Put the Command's selection on the row of this value. */
        onselect: (value: string) => void;
    };

    let { found, listingOpen, names, onclose, onselect }: Props = $props();

    const where = $derived(names.names());
    const list = $derived(where.phase === 'ready' ? where.summary : null);
    /** Whether the files are of more than one root, which the rows then name. */
    const several = $derived(
        listingOpen ? new Set(found.map((one) => one.entry.root)).size > 1 : (list?.roots ?? 0) > 1
    );

    /** Close the palette, then open the file; the tab takes the keyboard once it is drawn. */
    function open(entry: FileEntry): void {
        onclose();
        void paletteSource.openFile(entry.root, entry.path, float ?? undefined);
    }

    const view = createFileWindow(() => found);
    const drawn = $derived(found.slice(0, view.shown()));
    /** The height held under the rows drawn for the rows that are not, which also sizes a page. */
    let rest: HTMLDivElement | undefined = $state();
    /** A row's height at the current text scale, read off a probe drawn at it. */
    let probe: HTMLSpanElement | undefined = $state();
    /** A row's height and the list's gap between rows, in px; 0 until they are read. */
    let row = $state(0);
    let gap = $state(0);
    /** The height held for the rows not drawn: their rows and the gaps between them. */
    const held = $derived(Math.max(0, (found.length - drawn.length) * (row + gap) - gap));

    /** The list's scroll box, which the rows and the held height are in. */
    const boxOf = (node: HTMLElement): HTMLElement | null =>
        node.closest<HTMLElement>('[data-command-viewport]');

    /**
     * Read a row's height and the gap, and count the page from them and the room between the list's
     * top and the window's foot, which is the most of the list that can be in view.
     */
    function measure(): void {
        if (rest === undefined || probe === undefined) return;
        const box = boxOf(rest);
        gap = box === null ? 0 : Number.parseFloat(getComputedStyle(box).rowGap) || 0;
        row = probe.getBoundingClientRect().height;
        const top = box === null ? 0 : Math.max(0, box.getBoundingClientRect().top);
        view.measure(row + gap, window.innerHeight - top);
    }

    /**
     * Draw the rows a key is about to move the selection to, before the Command reads its items:
     * this runs as the key goes down to the input, and the Command answers it on the way back up.
     */
    function keyed(event: KeyboardEvent): void {
        if (view.shown() >= found.length || !(event.currentTarget instanceof HTMLElement)) return;
        const items = [...event.currentTarget.querySelectorAll('[data-command-item]')];
        const at = items.findIndex((item) => item.hasAttribute('data-selected'));
        if (event.key === 'End' || (event.key === 'ArrowUp' && at === 0)) view.all();
        else if (event.key === 'ArrowDown' && at >= items.length - FILE_OVERSCAN) view.more();
        else return;
        flushSync();
        keep(event.currentTarget);
    }

    /**
     * Put the selection back on the row it is on once the Command has moved it to the first row for
     * the rows just drawn. The Command's own key move has run by the first tick, and its move to
     * the first row by the second, as the rows drawn asked for both before this was called.
     */
    function keep(root: Element): void {
        const asked = answer;
        void tick().then(() => {
            const selected = root.querySelector('[data-command-item][data-selected]');
            const kept = selected?.getAttribute('data-value') ?? null;
            return tick().then(() => {
                if (kept !== null && answer === asked) onselect(kept);
            });
        });
    }

    $effect(() => {
        const root = rest?.closest<HTMLElement>('[data-command-root]');
        if (root === undefined || root === null) return;
        untrack(measure);
        // The probe follows the text scale, and the page the window's height.
        const scaled = new ResizeObserver(measure);
        if (probe !== undefined) scaled.observe(probe);
        root.addEventListener('keydown', keyed, true);
        window.addEventListener('resize', measure);
        return () => {
            scaled.disconnect();
            root.removeEventListener('keydown', keyed, true);
            window.removeEventListener('resize', measure);
        };
    });

    /** The values of the answer's rows, which change only with an answer that lists other rows. */
    const answer = $derived(found.map((one) => fileValue(one.entry)).join('\n'));

    $effect(() => {
        if (answer === '') return;
        const first = untrack(() => found.at(0));
        if (first !== undefined) untrack(() => onselect(fileValue(first.entry)));
        const box = rest === undefined ? null : boxOf(rest);
        box?.querySelector('[data-command-item]')?.scrollIntoView({ block: 'nearest' });
    });

    // The held height coming into view draws the next page. The watch starts again whenever the
    // rows drawn change, so a held height still in view after a page is drawn draws another.
    $effect(() => {
        view.shown();
        const node = rest;
        const box = node === undefined ? null : boxOf(node);
        if (node === undefined || box === null) return;
        const seen = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                view.more();
                flushSync();
                keep(box);
            },
            { root: box }
        );
        seen.observe(node);
        return () => seen.disconnect();
    });
</script>

{#each drawn as one, at (at)}
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
<div
    class="rest"
    class:none={held === 0}
    aria-hidden="true"
    data-palette-files-rest
    style:height="{held}px"
    bind:this={rest}
>
    <span class="probe" bind:this={probe}></span>
</div>
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
    /* The held height has no box of its own when every row is drawn, so it adds no gap under the
       last row. */
    .rest {
        position: relative;
    }

    .rest.none {
        display: contents;
    }

    /* Drawn at a row's height and never seen, so the list reads that height off the page. */
    .probe {
        position: absolute;
        width: 0;
        height: calc(var(--tree-row) * var(--text-scale, 1));
        overflow: hidden;
        visibility: hidden;
        pointer-events: none;
    }

    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
