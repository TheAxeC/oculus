// Layer 2, server. The private portfolio index given to an interactive chat terminal.
// It follows the configured scan rules and collection paths so the index describes the same hub
// the page loaded, while missing optional files contribute nothing.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { portfolioConfigFrom } from '../../../../data/index.ts';
import { readManifests } from '../../../../data/sources/manifests.ts';

const COLLECTION_ORDER = [
    'funding',
    'events',
    'education',
    'applications',
    'joint-work',
    'tasks'
] as const;

/** Add one configured file with a heading when it exists. */
function addFile(parts: string[], hub: string, path: string, suffix = ''): void {
    const file = join(hub, path);
    if (!existsSync(file)) return;
    parts.push(`# ${path}${suffix}\n${readFileSync(file, 'utf8')}`);
}

/**
 * What a portfolio chat is handed to read first, from oculus's configured source paths: the venue
 * catalogue, the project manifests, the pillars, then the six private collections in that order.
 */
export function portfolioContext(
    hub: string,
    merged: Record<string, unknown>,
    engine: string
): string {
    const config = portfolioConfigFrom(merged, engine);
    const parts: string[] = [];
    addFile(parts, hub, config.registries.venues, ' (venue catalogue)');
    parts.push('# PROJECT MANIFESTS (status/venue source of truth)\n');
    const { manifests } = readManifests(hub, config.scan, config.text);
    for (const { file, folder, ghost } of manifests) {
        if (ghost) continue;
        parts.push(`## ${folder}\n${readFileSync(file, 'utf8')}`);
    }
    addFile(parts, hub, config.registries.pillars);
    for (const key of COLLECTION_ORDER) {
        const source = config.collections.find((entry) => entry.key === key);
        if (source !== undefined) addFile(parts, hub, source.file);
    }
    return parts.join('\n');
}
