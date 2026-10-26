// Layer 2, client state. Which file of the primary hub a view is drawn from: one of the three feeds
// by its kind, the career file, one of the five registry views with a pane of its own, or one
// collection by its key. The registries' and the leads and radar feeds' files are the files of the
// entries of the `collections:` list whose `registry:` names them.
// All of them are read from the merged configuration the config channel carries, so every view that
// offers the file shares one rule and one answer.
//
// It reads the configuration and nothing else. A kind the config names no path for is null, which
// is the view drawing no control rather than a control that opens nothing, and a path that names a
// folder rather than a file is answered as it is written: whether a folder can be opened as one
// file is the view's own question, not this rule's.

import { z } from 'zod';
import { REGISTRY_WORDS, collectionFiles } from '../../data/helpers/hub-names.ts';
import { readAs } from '../../data/shapes/shapes.ts';
import type { CollectionEntry, FeedKind } from '../../data/model/index.ts';

/** One file of the hub, addressed the way the source tab addresses it. */
export type ViewSource = { root: string; path: string };

/**
 * What a view is drawn from: one of the three feeds, one of the five registries, or a collection.
 */
export type ViewSourceKind = FeedKind | 'collection' | 'career' | RegistryKind;

/** The registry views drawn from a file of their own, each by its registry word. */
export type RegistryKind = 'people' | 'venues' | 'datasets' | 'pillars' | 'domains';

/** The kinds whose file the `collections:` list names: the registry views and the YAML feeds. */
type ListedKind = RegistryKind | 'leads' | 'radar';

/** The configuration key the LinkedIn folder's and the career's path is written under. */
const FILE_KEYS: Record<Exclude<ViewSourceKind, 'collection' | ListedKind>, string> = {
    linkedin: 'linkedin_dir',
    career: 'career_file'
};

/** Whether a kind is one whose file the `collections:` list names, by a registry word. */
function isListedKind(kind: ViewSourceKind): kind is ListedKind {
    return (REGISTRY_WORDS as readonly string[]).includes(kind);
}

/** A configured path: a string with something in it once trimmed, answered trimmed. */
const pathShape = z.string().trim().min(1);

/**
 * The `file:` of the first entry of the config's `collections:` list the test takes: the one that
 * carries a key, or the one that names a registry.
 */
function collectionPath(
    config: Record<string, unknown>,
    test: (entry: CollectionEntry) => boolean
): string | null {
    const held = collectionFiles(config.collections).find(test);
    return held === undefined ? null : readAs(pathShape, held.file);
}

/**
 * The file of the primary hub (`primary` is its folder name) one view draws, and null when the
 * configuration names none for it and when the workspace has no primary.
 */
export function viewSourceFile(
    kind: ViewSourceKind,
    config: Record<string, unknown>,
    primary: string | null,
    collection?: string
): ViewSource | null {
    if (primary === null) return null;
    const file =
        kind === 'collection'
            ? collection === undefined
                ? null
                : collectionPath(config, (entry) => entry.key === collection)
            : isListedKind(kind)
              ? collectionPath(config, (entry) => entry.registry === kind)
              : readAs(pathShape, config[FILE_KEYS[kind]]);
    return file === null ? null : { root: primary, path: file };
}
