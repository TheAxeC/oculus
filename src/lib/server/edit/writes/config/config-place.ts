// Layer 2, server. Where a Settings write of one option lands, and what it reads there.
//
// Oculus's own files under config/ are never written. A key of the hub list (data/helpers/
// hub-names.ts) is written in the primary hub's settings file, `<hub>/.oculus/config.yml`, at the
// key itself; any other option is written in the `settings:` map of the open workspace file, at
// `settings.<key>`. With no primary hub a key of the hub list has no place, and with no workspace
// file open (the unsaved workspace) no other option has one: the write is refused with the sentence
// that says which (`placeRefusal`). The file at a place may not hold the key yet, and the hub's
// settings file may not be there at all; the write then adds the key (config-checks.ts).
//
// The merged configuration a write starts from is read over both layers (`loadLayers`): oculus's
// files, the hub's settings file and the workspace file's `settings:`, as the server reads them.

import { readFileSync, rmSync, rmdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseDocument, isMap as isYamlMap, isScalar } from 'yaml';
import { HUB_FILE, hubFileOf } from '../../../../data/helpers/hub-names.ts';
import { LOCAL_NAME, loadConfig, textCatalog } from '../../../../data/sources/config.ts';
import type { ReplacedFile } from '../../../../data/sources/config.ts';
import {
    catalogOf,
    type Catalog,
    type CatalogEntry
} from '../../../../data/sources/config/catalog/options.ts';
import { SETTINGS_KEY } from '../../../../data/sources/config/merge/workspace-layer.ts';
import { words } from '../../../core/words.ts';
import { isMachineFile } from '../../../files/workspace/machine-file.ts';
import type { OpenWorkspace } from '../../../files/workspace/open.ts';
import type { Refusal } from '../../yaml/yaml-edit.ts';
import type { ChangeRecord } from '../../../core/changes.ts';

/**
 * The layers a write may land in: the primary hub's folder, none without a primary, and the open
 * workspace file, none for the unsaved workspace.
 */
export type ConfigLayers = { hub?: string; workspace?: string };

/**
 * Where a write of one option lands: the hub's settings file or the workspace file, its path, and
 * the dotted key path in it (`code_theme` in the hub's file, `settings.code_theme` in the
 * workspace file).
 */
export type Place = { layer: 'hub' | 'workspace'; path: string; at: string };

/** What a config write answers with: what it changed, or the one refusal and its reason. */
export type ConfigKeyOutcome = {
    changed: string[];
    refused: Refusal[];
    records?: ChangeRecord[];
};

/** The value a file holds at one option now, and whether the option is still there. */
export type OptionNow = { found: boolean; value: unknown };

/** The layers of a write target: its primary hub and its open workspace file. */
export function layersOf(into: { hub: string | null; workspace?: OpenWorkspace }): ConfigLayers {
    const file = into.workspace?.file ?? null;
    return {
        ...(into.hub === null ? {} : { hub: into.hub }),
        ...(file === null ? {} : { workspace: file })
    };
}

/**
 * The merged configuration over the layers, as the server reads it: oculus's files, the hub's
 * settings file and the workspace file's `settings:`. `instead` reads one file of oculus's folder
 * or the hub's settings file from a given text, and `workspaceText` the workspace file.
 */
export function loadLayers(
    engine: string,
    layers: ConfigLayers,
    replaced: { instead?: ReplacedFile; workspaceText?: string } = {}
): ReturnType<typeof loadConfig> {
    const { workspace } = layers;
    return loadConfig(engine, {
        ...(layers.hub === undefined ? {} : { hub: layers.hub }),
        ...(workspace === undefined
            ? {}
            : {
                  workspace:
                      replaced.workspaceText === undefined
                          ? { file: workspace }
                          : { file: workspace, text: replaced.workspaceText }
              }),
        ...(replaced.instead === undefined ? {} : { instead: replaced.instead })
    });
}

/** The answer of a write refused for one reason, naming the file and key it was asked of. */
export function refusing(file: string, key: string): (reason: string) => ConfigKeyOutcome {
    return (reason) => ({ changed: [], refused: [{ field: `${file}:${key}`, reason }] });
}

/**
 * What a write of one option starts from: the config loaded over the layers, its text catalog, and
 * the refusal that names the file and key.
 */
export function opening(
    engine: string,
    file: string,
    key: string,
    layers: ConfigLayers
): {
    before: ReturnType<typeof loadConfig>;
    text: ReturnType<typeof textCatalog>;
    refuse: (reason: string) => ConfigKeyOutcome;
} {
    const before = loadLayers(engine, layers);
    return { before, text: textCatalog(before.config), refuse: refusing(file, key) };
}

