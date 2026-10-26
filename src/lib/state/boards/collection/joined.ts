// Layer 2, client state. A Collection view of one key joined across hubs, read hub by hub: each
// hub's file is read by the registry that hub's own `collections:` entry of the key names, never by
// one registry taken for the whole view, since two hubs may key the same registry differently or
// give one key to two different kinds of file.

import { rootOf } from '../../../data/helpers/hub-names.ts';
import type { Collection, Entry, Project, RegistryWord } from '../../../data/model/index.ts';

/**
 * How a joined view reads its hubs:
 * - `funded`: the entries of the hubs whose entry names `funding`, the schemes the card of the
 *   projects no scheme covers checks;
 * - `fundedProjects`: of the projects given, those of the hubs whose entry names `funding`, the
 *   projects that card judges, since a project's `funding:` names the schemes of its own hub's
 *   funding file, which a hub keying that file otherwise holds in another view;
 * - `literature`: the collections of the hubs whose entry names `literature`, which Literature's
 *   Add saves into and whose entries the view's Copy BibTeX copies;
 * - `registryOf`: the registry an entry's page opens by, its own hub's, none for a hub whose entry
 *   names none.
 */
export type JoinedRegistries = {
    funded: Entry[];
    fundedProjects: (projects: readonly Project[]) => Project[];
    literature: Collection[];
    registryOf: (entry: Entry) => RegistryWord | undefined;
};

/** How a view joining the collections `parts` (one per hub holding its key) reads each hub. */
export function joinedRegistries(parts: readonly Collection[]): JoinedRegistries {
    const named = (registry: RegistryWord): Collection[] =>
        parts.filter((part) => part.registry === registry);
    const funding = named('funding');
    const fundingHubs = new Set(funding.map(rootOf));
    return {
        funded: funding.flatMap((part) => part.entries),
        fundedProjects: (projects) => projects.filter((one) => fundingHubs.has(rootOf(one))),
        literature: named('literature'),
        registryOf: (entry) => parts.find((part) => rootOf(part) === rootOf(entry))?.registry
    };
}
