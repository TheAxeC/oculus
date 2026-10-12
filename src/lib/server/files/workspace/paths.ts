// Layer 2, server. The files and folders the machine keeps one of per oculus (the reader's own
// bookmarks, the scratch notes, the schedules and the machine's apps), which live in the primary
// hub's `.oculus/` folder. A key of the machine's values that names one of them wins; otherwise the
// default lies in the primary's folder; a workspace with no primary has none, and the sections that
// read them are empty and the actions that would write them say why.

import { join } from 'node:path';
import { ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import type { LocalConfig } from '../../../data/sources/config.ts';

/**
 * The per-oculus paths of a workspace; each is null when there is no primary and no key names it.
 */
export type PerOculus = {
    bookmarks: string | null;
    notes: string | null;
    schedules: string | null;
    appsDir: string | null;
};

/** The name of each per-oculus path inside the primary hub's `.oculus/` folder. */
export const PER_OCULUS_NAMES: Record<keyof PerOculus, string> = {
    bookmarks: 'bookmarks.yml',
    notes: 'notes',
    schedules: 'schedules.yml',
    appsDir: 'apps'
};

/** The primary hub's `.oculus/` folder, or null with no primary. */
function oculusFolderOf(primaryDir: string | null): string | null {
    return primaryDir === null ? null : join(primaryDir, ROOT_FOLDER);
}

/** The per-oculus paths for a primary's folder and the machine's values. */
export function perOculus(primaryDir: string | null, local: LocalConfig): PerOculus {
    const base = oculusFolderOf(primaryDir);
    const under = (name: string): string | null => (base === null ? null : join(base, name));
    return {
        bookmarks: local.bookmarks ?? under(PER_OCULUS_NAMES.bookmarks),
        notes: local.notes ?? under(PER_OCULUS_NAMES.notes),
        schedules: local.schedules ?? under(PER_OCULUS_NAMES.schedules),
        appsDir: local.appsDir ?? under(PER_OCULUS_NAMES.appsDir)
    };
}

/** The option of the config reader that names the primary hub's layer, none with no primary. */
export function hubOption(primaryDir: string | null): { hub?: string } {
    return primaryDir === null ? {} : { hub: primaryDir };
}
