// Layer 3, view partial of tree/Tree.svelte. Make Folder a Hub and Make Folder a Project: what
// the folder a menu was opened on offers, the dialog of Make Folder a Hub (../MakeHubDialog.svelte)
// with a box per collection the templates hold, every box ticked to begin with, and the make that
// the dialog's Make and the item Make Folder a Project post (POST /api/folders/make).
//
// The menu draws the two items as it opens, from what the page holds: each folder of a listing and
// each folder of the workspace carries what it holds that the controls are offered by (its marks,
// server/files/fs.ts), and the offer is state/sources/explorer/view/place.ts's `heldOffer` over the
// marks of the folder and of the folders above it in the tree, the rule the server applies. The
// press of Make Folder a Hub reads the folder's offer, which holds the collections a new hub may
// keep, and opens the dialog on it; the server asks the offer again before it writes and refuses a
// file that is there already, so what the page holds decides only what is drawn. A folder whose
// marks a program outside oculus changed is listed again by the git watcher
// (server/root/watch/git.ts).
//
// A refused make of a hub is said in the dialog, which stays open; a refused make of a project, and
// a hub the folder no longer offers, are said on the tree's refusal line. A made hub or project
// shows itself: every listing and the workspaces are read again, so each menu of the folders below
// it offers what they offer now.

import { z } from 'zod';
import type { ClientState } from '$lib/state/client/context';
import { refusalSentence, unreachableAnswer } from '$lib/state/shared/answers/answers';
import { t } from '$lib/state/shared/words/text';
import { heldOffer, type ListingShown, type TreeRow } from '$lib/state/sources/fs';

/** The route of both controls. */
const MAKE_PATH = '/api/folders/make';

/** A collection a new hub may keep: its key and its data file's default path. */
type MakeCollection = { key: string; file: string };

/** What a folder offers, as the server answered. */
export type MakeOffer = { hub: boolean; project: boolean; collections: MakeCollection[] };

const offerShape = z.object({
    ok: z.literal(true),
    hub: z.boolean(),
    project: z.boolean(),
    collections: z.array(z.object({ key: z.string(), file: z.string() }))
});

const madeShape = z.object({ ok: z.literal(true), written: z.array(z.string()) });

const refusedShape = z.object({
    error: z.string(),
    path: z.string().optional(),
    written: z.string().optional()
});

/** One box of the dialog. */
type MakeRow = MakeCollection & { ticked: boolean };

/** What the dialog of Make Folder a Hub draws. */
export type MakeView = {
    root: string;
    path: string;
    /** The folder's name, the root's name for a root. */
    label: string;
    rows: MakeRow[];
    /** The make is in flight, so the buttons wait. */
    writing: boolean;
    /** The sentence of a refused make, or the empty text. */
    reason: string;
};

/** The sentence of a refused make, from the route's answer. */
function makeRefusal(body: unknown, failed: string): string {
    if (failed !== '') return unreachableAnswer();
    const refused = refusedShape.safeParse(body);
    if (!refused.success) return unreachableAnswer();
    switch (refused.data.error) {
        case 'outside':
        case 'missing':
            return refusalSentence(refused.data.error);
        case 'exists':
            return t('files.make_refused_exists', refused.data.path ?? '');
        case 'not-offered':
            return t('files.make_refused_offer');
        case 'no-template':
            return t('files.make_refused_template');
        default:
            return t('files.make_refused_failed', refused.data.written ?? '');
    }
}

/** The controls over the client's writes, saying a refused project on the tree's line. */
export function createMaking(client: ClientState, say: (note: string) => void) {
    let view = $state<MakeView | null>(null);
    /** The offer of a folder as the server answers it, or null when it could not be read. */
    async function offer(root: string, path: string): Promise<MakeOffer | null> {
        const posted = await client.writes.postCommand(MAKE_PATH, { action: 'offer', root, path });
        if (posted.failed !== '') return null;
        const read = offerShape.safeParse(posted.body);
        return read.success ? read.data : null;
    }

    /**
     * What a folder or root offers of the two controls, from the marks the page holds of it and of
     * the folders above it in its root, with no request: null when a listing on the way to it is
     * not held, which leaves both items out. The listings are those of the tree's toggles.
     */
    function offerAt(row: TreeRow, shown: ListingShown): { hub: boolean; project: boolean } | null {
        const root = client.fs.roots().find((one) => one.key === row.root);
        if (root === undefined) return null;
        return heldOffer(root, row.path, (path) => client.fs.heldEntries(row.root, path, shown));
    }

    /**
     * Open the dialog of Make Folder a Hub on a folder, its collections all ticked, once the
     * folder's offer is read; a folder that offers no hub now is said on the tree's line.
     */
    async function startHub(row: TreeRow, label: string): Promise<void> {
        const offered = await offer(row.root, row.path);
        if (offered?.hub !== true) {
            say(offered === null ? unreachableAnswer() : t('files.make_refused_offer'));
            return;
        }
        view = {
            root: row.root,
            path: row.path,
            label,
            rows: offered.collections.map((one) => ({ ...one, ticked: true })),
            writing: false,
            reason: ''
        };
    }

    function tick(key: string, on: boolean): void {
        if (view === null) return;
        view.rows = view.rows.map((one) => (one.key === key ? { ...one, ticked: on } : one));
    }

    /** Make the dialog's folder a hub with the ticked collections. */
    async function confirm(): Promise<void> {
        if (view === null || view.writing) return;
        const asked = view;
        asked.writing = true;
        const keys = asked.rows.filter((one) => one.ticked).map((one) => one.key);
        const posted = await client.writes.postCommand(MAKE_PATH, {
            action: 'hub',
            root: asked.root,
            path: asked.path,
            keys
        });
        if (view !== asked) return;
        asked.writing = false;
        if (!madeShape.safeParse(posted.body).success) {
            asked.reason = makeRefusal(posted.body, posted.failed);
            return;
        }
        view = null;
        client.fs.invalidate();
    }

    /** Make a folder a project, saying a refusal on the tree's line. */
    async function project(row: TreeRow): Promise<void> {
        const posted = await client.writes.postCommand(MAKE_PATH, {
            action: 'project',
            root: row.root,
            path: row.path
        });
        if (!madeShape.safeParse(posted.body).success) {
            say(makeRefusal(posted.body, posted.failed));
            return;
        }
        client.fs.invalidate();
    }

    return {
        view: () => view,
        offerAt,
        startHub,
        tick,
        confirm,
        project,
        cancel: () => {
            view = null;
        }
    };
}
