// Layer 2, test fixture. What the Settings state suites share: the real config with its words and
// themes installed, the shipped config and its options catalog, and the rows of a workspace of the
// hubs `hub`, the primary, and `lab`, whose settings file relabels the stage `exploring`.

import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { hubSlice } from '../../../../src/lib/data/sources/config/settings/hub-slice.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { vscodeRuleIds } from '../../../../src/lib/data/places/code-rules.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import { listsOf, type Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { settingsGroups } from '../../../../src/lib/state/system/config/groups.ts';
import type { ConfigRow, HubFile } from '../../../../src/lib/state/system/config/rows.ts';
import {
    withHubs,
    type HubRead
} from '../../../../src/lib/state/system/config/view/hub-settings.svelte.ts';

/** The merged config of oculus's own files, under no hub's settings. */
export const config = loadConfig(engineDir()).config;

export const shipped = catalogOf(config);

setCatalog(textCatalog(config));
setAppearance(config, vscodeRuleIds());

/** The lists of a render over a merged config, with no portfolio, views, themes or folder. */
export function bareLists(merged: Record<string, unknown>): Lists {
    return listsOf({
        config: merged,
        portfolio: null,
        views: [],
        tiers: null,
        themeClasses: [],
        codeThemeClasses: [],
        offers: { themes: [], icons: [] },
        folder: () => ({ state: 'ready', entries: [] })
    });
}

/** A file's text as the file browser holds it, read unless `loading` says it is being read. */
export const text = (body: string, more: { loading?: boolean } = {}) => ({
    text: body,
    truncated: false,
    error: '',
    loading: more.loading === true
});

/** The stages of the hub `lab`: oculus's, `exploring` relabelled. */
const stages = config.stages as Record<string, Record<string, unknown>>;
export const LAB_STAGES = { ...stages, exploring: { ...stages.exploring, label: 'Trying' } };

/** Lab's settings file, which relabels `exploring`. */
export const LAB_FILE = 'stages:\n  exploring: { label: Trying }\n';

/** The slice of lab's merged settings the server answers. */
export const LAB_SLICE = { hub: 'lab', config: hubSlice({ ...config, stages: LAB_STAGES }) };

/** Lab's settings, read. */
export const LAB_READ: HubRead = { state: 'ready', slice: LAB_SLICE };

/** The row of the stages. */
export const STAGES = 'catalogs/vocab.yml:stages';

/**
 * What one case gives the rows: the hub the Hub scope picks (none for the Primary hub scope, whose
 * rows are the primary's), lab's read, lab's settings file and the primary's (`{}` unless named).
 */
export type HubCase = {
    hub?: string;
    read?: HubRead;
    file?: HubFile;
    primaryFile?: string;
};

/**
 * The row of one id over the shipped config, as the Settings view draws it in the Hub scope of the
 * case's hub, or in the Primary hub scope with none.
 */
export function hubRowOf(id: string, one: HubCase): ConfigRow {
    const groups = settingsGroups(shipped, config, {
        hubFile: { text: text(one.primaryFile ?? '{}\n'), present: true },
        workspace: null
    });
    const drawn =
        one.hub === undefined
            ? groups
            : withHubs(groups, {
                  hub: one.hub,
                  config,
                  read: () => one.read ?? LAB_READ,
                  file: () => one.file ?? { text: text(LAB_FILE), present: true }
              });
    const rows = drawn.flatMap((group) => group.sections.flatMap((section) => section.rows));
    const row = rows.find((found) => found.id === id);
    if (row?.kind !== 'config') throw new Error(`no row ${id}`);
    return row;
}

/** A file the file browser lists. */
export function file(name: string): FsEntry {
    return { name, kind: 'file', size: 1, mtime: 0 };
}

/** A folder the file browser lists. */
export function dir(name: string): FsEntry {
    return { name, kind: 'dir', size: 0, mtime: 0 };
}
