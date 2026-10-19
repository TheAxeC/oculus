// Layer 3, view partial of tree/Tree.svelte. The four make items of a folder's menu: Make Folder
// a Hub..., Make Folder a Project, Make Folder a Git Repository and Add Repository
// Configuration.... It says what the folder a menu was opened on offers, holds the state of the
// two dialogs (../make/MakeDialog.svelte draws both), and posts each make (POST
// /api/folders/make).
//
// The menu draws the items as it opens, from what the page holds: each folder of a listing and
// each folder of the workspace carries what it holds that the items are offered by (its marks,
// server/files/fs.ts), and the offer is state/sources/explorer/view/place.ts's `heldOffer` over the
// marks of the folder and of the folders above it in the tree, the rule the server applies. The
// press of an item with a dialog reads the folder's offer, which holds the collections a new hub
// may keep and which repository configuration files are there, and opens the dialog on it; the
// server asks the offer again before it writes and refuses a file that is there already, so what
// the page holds decides only what is drawn. A folder whose marks a program outside oculus changed
// is listed again by the git watcher (server/root/watch/git.ts).
//
// The hub dialog has two groups: the hub files (`config.yml`, always written and drawn with no box;
// `local.yml` with its `.gitignore`; `schedules.yml`) and the collections, every box ticked to
// begin with. The repository dialog has one group of the four configuration files, a file that is
// there drawn as there with no box and each missing one ticked. A refused make of a dialog is said
// in the dialog, which stays open; a refused make of a project or a git repository, and an item
// the folder no longer offers, are said on the tree's refusal line. A made folder shows itself:
// every listing and the workspaces are read again, so each menu offers what it offers now.

import { z } from 'zod';
import type { ClientState } from '$lib/state/client/context';
import { refusalSentence, unreachableAnswer } from '$lib/state/shared/answers/answers';
import { t } from '$lib/state/shared/words/text';
import {
    HUB_CHOICES,
    HUB_FILE,
    heldOffer,
    type ListingShown,
    type MakeItems,
    type TreeRow
} from '$lib/state/sources/fs';

/** The route of every make item. */
const MAKE_PATH = '/api/folders/make';

const offerShape = z.object({
    ok: z.literal(true),
    hub: z.boolean(),
    project: z.boolean(),
    git: z.boolean(),
    repository: z.boolean(),
    collections: z.array(z.object({ key: z.string(), file: z.string() })),
    configs: z.array(z.object({ name: z.string(), file: z.string(), there: z.boolean() }))
});

/** What a folder offers, as the server answered. */
type MakeOffer = z.infer<typeof offerShape>;

const madeShape = z.object({ ok: z.literal(true), written: z.array(z.string()) });

const refusedShape = z.object({
    error: z.string(),
    path: z.string().optional(),
    written: z.string().optional(),
    said: z.string().optional()
});

/** The make a dialog or an item posts. */
type MakeAction = 'hub' | 'project' | 'git' | 'repository';

/**
 * One row of a dialog: the name of a file choice or a collection, the paths it writes, whether it
 * is ticked, and whether it is drawn with no box: `fixed` for a file every make writes, `there`
 * for a file the folder holds already, which the make does not offer.
 */
type MakeRow = {
    key: string;
    paths: readonly string[];
    ticked: boolean;
    fixed: boolean;
    there: boolean;
};

/** A group of a dialog's rows, by the id its words are found by. */
export type MakeGroup = { id: 'hub-files' | 'collections' | 'repository'; rows: MakeRow[] };

/** What a make dialog draws. */
export type MakeView = {
    kind: 'hub' | 'repository';
    root: string;
    path: string;
    /** The folder's name, the root's name for a root. */
    label: string;
    groups: MakeGroup[];
    /** The make is in flight, so the buttons wait. */
    writing: boolean;
    /** The sentence of a refused make, or the empty text. */
    reason: string;
};

/** A row that may be ticked, ticked to begin with. */
function row(key: string, paths: readonly string[], there = false): MakeRow {
    return { key, paths, ticked: !there, fixed: false, there };
}

/** The groups of the hub dialog, over the collections a new hub may keep. */
function hubGroups(offered: MakeOffer): MakeGroup[] {
    return [
        {
            id: 'hub-files',
            rows: [
                { key: 'config', paths: [HUB_FILE], ticked: true, fixed: true, there: false },
                ...HUB_CHOICES.map(([key, paths]) => row(key, paths))
            ]
        },
        { id: 'collections', rows: offered.collections.map((one) => row(one.key, [one.file])) }
    ];
}

