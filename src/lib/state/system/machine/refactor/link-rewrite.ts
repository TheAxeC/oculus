// Layer 2, client state. The offer to keep the links in Markdown files pointing at items the Files
// view moved. A rename, a drag or a paste that moved items tells this module the places they were
// at and the places they are at (state/sources/explorer/ops.svelte.ts); for each served root that
// holds both places of some of them it asks the Markdown servers, through the relay, for the edit
// that points the links and backticked paths at the new places, and shows what comes back as a
// Refactor Preview titled "Update links in Markdown files", with the texts of the tabs with unsaved
// text under the root, so the edits of a tab are computed over its text and never over the disk's.
// Nothing is written before the reader applies it. An answer with no edit shows and says nothing;
// an answer that is none (the relay did not answer, or a server ended) is said once, in a
// notification, and so is each root whose server gave no answer beside the edits of the others, and
// each file the edit leaves out because two served folders rewrite its text differently.

import { MergedEdits } from '../../../../data/prose/text-edits.ts';
import type { LinksFailure } from '../../../../data/model/index.ts';
import type { Move } from '../../../sources/explorer/follow.ts';
import { t } from '../../../shared/words/text.ts';
import type { RefactorStore } from './preview.svelte.ts';
import type { LinksReply } from '../lsp/lsp.svelte.ts';
import { noticeWords } from './notice-words.ts';

/** What the offer reads of the page. */
export type LinkRewriteParts = {
    /** Ask the Markdown servers for the edit of some moves under one root. */
    askLinks: (
        root: string,
        moves: { from: string; to: string }[],
        texts: { path: string; text: string }[]
    ) => Promise<LinksReply>;
    /** The drafts of the page's source tabs: the file as `root/path`, the text and the saved. */
    drafts: () => { file: string; text: string; saved: string; loaded: boolean }[];
    /** Make an edit a language server asked for, here shown first. */
    submit: RefactorStore['submit'];
    /** Say something to the reader. */
    say: (message: string) => void;
};

/** The moves of each root whose old and new places are both in it, by the root's key. */
function byRoot(moves: Move[]): Map<string, { from: string; to: string }[]> {
    const roots = new Map<string, { from: string; to: string }[]>();
    for (const move of moves) {
        if (move.from.root !== move.to.root || move.from.path === move.to.path) continue;
        const list = roots.get(move.from.root) ?? [];
        list.push({ from: move.from.path, to: move.to.path });
        roots.set(move.from.root, list);
    }
    return roots;
}

/** The text of each tab with unsaved text over a file under a root, by its path under the root. */
function unsavedUnder(parts: LinkRewriteParts, root: string): { path: string; text: string }[] {
    return parts
        .drafts()
        .filter((one) => one.loaded && one.text !== one.saved && one.file.startsWith(`${root}/`))
        .map((one) => ({ path: one.file.slice(root.length + 1), text: one.text }));
}

/** The path under its root of a file the page spells as `oculus-file:///<root key>/<path>`. */
function pathOf(uri: string): string {
    const path = /^oculus-file:\/\/\/[^/]*\/(.*)$/.exec(uri)?.[1] ?? uri;
    return path.split('/').map(decodeURIComponent).join('/');
}

/** The sentence for a root the Markdown servers gave no edit for. */
function failure(code: LinksFailure, root: string): string {
    if (code === 'no_answer') return t('source.md_links_no_answer', root);
    if (code === 'no_place') return t('source.md_links_no_place', root);
    return t('source.md_links_unsent', root);
}

/** The function the explorer calls with the items it moved. */
export function createLinkRewrite(parts: LinkRewriteParts): (moves: Move[]) => void {
    async function offer(moves: Move[]): Promise<void> {
        const merged = new MergedEdits();
        const held = new Map<string, string>();
        const left = new Set<string>();
        for (const [root, pairs] of byRoot(moves)) {
            const reply = await parts.askLinks(root, pairs, unsavedUnder(parts, root));
            if (!reply.ok) {
                parts.say(failure(reply.error, root));
                continue;
            }
            for (const key of reply.unanswered) parts.say(failure('no_answer', key));
            for (const uri of reply.overlaps) left.add(uri);
            for (const [uri, text] of reply.held) held.set(uri, text);
            const edit = reply.edit as { documentChanges?: unknown[] } | null;
            merged.add(edit?.documentChanges ?? []);
        }
        const { changes, overlaps } = merged.result();
        for (const uri of [...left, ...overlaps])
            parts.say(t('source.md_links_overlap', pathOf(uri)));
        if (changes.length === 0) return;
        const outcome = await parts.submit({ documentChanges: changes }, held, {
            preview: true,
            applied: () => Promise.resolve(),
            title: t('refactor_preview.title_md_links'),
            words: noticeWords
        });
        if (!outcome.applied) parts.say(noticeWords(outcome.notice, outcome.words));
    }
    return (moves) => {
        void offer(moves);
    };
}
