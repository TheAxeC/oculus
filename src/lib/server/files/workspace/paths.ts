// Layer 2, server. The files and folders oculus keeps one of for a workspace (the reader's own
// bookmarks, the schedules and the machine's apps), named by the keys `bookmarks`, `schedules` and
// `apps_dir` of the merged config: the primary hub's `.oculus/config.yml` when it sets them, else
// oculus's defaults (config/defaults/sources.yml), which put them in the primary hub's `.oculus/`
// folder. A value is a path relative to the primary hub, `~` or a path under `~/`, or an absolute
// path. A workspace with no primary has no relative place, and the sections that read them are
// empty and the actions that would write them say why.

import { isAbsolute, join } from 'node:path';
import type { WorkspaceLayer } from '../../../data/sources/config.ts';
import type { LanguageSource } from '../../../data/sources/config/merge/language.ts';
import { expandHome } from './folders.ts';

/**
 * The per-oculus paths of a workspace; each is null when its key names a path relative to a
 * primary hub the workspace does not have, or holds no path at all.
 */
export type PerOculus = {
    bookmarks: string | null;
    schedules: string | null;
    appsDir: string | null;
};

/** The key of the merged config that names each per-oculus path. */
const PER_OCULUS_KEYS: Record<keyof PerOculus, string> = {
    bookmarks: 'bookmarks',
    schedules: 'schedules',
    appsDir: 'apps_dir'
};

/** The path a key's value names: a home-relative or absolute path as it is, else under the hub. */
function placeOf(value: unknown, primaryDir: string | null): string | null {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const expanded = expandHome(value.trim());
    if (isAbsolute(expanded)) return expanded;
    return primaryDir === null ? null : join(primaryDir, expanded);
}

/** The per-oculus paths for a primary's folder and the merged config read with its hub. */
export function perOculus(
    primaryDir: string | null,
    config: Readonly<Record<string, unknown>>
): PerOculus {
    return {
        bookmarks: placeOf(config[PER_OCULUS_KEYS.bookmarks], primaryDir),
        schedules: placeOf(config[PER_OCULUS_KEYS.schedules], primaryDir),
        appsDir: placeOf(config[PER_OCULUS_KEYS.appsDir], primaryDir)
    };
}

/**
 * The option of the config reader that names the primary hub's settings file, none with no primary.
 */
function hubOption(primaryDir: string | null): { hub?: string } {
    return primaryDir === null ? {} : { hub: primaryDir };
}

/**
 * The options of the config reader for the open workspace: the primary hub's settings file, the
 * workspace file whose `settings:` is laid over both, none for the unsaved workspace, and the
 * source of the display language its `locale` names, none for oculus's own words alone.
 */
export function configOptions(
    open: { primaryDir: string | null; file: string | null },
    language?: LanguageSource
): {
    hub?: string;
    workspace?: WorkspaceLayer;
    language?: LanguageSource;
} {
    return {
        ...hubOption(open.primaryDir),
        ...(open.file === null ? {} : { workspace: { file: open.file } }),
        ...(language === undefined ? {} : { language })
    };
}
