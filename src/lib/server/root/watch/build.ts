// Layer 2, server. The build of a workspace's portfolio that the portfolio watcher publishes
// (server/root/watch/portfolio.ts): every hub read and built with its own settings by the steps of
// data/index.ts and merged as one (`buildHubs`), and the schemas of the files whose readers live in
// the server added to the set the build hands the YAML server (`withOwnSchemas`).
//
// The server's own schemas are those of an app's `app.yml` and a repository's
// `.oculus/commands.yml` and `.oculus/launch.yml`. Each is the JSON Schema of the whole-file zod
// shape its reader checks the file with, matched to the files by path inside any served root. They
// depend on no file of the hub, so they are the same for every build and are added to the set each
// build generates. A workspace file's schema depends on the options of the merged config, so the
// build makes it with the config's schemas (data/sources/config/catalog/schemas/engine.ts).

import { join } from 'node:path';
import {
    buildFolderProjects,
    builtHub,
    readFolders,
    readHub,
    type EngineConfigIn,
    type HubRoot,
    type OtherHub,
    type PortfolioBuild
} from '../../../data/index.ts';
import type { PortfolioConfig, RegistryName } from '../../../data/model/index.ts';
import { mergeHubs, type HubPart } from '../../../data/snapshot/hubs/merge.ts';
import type { SettingsFile } from '../../../data/snapshot/references/build.ts';
import type { Checker } from '../../../data/snapshot/schema/check.ts';
import { REGISTRIES, hubLists } from '../../../data/snapshot/schema/lists.ts';
import { shapeSchema } from '../../../data/snapshot/schema/json.ts';
import {
    joinedSchemas,
    scopedSchemas,
    withSchemas,
    type NamedSchema,
    type SchemaSet
} from '../../../data/snapshot/schema/set.ts';
import { launchFileShape } from '../../machine/debug/launch/read.ts';
import { appShape } from '../../machine/apps/read/manifest.ts';
import { commandsFileShape } from '../../machine/runs/commands/files.ts';

/** The shapes and the files each one governs, relative to a served root. */
const OWN = [
    { name: 'app', shape: appShape, globs: ['.oculus/apps/*/app.yml'] },
    { name: 'commands', shape: commandsFileShape, globs: ['.oculus/commands.yml'] },
    { name: 'launch', shape: launchFileShape, globs: ['.oculus/launch.yml'] }
];

/** The schemas of the shapes that have one. */
const SCHEMAS: NamedSchema[] = OWN.flatMap((one) => {
    const schema = shapeSchema(one.shape);
    return schema === null ? [] : [{ name: one.name, schema, rule: { every: one.globs } }];
});

/** A set with the server-side schemas added to the one a build generated. */
export function withOwnSchemas(set: SchemaSet): SchemaSet {
    return withSchemas(set, SCHEMAS);
}

/** The primary hub as the build reads it: its name, its folder, settings and settings file. */
type PrimaryHub = HubRoot & { portfolio: PortfolioConfig; workspace: SettingsFile | null };

/**
 * A workspace as its build reads it: the primary hub, or null for none; every other hub, read with
 * its own settings; the settings the project folders of a workspace with no primary are read with,
 * whose `repositories` name them; and the names of the workspace's folders in its order.
 */
export type WorkspaceRead = {
    primary: PrimaryHub | null;
    others: readonly OtherHub[];
    config: PortfolioConfig;
    order: readonly string[];
};

/** The keys of one build's records by source, for the other hubs' builds to resolve against. */
type HubLists = Record<string, string[]>;

/** The keys every list but the one at `at` holds, by source. */
function othersOf(lists: readonly HubLists[], at: number): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    lists.forEach((one, index) => {
        if (index === at) return;
        for (const [source, keys] of Object.entries(one)) {
            out[source] = [...(out[source] ?? []), ...keys];
        }
    });
    return out;
}

