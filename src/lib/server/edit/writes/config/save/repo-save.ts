// Layer 2, server. The Save of the Repository scope: a repository's `.oculus/settings.yml`, which
// takes one key of the `editor:` block, `editor.languages`, as its top-level `languages:` map
// (data/sources/config/editor-options.ts `parseRepoSettings`). The repository is a folder of the
// open workspace, named by `root`. The change is set or taken out over the file's bytes
// (key-path.ts), so its comments and every other key stay, and the result must read back as the
// file with that key changed and give the repository reader no problem the file did not give; a
// file the save makes is made with its `.oculus` folder. The save is one record of the change log
// holding the map before and after, which its undo writes back as a save of its own.

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parseDocument } from 'yaml';
import { REPO_SETTINGS } from '../../../../../data/helpers/editor/editor.ts';
import { fields } from '../../../../../data/helpers/guards.ts';
import {
    isKeyChange,
    textDigest,
    type SaveChange
} from '../../../../../data/shapes/config-save.ts';
import {
    parseRepoSettings,
    type RepoProblem
} from '../../../../../data/sources/config/editor-options.ts';
import type { ChangeRecord } from '../../../../core/changes.ts';
import { setKeyPath } from '../../../../core/files/yaml/key-path.ts';
import { writeTextAtomic } from '../../../../core/json.ts';
import { words } from '../../../../core/words.ts';
import type { WriteTarget } from '../../../writes.ts';
import { heldText, loadLayers, removeMade, type ConfigKeyOutcome } from '../config-place.ts';

/** The option the file takes, as the defaults file and key a Settings change names it by. */
const FILE = 'behavior.yml';
const OPTION = 'editor.languages';

/** The key of the repository's file the option is written at. */
const KEY = 'languages';

/** The one refusal of a save. */
function refused(reason: string): ConfigKeyOutcome {
    return { changed: [], refused: [{ field: `${FILE}:${OPTION}`, reason }] };
}

/** The names of the problems the repository reader gives with a text, one per key and kind. */
function problemsOf(text: string, config: Record<string, unknown>): Set<string> {
    const read = parseRepoSettings(text, config);
    if (read.kind !== 'read') return new Set([read.kind]);
    return new Set(read.skipped.map((one: RepoProblem) => `${one.key} ${one.where}`));
}

/** The map the file holds at `languages`, or absent; a text that does not parse holds none. */
function heldMap(text: string | null): Record<string, unknown> {
    if (text === null) return {};
    const doc = parseDocument(text);
    if (doc.errors.length > 0) return {};
    const top = fields(doc.toJS());
    return Object.hasOwn(top, KEY) ? { [OPTION]: top[KEY] } : {};
}

/**
 * Write the change of the Repository scope of the folder `root` into its `.oculus/settings.yml`.
 * `digest` is the digest of the text the page read the file as.
 */
export function saveRepo(
    into: WriteTarget,
    root: string | undefined,
    digest: string,
    changes: SaveChange[]
): ConfigKeyOutcome {
    const text = into.config.text;
    const folder = (into.workspace?.folders ?? []).find((one) => one.name === root);
    if (root === undefined || folder === undefined) {
        return refused(words(text, 'server.config_save.no_folder', root ?? ''));
    }
    const change = changes.length === 1 ? changes[0] : null;
    if (change === null || !isKeyChange(change) || change.file !== FILE || change.key !== OPTION) {
        return refused(words(text, 'server.config_save.repo_key'));
    }
    const path = join(folder.dir, REPO_SETTINGS);
    const onDisk = heldText(path);
    if (textDigest(onDisk) !== digest) {
        return refused(words(text, 'server.config_save.changed', path));
    }
    const source = onDisk ?? '';
    const doc = parseDocument(source);
    if (doc.errors.length > 0) {
        const line = doc.errors[0].linePos?.[0].line ?? 1;
        return refused(words(text, 'server.config_save.not_parsed', REPO_SETTINGS, line));
    }
    const edited = setKeyPath(source, [KEY], 'reset' in change ? null : change.value);
    if (edited === null) return refused(words(text, 'server.config_key.not_kept'));
    const after = heldMap(edited);
    const wanted = 'reset' in change ? {} : { [OPTION]: change.value };
    if (!isDeepStrictEqual(after, wanted))
        return refused(words(text, 'server.config_key.not_kept'));
    const config = loadLayers(into.engine, {}).config;
    const held = problemsOf(source, config);
    const added = [...problemsOf(edited, config)].find((one) => !held.has(one));
    if (added !== undefined) {
        return refused(words(text, 'server.config_save.repo_problem', REPO_SETTINGS, added));
    }
    if (edited === source) return { changed: [], refused: [] };
    const made = onDisk === null ? [dirname(path), path] : [];
    if (onDisk === null) mkdirSync(dirname(path), { recursive: true });
    writeTextAtomic(path, edited);
    const record: ChangeRecord = {
        file: path,
        key: 'repo',
        field: root,
        before: heldMap(onDisk),
        after,
        undo: 'field',
        ...(made.length > 0 ? { created: made } : {})
    };
    return { changed: [path], refused: [], records: [record] };
}

/** What the file a Repository save record names holds now at `languages`. */
export function repoNow(change: ChangeRecord): { found: boolean; value: unknown } {
    const text = heldText(change.file);
    return text === null ? { found: false, value: null } : { found: true, value: heldMap(text) };
}

/** Take a Repository save back: the map it replaced written again, or the key taken out. */
export function undoRepo(into: WriteTarget, change: ChangeRecord): ConfigKeyOutcome | null {
    const before = fields(change.before);
    const back: SaveChange = Object.hasOwn(before, OPTION)
        ? { file: FILE, key: OPTION, value: before[OPTION] }
        : { file: FILE, key: OPTION, reset: true };
    const outcome = saveRepo(into, change.field, textDigest(heldText(change.file)), [back]);
    const made = change.created ?? [];
    const left = heldText(change.file);
    if (outcome.changed.length > 0 && made.length > 0 && (left === null || left.trim() === '')) {
        removeMade(change.file, made);
    }
    return outcome;
}
