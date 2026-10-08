// Layer 1, data. The names of the hub's files and folders that the readers of data/sources, the
// schema generator of data/snapshot, the file server and the page all hold: the manifest's file
// name, the side-projects tier and the folder of a repository that holds oculus's own files, the
// two keys the hub and the engine's config folder are served under, and how each registry file
// names its entry list and its id field.

import type { RegistryName, ScanRule } from '../model/index.ts';

/** The key the hub itself is served under, so a collection's `link` to a file in the hub opens. */
export const HUB_ROOT = 'hub';

/**
 * The key the engine's own `config/` folder is served under. The Settings view lists that folder's
 * files and opens one in a source tab, and an edit saved there is an ordinary write under a root,
 * which the config watcher sees like any other. `local.yml` is a file of that folder and is
 * served, read and saved like the tracked ones. Nothing above the folder is served: the root is the
 * folder itself, so the rest of the engine directory stays outside every route.
 */
export const ENGINE_ROOT = 'engine';

/** The one filename a scan tier's folder is read for. */
export const MANIFEST = 'project.yml';

/** The tier whose folders are side projects, which only the Personal board reads. */
const SIDE_TIER = 'side-projects';

/** The folder of a repository that holds its side-project manifest. */
export const ROOT_FOLDER = '.oculus';

/** Whether a scan rule names the side-projects tier, by the last segment of its `dir`. */
export function isSideTier(rule: ScanRule): boolean {
    return (rule.dir.split('/').pop() ?? rule.dir) === SIDE_TIER;
}

/**
 * How each file names its entry list and its id field. The seven registries keyed by `key` and the
 * venue registry keyed by `id` are what the files hold; funding's `key` is the cross-link anchor a
 * manifest names and its own schema marks it optional, so an entry without one is not a finding.
 */
export const REGISTRY_SHAPES: Record<
    RegistryName,
    { list: string; idField: string; idRequired: boolean }
> = {
    venues: { list: 'entries', idField: 'id', idRequired: true },
    datasets: { list: 'datasets', idField: 'key', idRequired: true },
    pillars: { list: 'entries', idField: 'key', idRequired: true },
    domains: { list: 'entries', idField: 'key', idRequired: true },
    funding: { list: 'entries', idField: 'key', idRequired: false },
    people: { list: 'entries', idField: 'key', idRequired: true },
    organisations: { list: 'entries', idField: 'key', idRequired: true },
    resources: { list: 'entries', idField: 'key', idRequired: true }
};

/**
 * A manifest key that has been renamed, and the name it is written under now. One word for a thing
 * means the reader takes the new key alone, so a manifest still carrying the old one is a finding
 * that names both rather than a value quietly read under two names.
 */
export const RENAMED_FIELDS: Record<string, string> = { program: 'pillar' };
