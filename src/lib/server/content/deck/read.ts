// Layer 2, server. One deck folder, found in a served root, read into the deck the Present view
// draws, and the source that read is made over.
//
// A read may be made over drafts: the text some editor holds unsaved for files, which the reader
// takes in place of what the disk holds. A draft is matched to a file by its real path, so the
// same file named under a second root key is read from its draft, and a draft whose root or path
// the roots do not serve names no file and is dropped.
//
// A read may be narrowed by the keys of the projects a filter keeps, each a project's key in the
// files of the hub the deck is read under, the key the reader holds as `DeckProject.id`. Since the
// reader holds the projects of that hub alone, a key names one project of it and never a project
// of another hub that has the same key. With no keys the read is the whole deck.
//
// Each project the reader holds carries its facts, which the strip at the foot of its deck's slides
// draws and its `{{project.<field>}}` placeholders are filled from. They are worked out here from
// the project's ids in the snapshot, the snapshot's records and the words of the hub the deck is
// read under (data/shapes/project-facts.ts), so a deck of a second hub draws that hub's words.
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
import { frameSetting } from '../../../data/sources/config.ts';
import type { DeckProject } from '../../../data/sources/deck/kinds.ts';
import type { Deck, PortfolioConfig, Project } from '../../../data/model/index.ts';
import { byKey, isMap } from '../../../data/helpers/guards.ts';
import { ofHub } from '../../../data/helpers/hub-names.ts';
import {
    projectFacts,
    type FactRecordKind,
    type FactWords
} from '../../../data/shapes/project-facts.ts';
import { resolveRootPath, type Root } from '../../files/files.ts';
import type { HubTarget } from '../../files/roots.ts';

/**
 * What a deck is read over: the roots it may be in, the primary hub (null with none), its settings,
 * the portfolio's projects, the snapshot's records the projects' facts name, and the hubs other
 * than the primary. A deck in the root of one of those hubs is read over that hub's folder,
 * settings and projects; a deck in any other root is read over the primary.
 */
export type DeckSource = {
    roots: Root[];
    primary: { key: string; dir: string } | null;
    config: PortfolioConfig;
    projects: Project[];
    /** One entity map of the snapshot by internal id, or null while none was published. */
    entities: (kind: FactRecordKind) => Record<string, unknown> | null;
    hubs?: HubTarget[];
};

/**
 * What the reader needs of a project of the snapshot, its facts among it. The project's id is the
 * key its own hub's files give it (`ofHub`); the domain stays the internal id, which the client's
 * hue and title of a domain read.
 */
function deckProject(project: Project, words: FactWords): DeckProject {
    const one: DeckProject = {
        id: project.id,
        file: project.file,
        folder: project.folder,
        tier: project.tier,
        chips: project.chips,
        short: project.short ?? '',
        title: project.title,
        facts: projectFacts(project, words)
    };
    if (project.workspaceFolder !== undefined) one.workspaceFolder = project.workspaceFolder;
    if (project.stage !== undefined) one.stage = project.stage;
    if (project.form !== undefined) one.form = project.form;
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
 * that leaves the root. A file the deck reads that a draft names is read from the draft. With
 * `keep`, every group of project decks draws only the members whose project's key it holds.
 */
export function readDeck(
    source: DeckSource,
    root: string,
    path: string,
    drafts: Draft[] = [],
    keep?: readonly string[]
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
    const words: FactWords = {
        record: (kind, id) => {
            const held = byKey(source.entities(kind) ?? {}, id);
            return isMap(held) ? held : undefined;
        },
        vocab: config.merged,
        catalog: config.text
    };
    const reader = createReader({
        hub,
        projects: ofHub(source.projects, hub.key).map((project) => deckProject(project, words)),
        domains: Object.keys(hubDomainsOf(hub.dir, config)),
        tagTones: config.tagTones,
        frame: frameSetting(config.merged),
        catalog: config.text,
        drafts: draftsOf(source.roots, drafts),
        ...(keep === undefined ? {} : { keep: new Set(keep) })
    });
    const deck = reader.read({ key: held.key, dir: held.dir }, path);
    const inherited =
        config.unnamed?.deck === true && held.dir === hub.dir && path === config.portfolioDeck;
    return deck.state === 'missing' && inherited ? { ...deck, state: 'unnamed' } : deck;
}