/**
 * The place a write of one option of `file` lands in: the hub's settings file for a key of the hub
 * list of `file`, the workspace file's `settings:` for any other, and null when that layer is not
 * there.
 */
export function placeOf(layers: ConfigLayers, file: string, key: string): Place | null {
    if (hubFileOf(key) === file) {
        return layers.hub === undefined
            ? null
            : { layer: 'hub', path: join(layers.hub, HUB_FILE), at: key };
    }
    return layers.workspace === undefined
        ? null
        : { layer: 'workspace', path: layers.workspace, at: `${SETTINGS_KEY}.${key}` };
}

/**
 * How many leading segments of a place's key path an added key keeps as block maps: the workspace
 * file's `settings:` holds one option a line, the hub's settings file adds a key as oculus's files
 * hold one.
 */
export function blockLevels(place: Place): number {
    return place.layer === 'workspace' ? 1 : 0;
}

/** The sentence a write with no place is refused with: no primary hub, or no workspace file. */
export function placeRefusal(text: Record<string, string>, file: string, key: string): string {
    return hubFileOf(key) === file
        ? words(text, 'server.workspace.no_primary')
        : words(text, 'server.config_key.no_workspace');
}

/**
 * The text of the file at a place. The settings file of a hub that is not there answers null, since
 * a hub without it is a hub that sets nothing; a workspace file that is not there throws, as it is
 * the file the workspace was opened from.
 */
export function placeText(place: Place): string | null {
    try {
        return readFileSync(place.path, 'utf8');
    } catch (error) {
        if (place.layer === 'hub' && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Whether the file at a place is one of the machine's `local.yml` files (a hub's
 * `.oculus/local.yml`), by its device and inode: a link from a settings file to one of them leads
 * to it, and no write lands there.
 */
export function isMachinePlace(place: Place, hubs: readonly string[]): boolean {
    return isMachineFile(
        place.path,
        hubs.map((dir) => ({ dir, hub: true }))
    );
}

/** The folders of every hub of the workspace, whose `.oculus/local.yml` no config write reaches. */
export function machineHubs(into: {
    hub: string | null;
    hubs?: readonly { hub: string }[];
}): string[] {
    return [...(into.hub === null ? [] : [into.hub]), ...(into.hubs ?? []).map((one) => one.hub)];
}

/** Remove a file a write created, and the folders it created above it, innermost first. */
export function removeMade(path: string, made: readonly string[]): void {
    rmSync(path, { force: true });
    for (const folder of made.filter((one) => one !== path).reverse()) {
        try {
            rmdirSync(folder);
        } catch {
            break;
        }
    }
}

/** Whether a text, read as a map, holds nothing at the dotted key path. */
export function absentIn(source: string, key: string): boolean {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return false;
    let node: unknown = doc.contents;
    for (const segment of key.split('.')) {
        if (node === null) return true;
        if (!isYamlMap(node)) return false;
        const pair = node.items.find((item) => isScalar(item.key) && item.key.value === segment);
        if (pair === undefined) return true;
        node = pair.value;
    }
    return false;
}

/**
 * The catalog's entry for one option of one tracked file, or null. The file is compared as the
 * whole string against the catalog's own keys and the key looked up as an own key, so a path, a
 * reserved name and the machine's own file are none of them an option.
 */
export function optionOf(catalog: Catalog, file: string, key: string): CatalogEntry | null {
    if (file === LOCAL_NAME || file !== basename(file)) return null;
    if (!Object.hasOwn(catalog, file)) return null;
    const entries = catalog[file];
    return Object.hasOwn(entries, key) ? entries[key] : null;
}

/**
 * What an undo reads of one option: the text of the file at its place through `read`, given the
 * dotted path there, which answers null for an option the text does not hold in the shape wanted.
 * An option the catalog does not track, a layer that is not there, a file that is gone and text
 * that `read` throws on all answer not found; a file that is there and cannot be read throws. A key
 * the file does not hold, or a hub's settings file that is not there, is a found option with no
 * value (`null`), since the file holds nothing there for a write to have changed.
 */
export function optionNow(
    engine: string,
    layers: ConfigLayers,
    file: string,
    key: string,
    read: (text: string, at: string) => OptionNow | null
): OptionNow {
    const none = { found: false, value: null };
    const place = placeOf(layers, file, key);
    if (place === null) return none;
    let text: string;
    try {
        if (optionOf(catalogOf(loadConfig(engine).config), file, key) === null) return none;
        text = placeText(place) ?? '';
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') throw error;
        return none;
    }
    try {
        const held = read(text, place.at);
        if (held !== null) return held;
        return absentIn(text, place.at) ? { found: true, value: null } : none;
    } catch {
        return none;
    }
}
