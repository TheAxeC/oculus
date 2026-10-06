// Layer 2, server. One deck folder, found in a served root, read into the deck the Present view
// draws, and the source that read is made over.
//
// The roots are the list the deck route composed (server/files/roots.ts), so a root that is not one
// of their keys and a path that climbs out of a root or leaves it through a link is refused by the
// rule the file route answers by (`resolveRootPath`), ahead of any read. A folder inside a
// root that holds no deck is answered with the empty state of the deck, not refused: the view
// draws a sentence naming it. The reader (data/sources/deck/read.ts) does the reading, and the
// write of a group's `slides:` (server/edit/writes/config/deck.ts) reads the group's members,
// candidates and missing names through the same function.

import { createReader } from '../../../data/sources/deck/read.ts';
import type { DeckProject } from '../../../data/sources/deck/kinds.ts';
import type { Deck, PortfolioConfig, Project } from '../../../data/model/index.ts';
import { HUB_ROOT, resolveRootPath, type Root } from '../../files/files.ts';

/** What a deck is read over: the roots it may be in, the hub and the portfolio the hub holds. */
export type DeckSource = {
    roots: Root[];
    hub: string;
    config: PortfolioConfig;
    projects: Project[];
};

/** What the reader needs of a project of the snapshot. */
function deckProject(project: Project): DeckProject {
    const one: DeckProject = {
        id: project.id,
        file: project.file,
        folder: project.folder,
        tier: project.tier,
        chips: project.chips,
        short: project.short ?? '',
        title: project.title
    };
    if (project.type !== undefined) one.type = project.type;
    const domain = project.domainIds.at(0);
    if (domain !== undefined) one.domain = domain;
    return one;
}

/**
 * One deck, or the word saying why none was read: `outside` for a root nothing serves and a path
 * that leaves the root.
 */
export function readDeck(source: DeckSource, root: string, path: string): Deck | 'outside' {
    const found = resolveRootPath(source.roots, root, path);
    if ('error' in found && found.error === 'outside') return 'outside';
    const held = source.roots.find((one) => one.key === root);
    if (held === undefined) return 'outside';
    const reader = createReader({
        hub: { key: HUB_ROOT, dir: source.hub },
        projects: source.projects.map(deckProject),
        domains: source.config.domains,
        tagTones: source.config.tagTones,
        catalog: source.config.text
    });
    return reader.read({ key: held.key, dir: held.dir }, path);
}