/** The absolute path of each registry file of the hub at `dir`. */
function registryPaths(dir: string, config: PortfolioConfig): Record<RegistryName, string> {
    return Object.fromEntries(
        REGISTRIES.map((name) => [name, join(dir, config.registries[name])])
    ) as Record<RegistryName, string>;
}

/** No registry file, for a part read from no hub. */
const NO_FILES = Object.fromEntries(REGISTRIES.map((name) => [name, ''])) as Record<
    RegistryName,
    string
>;

/**
 * The build of the project folders of a workspace with no primary, one part per project, each of
 * the hub named by its folder; the findings of the build ride on the first.
 */
function folderParts(build: PortfolioBuild): HubPart[] {
    const { snapshot } = build;
    return Object.values(snapshot.entities.projects).map((project, at) => ({
        key: project.id,
        files: NO_FILES,
        snapshot: {
            ...snapshot,
            entities: { ...snapshot.entities, projects: { [project.id]: project } },
            findings: at === 0 ? snapshot.findings : []
        }
    }));
}

/**
 * The portfolio of a workspace as one build. Each hub is read with its own settings, and built on
 * its own once the keys every other hub holds are known, so a reference its hub does not hold is
 * kept for the merge (snapshot/hubs/merge.ts), which gives every record its id `<hub>:<key>` and
 * resolves each reference in its own hub, then in the others. The project folders of a workspace
 * with no primary are built together and merged one part per folder, the folder's name its hub. The
 * YAML server's schemas and reference index join each hub's, the primary's as they are and another
 * hub's under its own name. The primary hub alone reads the workspace's repositories, its settings
 * file and oculus's own config folder `engine`.
 */
export function buildHubs(
    read: WorkspaceRead,
    version: number,
    checker: Checker,
    engine: EngineConfigIn | null
): PortfolioBuild {
    const { primary } = read;
    const hubs = [
        ...(primary === null
            ? []
            : [
                  {
                      ...primary,
                      read: readHub(
                          primary.dir,
                          primary.portfolio,
                          primary.portfolio.repositories,
                          primary.key
                      )
                  }
              ]),
        ...read.others.map((one) => ({
            ...one,
            workspace: null,
            read: readHub(one.dir, one.portfolio, [], one.key)
        }))
    ];
    const folders = primary === null ? readFolders(read.config) : null;
    const lists = [
        ...hubs.map((one) => hubLists(one.read.raw)),
        ...(folders === null ? [] : [hubLists(folders)])
    ];
    const built = hubs.map((one, at) => ({
        one,
        build: builtHub(one.read, {
            version,
            checker,
            engine: one === hubs[0] && primary !== null ? engine : null,
            workspace: one.workspace,
            others: othersOf(lists, at)
        })
    }));
    const folderBuild =
        folders === null
            ? null
            : buildFolderProjects(folders, read.config, {
                  version,
                  engine,
                  others: othersOf(lists, hubs.length)
              });
    const parts = [
        ...built.map(({ one, build }) => ({
            key: one.key,
            files: registryPaths(one.dir, one.portfolio),
            snapshot: build.snapshot
        })),
        ...(folderBuild === null ? [] : folderParts(folderBuild))
    ];
    const place = (part: HubPart): number => {
        const at = read.order.indexOf(part.key);
        return at < 0 ? read.order.length : at;
    };
    const snapshot = mergeHubs(
        [...parts].sort((one, other) => place(one) - place(other)),
        (primary?.portfolio ?? read.config).text,
        version
    );
    const sets = built.map(({ one, build }) =>
        one === hubs[0] && primary !== null ? build.schemas : scopedSchemas(one.key, build.schemas)
    );
    const builds = [
        ...built.map(({ build }) => build),
        ...(folderBuild === null ? [] : [folderBuild])
    ];
    return {
        snapshot,
        schemas: joinedSchemas([...(folderBuild === null ? [] : [folderBuild.schemas]), ...sets]),
        references: { files: builds.flatMap((one) => one.references.files) }
    };
}
