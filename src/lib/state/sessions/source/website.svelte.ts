// Layer 2, client state. Write the website, the Career view's button and the press an audit finding
// of the Website section offers: one POST of /api/website, which builds the website's three files
// from the hub, writes them through the Files view's writer and runs `website.cv` in the website's
// folder as a task terminal (server/machine/runs/website.ts).
//
// The button is off, with the sentence saying why, while the user is not known or `website.folder`
// is empty. A press over a generated file a source tab holds unsaved text of is refused before it
// is sent, as every write over such a file is (state/sessions/source/write-files.ts,
// `unsavedAnswer`). A command text not yet approved comes back as its line: the store holds it, the
// view asks, and approving it posts the approval as a project command's is posted and presses
// again. Under the button the store says what the last press came to: the files written, then the
// command running and the status it ended with, read from the terminals list, or the refusal.

import { z } from 'zod';
import { readJson } from '../../../data/shapes/shapes.ts';
import {
    WEBSITE_REFUSALS,
    type ChainLine,
    type Snapshot,
    type Terminal,
    type WebsiteRefusal
} from '../../../data/model/index.ts';
import { postWithToken, type TokenSource } from '../../shared/stores/token-post.ts';
import { t } from '../../shared/words/text.ts';
import type { FileLookups } from './write-files.ts';
import { unsavedAnswer } from './write-files.ts';

/** The files a press writes, in the website's folder. */
const FILES = ['_data/data.yml', '_data/publications.yml', '_data/industry.yml'];

/** What the store needs from the page. */
export type WebsiteDeps = {
    writes: TokenSource;
    /** The merged configuration as the page last received it. */
    config: () => Record<string, unknown> | null;
    snapshot: () => Snapshot | null;
    look: Pick<FileLookups, 'primary' | 'unsavedUnknown'>;
    heldUnsaved: (file: { root: string; path: string }) => boolean;
    /** Approve a chain of lines in a folder, as the command form approves a command. */
    approve: (repo: string, lines: ChainLine[]) => Promise<{ ok: boolean; error?: string }>;
    /** One terminal of the terminals list by id, null when it is not listed. */
    terminal: (id: string) => Terminal | null;
};

/** What the last press came to. */
type Said = { text: string; error: boolean } | null;

/** The store of Write the website. */
export type WebsiteStore = {
    /** Why the button is off, or null while a press may be made. */
    off: () => string | null;
    busy: () => boolean;
    /** The lines a press waits to have approved, and the folder they run in; null for none. */
    asking: () => { repo: string; lines: ChainLine[] } | null;
    /** The sentence under the button. */
    said: () => Said;
    write: () => Promise<void>;
    /** Approve the asked lines and press again. */
    approve: () => Promise<void>;
    /** Leave the asked lines unapproved. */
    drop: () => void;
};

/** An answer of the route. */
const answerShape = z.union([
    z.object({
        ok: z.literal(true),
        written: z.array(z.string()),
        terminal: z.object({ id: z.string() }).nullable()
    }),
    z.object({
        approve: z.array(z.object({ folder: z.string(), run: z.string() })),
        repo: z.string()
    }),
    z.object({ error: z.enum(WEBSITE_REFUSALS), names: z.array(z.string()) })
]);

/** The catalog sentence of each refusal of the route. */
const REFUSAL_WORDS: Record<WebsiteRefusal, string> = {
    'website-no-hub': 'career.website_no_hub',
    'website-no-person': 'career.website_no_person',
    'website-no-folder': 'career.website_no_folder',
    'website-folder-missing': 'career.website_folder_missing',
    'website-site-unreadable': 'career.website_site_unreadable',
    'website-running': 'career.website_already_running',
    'website-unwritable': 'career.website_unwritable'
};

/** The folder `website.folder` of the merged configuration names, the empty text for none. */
function folderOf(config: Record<string, unknown> | null): string {
    const website = config?.website;
    if (typeof website !== 'object' || website === null || !('folder' in website)) return '';
    return typeof website.folder === 'string' ? website.folder.trim() : '';
}

/** Whether the snapshot names the user. */
function selfKnown(snapshot: Snapshot | null): boolean {
    return Object.values(snapshot?.entities.people ?? {}).some((one) => one.self === true);
}

export function createWebsite(deps: WebsiteDeps): WebsiteStore {
    const state = $state<{
        busy: boolean;
        said: Said;
        asking: { repo: string; lines: ChainLine[] } | null;
        run: string | null;
        written: string[];
    }>({ busy: false, said: null, asking: null, run: null, written: [] });

    function off(): string | null {
        if (!selfKnown(deps.snapshot())) return t('career.website_no_person');
        if (folderOf(deps.config()) === '') return t('career.website_no_folder');
        return null;
    }

    /** The refusal of a press over a generated file a source tab holds unsaved text of. */
    function unsaved(): string | null {
        const root = deps.look.primary();
        if (root === null) return null;
        const folder = folderOf(deps.config());
        for (const name of FILES) {
            const file = { root, path: `${folder}/${name}` };
            const answer = unsavedAnswer(file, deps.look, deps.heldUnsaved);
            if (answer !== null) return answer.error ?? '';
        }
        return null;
    }

    /** Take one answer of the route into the store. */
    function take(raw: unknown): void {
        const read = answerShape.safeParse(raw);
        state.written = [];
        if (!read.success) {
            state.said = { text: t('career.website_failed'), error: true };
        } else if ('error' in read.data) {
            const words = REFUSAL_WORDS[read.data.error];
            state.said = { text: t(words, ...read.data.names), error: true };
        } else if ('approve' in read.data) {
            state.asking = { repo: read.data.repo, lines: read.data.approve };
            state.said = null;
        } else {
            state.written = read.data.written;
            state.run = read.data.terminal?.id ?? null;
            state.said = null;
        }
    }

    async function write(): Promise<void> {
        if (state.busy || off() !== null) return;
        const held = unsaved();
        if (held !== null) {
            state.said = { text: held, error: true };
            return;
        }
        state.busy = true;
        state.run = null;
        try {
            take(await readJson(await postWithToken('/api/website', {}, deps.writes)));
        } catch {
            state.said = { text: t('career.website_failed'), error: true };
        } finally {
            state.busy = false;
        }
    }

    async function approve(): Promise<void> {
        const asked = state.asking;
        if (asked === null) return;
        state.asking = null;
        const done = await deps.approve(asked.repo, asked.lines);
        if (!done.ok) {
            state.said = { text: done.error ?? t('career.website_failed'), error: true };
            return;
        }
        await write();
    }

    /**
     * The sentence under the button: a refusal as the route said it, or the files written with the
     * command's run as the terminals list says it, running or ended with its status.
     */
    function said(): Said {
        if (state.said !== null || state.written.length === 0) return state.said;
        const files = state.written.join(', ');
        if (state.run === null) return { text: t('career.website_written', files), error: false };
        const exit = deps.terminal(state.run)?.exit ?? null;
        if (exit === null) return { text: t('career.website_running', files), error: false };
        return { text: t('career.website_exited', files, String(exit)), error: exit !== 0 };
    }

    return {
        off,
        busy: () => state.busy,
        asking: () => state.asking,
        said,
        write,
        approve,
        drop: () => {
            state.asking = null;
        }
    };
}
