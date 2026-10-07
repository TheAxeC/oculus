// Layer 3, shared view partial. The LaTeX tabs the TeX view and the Math Preview follow: the source
// tab of a LaTeX file, or the PDF tab of a build, the reader looked at last on the page. A source
// tab is one whose file the language map names `latex` (`.tex`, `.latex`, `.bib`, `.sty`, `.cls`),
// a PDF tab one that shows a file ending in `.pdf`. The tab is read through `followedTab`
// (state/sources/explorer/sections/followed-tab.ts), so a tab shown in another pane stays followed
// while the reader is in the Files pane or a terminal.

import type { ClientState } from '$lib/state/client/context';
import { languageOf } from '$lib/state/sources/fs';
import { followedTab, type FollowTab } from '$lib/state/sources/explorer/sections/followed-tab';
import { panes } from '$lib/state/workbench/layout/instance';
import { fileOfTab } from '$lib/state/workbench/navigation/pages';

/** The LaTeX tabs followed: the source tab or the PDF of a build, and the source tab alone. */
export type Followed = {
    /** A LaTeX source tab or a PDF tab, whichever the reader looked at last. */
    readonly any: FollowTab | null;
    /** The LaTeX source tab the reader looked at last, which the editing commands act on. */
    readonly source: FollowTab | null;
    /** The file a source tab shows, or null. */
    fileOf: (tab: FollowTab) => { root: string; path: string } | null;
};

/** Follow the LaTeX tabs of the page the reader is on. */
export function createFollowed(client: ClientState): Followed {
    const {
        layout: { activeInstance, currentPage, layout },
        selectors: { languages }
    } = client;

    const page = $derived(currentPage().id);
    const held = $derived(panes(layout(page)).map((one) => one.pane));
    const focused = $derived(activeInstance(page)?.id ?? null);

    const isSource = (tab: FollowTab): boolean => {
        const file = tab.view === 'source' ? fileOfTab(tab) : null;
        return file !== null && languageOf(file.path, languages()) === 'latex';
    };
    const isPdf = (tab: FollowTab): boolean =>
        tab.view === 'file' && (fileOfTab(tab)?.path.toLowerCase().endsWith('.pdf') ?? false);

    const any = $derived(followedTab(held, focused, (one) => isSource(one) || isPdf(one)));
    const source = $derived(followedTab(held, focused, isSource));

    return {
        get any() {
            return any;
        },
        get source() {
            return source;
        },
        fileOf: fileOfTab
    };
}
