// Layer 2, server. The hub files and folders a rebuild of the portfolio watcher (portfolio.ts)
// reads, as the predicates and directory lists its watches are filtered and opened by: the files a
// hub's build reads, the files a build over project folders alone reads, and the directories the
// recursive watches serve. Each is derived from the config the build was made from, and from the
// paths the audit reads (audited.ts), so the watcher builds them again at every rebuild.

import { basename, dirname, join, sep } from 'node:path';
import { MANIFEST, ROOT_FOLDER } from '../../../../data/helpers/hub-names.ts';
import type { PortfolioConfig, RepositoryRoot } from '../../../../data/model/index.ts';
import { DECK_FILE, PROJECT_DECK } from '../../../../data/sources/deck/read.ts';
import { audited } from './audited.ts';

/**
 * The hub files a rebuild actually reads: every registry, collection and YAML feed file, the career
 * file, every `project.yml` and `present.yml` under a scan tier, the Markdown files inside a
 * project's `present/` folder, the `.yml` and `.md` files of the portfolio deck's folder, and under
 * a scan tier the paths the audit reads (`paths`, audited.ts). A `.yml` kept beside one of them (a
 * note next to a registry, a draft, a second file in a project folder) changes nothing the snapshot
 * holds, so an event for it is not a rebuild. The set is derived from the same config the build was
 * made from, which is why the predicate is built again at every rebuild rather than held as a
 * constant.
 */
export function namedByConfig(
    hub: string,
    config: PortfolioConfig,
    paths: readonly string[][],
    roots: RepositoryRoot[] = []
): (path: string) => boolean {
    const files = new Set<string>();
    for (const root of roots) {
        files.add(join(root.dir, MANIFEST));
        files.add(join(root.dir, ROOT_FOLDER, MANIFEST));
    }
    for (const file of Object.values(config.registries)) files.add(join(hub, file));
    for (const file of config.collections) files.add(join(hub, file.file));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        files.add(join(hub, file));
    }
    if (config.career !== null) files.add(join(hub, config.career));
    const tiers = config.scan.map((rule) => join(hub, rule.dir) + sep);
    const deck = config.portfolioDeck === null ? null : join(hub, config.portfolioDeck) + sep;
    const perProject = [MANIFEST, DECK_FILE];
    return (path: string): boolean => {
        if (files.has(path)) return true;
        if (deck !== null && path.startsWith(deck)) return /\.(yml|md)$/.test(path);
        const tier = tiers.find((one) => path.startsWith(one));
        if (tier === undefined) return false;
        if (perProject.includes(basename(path))) return true;
        const below = path.slice(tier.length).split(sep);
        if (path.endsWith('.md') && below.slice(0, -1).includes(PROJECT_DECK)) return true;
        // The audit reads a project's documents and folders off the disk, so an event on one of
        // them under a tier is a rebuild like a changed manifest; the path is read tier-relative,
        // so a folder of the hub above the tier never counts as one of a project's.
        return audited(
            path
                .slice(tier.length)
                .split(sep)
                .filter((part) => part !== ''),
            paths
        );
    };
}

/**
 * The files a build over project folders alone reads: the `project.yml` and `.oculus/project.yml`
 * of each folder. A workspace with no primary hub reads nothing else.
 */
export function namedByRoots(roots: RepositoryRoot[]): (path: string) => boolean {
    const files = new Set(
        roots.flatMap((root) => [join(root.dir, MANIFEST), join(root.dir, ROOT_FOLDER, MANIFEST)])
    );
    return (path: string): boolean => files.has(path);
}

/**
 * The hub directories the build reads: every scan tier, the folder of every registry file and
 * collection file, and the folder of every generated feed the command center counts. The feeds
 * are watched too, since the Focus board reads them and a refreshed feed has to reach the page the
 * way a changed manifest does.
 *
 * The career file is not here: it sits wherever `career_file` names it (by default
 * `.oculus/data/academic/career.yml`), and a name in the hub root would make a recursive watch
 * of its folder cover the whole hub a second time, so watchPortfolio watches that one file on its
 * own, through a flat watch of its folder filtered on its name (`watchFile`).
 */
export function watchedDirectories(
    hub: string,
    config: PortfolioConfig,
    roots: RepositoryRoot[] = []
): string[] {
    const dirs = new Set(roleDirectories(hub, config, roots));
    if (config.feeds.linkedin !== '') dirs.add(join(hub, config.feeds.linkedin));
    return [...dirs];
}

/**
 * The watched directories apart from the LinkedIn folder: the ones a recursive YAML watch serves.
 */
export function roleDirectories(
    hub: string,
    config: PortfolioConfig,
    roots: RepositoryRoot[] = []
): string[] {
    const dirs = new Set<string>();
    for (const root of roots) dirs.add(join(root.dir, ROOT_FOLDER));
    for (const rule of config.scan) dirs.add(join(hub, rule.dir));
    for (const file of Object.values(config.registries)) dirs.add(dirname(join(hub, file)));
    for (const file of config.collections) dirs.add(dirname(join(hub, file.file)));
    for (const file of [config.feeds.leads, config.feeds.radar]) {
        dirs.add(dirname(join(hub, file)));
    }
    if (config.portfolioDeck !== null) dirs.add(join(hub, config.portfolioDeck));
    return [...dirs];
}
