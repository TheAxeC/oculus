// Layer 2, server. The private portfolio index given to an interactive chat terminal: every hub of
// the open workspace in a section of its own, each read by its own settings (its scan rules, its
// collection paths and the collection keys its `chat_context` names), so the index describes the
// same hubs the page loaded, while missing optional files contribute nothing. The primary's venue
// catalogue and pillars registry open it, each headed by its absolute path, so a chat that runs in
// another hub finds the primary's file. A project of a workspace folder is headed by the folder's
// absolute path, every other folder and file of a section by its path relative to the hub of its
// section.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HubSettings } from '../../../../data/index.ts';
import type { RawManifest } from '../../../../data/model/index.ts';
import { chatContext } from '../../../../data/sources/config.ts';
import { collectionFiles } from '../../../../data/sources/collections.ts';
import { readHubManifests } from '../../../../data/sources/manifests.ts';
import { allHubs, hubManifests, primaryConfig, type HubTarget } from '../../../files/roots.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';

/** Add one file under its heading line, when the file exists. */
function addFile(parts: string[], file: string, heading: string): void {
    if (!existsSync(file)) return;
    parts.push(`${heading}\n${readFileSync(file, 'utf8')}`);
}

/** Add the manifests under one heading, each under its folder's; nothing for no manifest. */
function addManifests(parts: string[], manifests: readonly RawManifest[]): void {
    if (manifests.length === 0) return;
    parts.push('## PROJECT MANIFESTS (status/venue source of truth)\n');
    for (const { file, folder } of manifests) {
        parts.push(`### ${folder}\n${readFileSync(file, 'utf8')}`);
    }
}

/**
 * One hub's section: a heading naming the hub and its folder, the hub's project manifests, then
 * the file of each collection key its own `chat_context` answers, read through its own
 * `collections:` list (the first entry of a key), in that order. The heading is written for a hub
 * with no project and no collection file too, so the chat knows the hub exists.
 */
function addHub(parts: string[], target: HubTarget): void {
    parts.push(`# HUB ${target.key}: ${target.hub}\n`);
    addManifests(parts, hubManifests(target.hub, target.config));
    const listed = collectionFiles(target.config.merged.collections);
    for (const key of chatContext(target.config.merged)) {
        const source = listed.find((entry) => entry.key === key);
        if (source !== undefined) {
            addFile(parts, join(target.hub, source.file), `## ${source.file}`);
        }
    }
}

/**
 * The hubs of the workspace, each once, with their settings as `allHubs` reads them: the primary
 * first, then the others in the folders' order.
 */
function orderedHubs(
    merged: Record<string, unknown>,
    open: OpenWorkspace,
    settings: HubSettings
): HubTarget[] {
    const hubs = allHubs(merged, open, settings);
    return [
        ...hubs.filter((one) => one.key === open.primary),
        ...hubs.filter((one) => one.key !== open.primary)
    ];
}

/**
 * What a portfolio or project chat is handed to read first. With a primary hub: its venue
 * catalogue and pillars registry, then one section per hub of the workspace, the primary's first
 * holding the projects of the workspace's folders that are no hub. With none: the sections of the
 * hubs, then a closing section of those folders' projects, as the build reads them with no primary.
 * `merged` is the primary's merged config as the request read it, and `settings` reads every other
 * hub's.
 */
export function portfolioContext(
    merged: Record<string, unknown>,
    open: OpenWorkspace,
    settings: HubSettings
): string {
    const parts: string[] = [];
    const hubs = orderedHubs(merged, open, settings);
    const primary = hubs.find((one) => one.key === open.primary);
    if (primary !== undefined) {
        const venues = join(primary.hub, primary.config.registries.venues);
        const pillars = join(primary.hub, primary.config.registries.pillars);
        addFile(parts, venues, `# ${venues} (venue catalogue)`);
        addFile(parts, pillars, `# ${pillars}`);
    }
    for (const target of hubs) addHub(parts, target);
    if (primary === undefined) {
        const { repositories, text } = primaryConfig(merged, open, settings);
        const folders = readHubManifests('', [], repositories, text).manifests;
        if (folders.length > 0) {
            parts.push('# WORKSPACE FOLDERS (no hub)\n');
            addManifests(parts, folders);
        }
    }
    return parts.join('\n');
}