/** The sentence of an item the folder does not offer, by the item. */
function notOffered(action: MakeAction): string {
    if (action === 'git') return t('files.make_refused_offer_git');
    if (action === 'repository') return t('files.make_refused_offer_repository');
    return t('files.make_refused_offer');
}

/** The sentence of a refused make, from the route's answer. */
function makeRefusal(body: unknown, failed: string, action: MakeAction): string {
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
            return notOffered(action);
        case 'no-template':
        case 'unknown-collection':
        case 'unknown-file':
            return t('files.make_refused_template');
        case 'git':
            return t('files.make_refused_git', refused.data.said ?? '');
        default:
            return t('files.make_refused_failed', refused.data.written ?? '');
    }
}

/** The controls over the client's writes, saying a refused item on the tree's line. */
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
     * What a folder or root offers of the make items, from the marks the page holds of it and of
     * the folders above it in its root, with no request: null when a listing on the way to it is
     * not held, which leaves every item out. The listings are those of the tree's toggles.
     */
    function offerAt(row: TreeRow, shown: ListingShown): MakeItems | null {
        const root = client.fs.roots().find((one) => one.key === row.root);
        if (root === undefined) return null;
        return heldOffer(root, row.path, (path) => client.fs.heldEntries(row.root, path, shown));
    }

    /**
     * Open the dialog of an item on a folder once the folder's offer is read; a folder that offers
     * the item no more is said on the tree's line.
     */
    async function start(kind: 'hub' | 'repository', at: TreeRow, label: string): Promise<void> {
        const offered = await offer(at.root, at.path);
        if (!offered?.[kind]) {
            say(offered === null ? unreachableAnswer() : notOffered(kind));
            return;
        }
        const groups: MakeGroup[] =
            kind === 'hub'
                ? hubGroups(offered)
                : [
                      {
                          id: 'repository',
                          rows: offered.configs.map((one) => row(one.name, [one.file], one.there))
                      }
                  ];
        view = { kind, root: at.root, path: at.path, label, groups, writing: false, reason: '' };
    }

    function tick(group: MakeGroup['id'], key: string, on: boolean): void {
        if (view === null) return;
        view.groups = view.groups.map((one) =>
            one.id !== group
                ? one
                : {
                      ...one,
                      rows: one.rows.map((r) => (r.key === key ? { ...r, ticked: on } : r))
                  }
        );
    }

    /** The keys of a group's ticked rows that a make writes. */
    function chosen(asked: MakeView, group: MakeGroup['id']): string[] {
        const rows = asked.groups.find((one) => one.id === group)?.rows ?? [];
        return rows.filter((one) => one.ticked && !one.fixed && !one.there).map((one) => one.key);
    }

    /** Make the dialog's folder a hub, or add its ticked repository files. */
    async function confirm(): Promise<void> {
        if (view === null || view.writing) return;
        const asked = view;
        asked.writing = true;
        const body =
            asked.kind === 'hub'
                ? { keys: chosen(asked, 'collections'), files: chosen(asked, 'hub-files') }
                : { files: chosen(asked, 'repository') };
        const posted = await client.writes.postCommand(MAKE_PATH, {
            action: asked.kind,
            root: asked.root,
            path: asked.path,
            ...body
        });
        if (view !== asked) return;
        asked.writing = false;
        if (!madeShape.safeParse(posted.body).success) {
            asked.reason = makeRefusal(posted.body, posted.failed, asked.kind);
            return;
        }
        view = null;
        client.fs.invalidate();
    }

    /** Make a folder a project or a git repository, saying a refusal on the tree's line. */
    async function direct(action: 'project' | 'git', at: TreeRow): Promise<void> {
        const posted = await client.writes.postCommand(MAKE_PATH, {
            action,
            root: at.root,
            path: at.path
        });
        if (!madeShape.safeParse(posted.body).success) {
            say(makeRefusal(posted.body, posted.failed, action));
            return;
        }
        client.fs.invalidate();
    }

    return {
        view: () => view,
        offerAt,
        startHub: (at: TreeRow, label: string) => start('hub', at, label),
        startRepository: (at: TreeRow, label: string) => start('repository', at, label),
        tick,
        confirm,
        project: (at: TreeRow) => direct('project', at),
        git: (at: TreeRow) => direct('git', at),
        cancel: () => {
            view = null;
        }
    };
}
