// Layer 1, data test fixture. The merges the tests of the config's layers read: oculus's own merged
// values, the merge under a hub's settings file and the merge under a workspace file's `settings:`,
// each file given as text so nothing is read at its path, and the findings of the config's readers
// over a merge. One copy, so each test file says only its rows.

import { HUB_FILE } from '../../../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import type { ConfigOptions } from '../../../../../src/lib/data/sources/config/merge/merge.ts';
import { READER_FINDINGS } from '../../../../../src/lib/data/sources/config/sections/findings.ts';
import type { Finding } from '../../../../../src/lib/data/model/index.ts';

/** The folder of the hub whose settings file a case gives as text; nothing is read there. */
export const HUB = '/scratch/lab';

/** The path findings about the hub's settings file name. */
export const HUB_SETTINGS = `${HUB}/${HUB_FILE}`;

/** A workspace file's path; its text is given, so nothing is read at it. */
export const WORKSPACE_FILE = `${HUB}/.oculus/workspaces/main.yml`;

/** oculus's own merged values, with no hub and no workspace. */
export const OCULUS = loadConfig(engineDir()).config;

/** The merge of oculus's files and a hub settings file holding `text`. */
export function withHub(text: string): ReturnType<typeof loadConfig> {
    return loadConfig(engineDir(), {
        hub: HUB,
        instead: { layer: 'hub', name: HUB_FILE, text }
    });
}

/**
 * The merge of oculus's files and a workspace file whose `settings:` holds `settings`, with the
 * other options of the merge `options` gives (the source of a display language).
 */
export function withSettings(
    settings: string,
    options: Omit<ConfigOptions, 'workspace'> = {}
): ReturnType<typeof loadConfig> {
    const text = `folders: []\nsettings:\n${settings}`;
    return loadConfig(engineDir(), { ...options, workspace: { file: WORKSPACE_FILE, text } });
}

/** The findings the config's readers give over a merge, under the hub `hub` or none. */
export function readerFindings(
    read: ReturnType<typeof loadConfig>,
    hub: string | null = null
): Finding[] {
    const where = { engine: engineDir(), hub, from: read.from };
    return READER_FINDINGS.flatMap((reader) => reader(where, read.config));
}

/** Findings as `file | key | message`. */
export function findingLines(findings: readonly Finding[]): string[] {
    return findings.map((one) => `${one.file} | ${one.key} | ${one.message}`);
}

/** A map of the merged config by its key. */
export function mapOf(config: Record<string, unknown>, key: string): Record<string, unknown> {
    return config[key] as Record<string, unknown>;
}
