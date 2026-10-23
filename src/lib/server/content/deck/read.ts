// Layer 2, server. One deck folder, found in a served root, read into the deck the Present view
// draws, and the source that read is made over.
//
// A read may be made over drafts: the text some editor holds unsaved for files, which the reader
// takes in place of what the disk holds. A draft is matched to a file by its real path, so the
// same file named under a second root key is read from its draft, and a draft whose root or path
// the roots do not serve names no file and is dropped.
//
// The roots are the folders of the open workspace, so a root that is not one of their names and a
// path that climbs out of a root or leaves it through a link is refused by the rule the file route
// answers by (`resolveRootPath`), ahead of any read. A folder inside a root that holds no deck is
// answered with the empty state of the deck, not refused: the view draws a sentence naming it. The
// reader (data/sources/deck/read.ts) does the reading, and the write of a group's `slides:`
// (server/edit/writes/config/lists/deck/deck.ts) reads the group's members, candidates and missing
// names through the same function.

import { createReader } from '../../../data/sources/deck/read.ts';
import { hubDomainsOf } from '../../../data/index.ts';
import type { DeckProject } from '../../../data/sources/deck/kinds.ts';
import type { Deck, PortfolioConfig, Project } from '../../../data/model/index.ts';
import { bareId, ofHub } from '../../../data/helpers/hub-names.ts';
import { resolveRootPath, type Root } from '../../files/files.ts';
import type { HubTarget } from '../../files/roots.ts';

/**
 * What a deck is read over: the roots it may be in, the primary hub (null with none), its settings,
 * the portfolio's projects and the hubs other than the primary. A deck in the root of one of those
 * hubs is read over that hub's folder, settings and projects; a deck in any other root is read over
 * the primary.
 */
export type DeckSource = {
    roots: Root[];
    primary: { key: string; dir: string } | null;
    config: PortfolioConfig;
    projects: Project[];
    hubs?: HubTarget[];
};

/** What the reader needs of a project of the snapshot. */
function deckProject(project: Project): DeckProject {
    const one: DeckProject = {
        id: bareId(project),
        file: project.file,
        folder: project.folder,
        tier: project.tier,
        chips: project.chips,
        short: project.short ?? '',
        title: project.title
    };
    if (project.workspaceFolder !== undefined) one.workspaceFolder = project.workspaceFolder;
    if (project.type !== undefined) one.type = project.type;
    const domain = project.domainIds.at(0);
    if (domain !== undefined) one.domain = domain;
    return one;
}

/** The text an editor holds unsaved for one file, named by a served root and a path under it. */
export type Draft = { root: string; path: string; text: string };

/** The drafts as text by real path; a draft of a path nothing serves is left out. */
function draftsOf(roots: Root[], drafts: Draft[]): Map<string, string> {
    const held = new Map<string, string>();
    for (const draft of drafts) {
        const found = resolveRootPath(roots, draft.root, draft.path);
        if ('error' in found) continue;
        held.set(found.path, draft.text);
    }
    return held;
}

/**
 * One deck, or the word saying why none was read: `outside` for a root nothing serves and a path
 * that leaves the root. A file the deck reads that a draft names is read from the draft.
 */
export function readDeck(
    source: DeckSource,
    root: string,
    path: string,
    drafts: Draft[] = []
): Deck | 'outside' {
    const found = resolveRootPath(source.roots, root, path);
    if ('error' in found && found.error === 'outside') return 'outside';
    const held = source.roots.find((one) => one.key === root);
    if (held === undefined) return 'outside';
    const owner = (source.hubs ?? []).find((one) => one.key === root);
    const config = owner?.config ?? source.config;
    const hub =
        owner === undefined
            ? (source.primary ?? { key: held.key, dir: held.dir })
            : { key: owner.key, dir: owner.hub };
    const reader = createReader({
        hub,
        projects: ofHub(source.projects, hub.key).map(deckProject),
        domains: Object.keys(hubDomainsOf(hub.dir, config)),
        tagTones: config.tagTones,
        catalog: config.text,
        drafts: draftsOf(source.roots, drafts)
    });
    const deck = reader.read({ key: held.key, dir: held.dir }, path);
    const inherited =
        config.unnamed?.deck === true && held.dir === hub.dir && path === config.portfolioDeck;
    return deck.state === 'missing' && inherited ? { ...deck, state: 'unnamed' } : deck;
}
