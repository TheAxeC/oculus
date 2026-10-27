// Layer 2, server. One option of oculus's defaults files set to a value: the Settings view's write
// for a toggle, a number, a text, a choice, a glyph, a hue, a colour, a folder, a file or a path,
// and the write every control of the shell that sets an option sends.
//
// The value lands where config-place.ts places the key: a key of the hub list in the settings file
// of the hub whose layers config-write.ts hands it, the primary's unless the write names another
// hub, any other in the `settings:` map of the open workspace file; oculus's own files are never
// written. When the file holds the key as a plain or quoted value, the edit is over the bytes
// through yaml-edit.ts's `replaceValue`, so the key's own line keeps its comment, its quote style,
// its line end and every other byte of the file. When it does not hold the key, the write adds it
// (config-checks.ts `insertKey`), creating the primary's settings file and its folder when they
// are not there (another hub's is there, or the write names no hub of that name), and the undo
// takes the added text out and removes what the write made (`takeOutAdded`).
//
// The options files (config/options/) decide what may be written: the file must be one of their
// defaults files, the key one of their entries, the entry a single value with a control, and the
// value one that control takes (config-fit.ts). The machine's own file, a hub's `.oculus/local.yml`
// or a link to one, is refused before the file is read, but for the user's key `self` of the
// primary hub's file (`writeSelf`): its value is checked against the people whose key resolves to
// them from the primary (config-sources.ts), and it is written over the bytes as any key is, the
// file made at mode 600 when it is not there and named in the hub's `.oculus/.gitignore`, so it
// stays out of git. A refusal of it names the cause: a sentence of `server.config_key`, which
// quotes no text of the file, or for an edit that would leave a key the machine does not read, the
// sentence `checkLocal` gives for that key, which may name a label the file holds. The checks that
// stand between the edited text and the file are config-checks.ts's, which config-value.ts runs as
// well.
//
// The function is synchronous from the read of the file to its write, which is what lets two
// writes made at once both land: each reads the file the other has already written.

import { dirname, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isAlias, isMap as isYamlMap, isScalar, parseDocument } from 'yaml';
import type { Scalar } from 'yaml';
import { LOCAL_NAME, localFile } from '../../../../data/sources/config.ts';
import { readLocalText } from '../../../../data/sources/config/local.ts';
import type { ReplacedText } from '../../../core/changes.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import { readBack } from '../../list-edit.ts';
import { catalogOf, type CatalogEntry } from '../../../../data/sources/config/catalog/options.ts';
import { words } from '../../../core/words.ts';
import { replaceValue } from '../../yaml/yaml-edit.ts';
import { REFUSALS, why } from '../../yaml/why.ts';
import type { Why } from '../../yaml/why.ts';
import { isCollection, leafProblem } from './config-fit.ts';
import { sourcesFor, type SourceInputs } from './config-sources.ts';
import {
    cutTopPair,
    insertKey,
    kept,
    localProblemAdded,
    mergedAt,
    refusedBy,
    replacedText,
    withoutKey,
    written
} from './config-checks.ts';
import {
    absentIn,
    blockLevels,
    heldText,
    isMachinePlace,
    isUserKey,
    opening,
    optionNow,
    optionOf,
    placeOf,
    placeRefusal,
    placeText,
    refusing,
    type ConfigKeyOutcome,
    type ConfigLayers,
    type OptionNow
} from './config-place.ts';

export type { ConfigKeyOutcome };

/** Where the key's value sits in a file's text. */
type Found = { kind: 'unparsed' } | { kind: 'missing' } | { kind: 'found'; node: Scalar };

/** The scalar styles a value may be written over: a plain or a quoted one. */
const STYLES = ['PLAIN', 'QUOTE_DOUBLE', 'QUOTE_SINGLE'];

/**
 * The scalar a dotted key path names in a text. Each segment is a string key of a map, so a key
 * that holds a dot, a key that is not a string, an alias, an anchored or tagged node, a block
 * scalar and an empty or null value all answer `missing`: the write would be a guess there.
 */
function locate(source: string, key: string): Found {
    const doc = parseDocument(source);
    if (doc.errors.length > 0) return { kind: 'unparsed' };
    let node: unknown = doc.contents;
    for (const segment of key.split('.')) {
        if (!isYamlMap(node)) return { kind: 'missing' };
        const pair = node.items.find((item) => isScalar(item.key) && item.key.value === segment);
        node = pair?.value;
    }
    if (!isScalar(node) || isAlias(node)) return { kind: 'missing' };
    const valued = node.value !== null && node.value !== undefined;
    const bare = node.anchor === undefined && node.tag === undefined;
    if (!valued || !bare || !STYLES.includes(String(node.type))) return { kind: 'missing' };
    return { kind: 'found', node };
}

/** Whether an entry is one value with a control, which is what is set one key at a time. */
function single(entry: CatalogEntry): boolean {
    return entry.control !== undefined && !isCollection(entry);
}

/**
 * The value the file at the option's place holds now, and whether the option is still there: the
 * option is one the options files name, the file parses, and it holds the key as a plain or quoted
 * value. An undo reads it; a file it may not read throws.
 */
export function configKeyNow(
    engine: string,
    layers: ConfigLayers,
    file: string,
    key: string
): OptionNow {
    return optionNow(engine, layers, file, key, (text, at) => {
        const found = locate(text, at);
        return found.kind === 'found' ? { found: true, value: found.node.value } : null;
    });
}

/**
 * Set one option of a defaults file at its place over the layers. A refusal answers the one reason
 * and writes nothing; a value equal to the one held writes nothing and answers with nothing
 * changed, unless `copy` asks for the key the file does not hold to be added with that value, which
 * is how Edit in a file shows a key at its line. Given `inputs`, the value is checked against the
 * entry and the lists the server holds (config-fit.ts); without them, as in an undo, no value is
 * checked and the file is put back as it was. A file that cannot be read or written throws, which
 * the route answers as `unwritable`.
 */
export function writeConfigKey(
    engine: string,
    file: string,
    key: string,
    value: unknown,
    layers: ConfigLayers,
    inputs?: SourceInputs,
    hubs: readonly string[] = [],
    copy = false
): ConfigKeyOutcome {
    const { before, text, refuse } = opening(engine, file, key, layers);
    if (file === LOCAL_NAME && !isUserKey(file, key)) {
        return refuse(words(text, 'server.config_key.local'));
    }
    const entry = optionOf(catalogOf(before.config), file, key);
    if (entry === null) return refuse(words(text, 'server.config_key.no_entry'));
    if (!single(entry)) return refuse(words(text, 'server.config_key.not_single'));
    const place = placeOf(layers, file, key);
    if (place === null) return refuse(placeRefusal(text, file, key));
    const wanted = Object.is(value, -0) ? 0 : value;
    if (place.layer === 'local' && layers.hub !== undefined) {
        const sources = inputs === undefined ? null : sourcesFor(inputs, before.config);
        const unfit = leafProblem(entry, selfHeld(place.path), wanted, { text, sources });
        if (unfit !== null) return refuse(unfit);
        if (typeof wanted !== 'string') return refuse(words(text, 'server.config_key.not_text'));
        return selfOutcome(file, key, writeSelf(layers.hub, wanted, copy), text);
    }

    if (isMachinePlace(place, hubs)) return refuse(words(text, 'server.config_key.local'));
    const onDisk = placeText(place);
    const source = onDisk ?? '';
    const found = locate(source, place.at);
    if (found.kind === 'unparsed') return refuse(words(text, 'server.config_key.not_parsed'));
    const adding = found.kind === 'missing' && (onDisk === null || absentIn(source, place.at));
    if (found.kind === 'missing' && !adding) {
        return refuse(words(text, 'server.config_key.not_in_file'));
    }
    const held = found.kind === 'found' ? found.node.value : mergedAt(before.config, key);
    const sources = inputs === undefined ? null : sourcesFor(inputs, before.config);
    const unfit = leafProblem(entry, held, wanted, { text, sources });
    if (unfit !== null) return refuse(unfit);
    if (isDeepStrictEqual(held, wanted) && !(copy && adding)) return { changed: [], refused: [] };

    const scalar = wanted as string | number | boolean;
    let edited: { text: string } | { why: Why };
    if (found.kind === 'found') {
        edited = replaceValue(source, found.node, scalar);
        // A plain string that would not read back (inside a flow map, a comma or a brace ends it)
        // is written double-quoted, the one style that holds any string on one line.
        if (
            'text' in edited &&
            !kept(source, edited.text, place.at, wanted) &&
            typeof wanted === 'string'
        ) {
            edited = replaceValue(source, found.node, scalar, 'QUOTE_DOUBLE');
        }
    } else {
        const inserted = insertKey(source, place.at, wanted, blockLevels(place));
        edited = inserted === null ? { why: why(REFUSALS.keyNoPlace) } : { text: inserted };
    }
    if (!('text' in edited) || !kept(source, edited.text, place.at, wanted)) {
        return refuse(words(text, 'server.config_key.not_kept'));
    }
    const reason = refusedBy(engine, layers, place, edited.text, before);
    if (reason !== null) return refuse(reason);

    return written(
        place.path,
        file,
        key,
        edited.text,
        { before: held, after: wanted },
        adding ? source : undefined,
        adding
    );
}

/**
 * Why a write of the user's key was refused: a sentence of `server.config_key` each, or for an edit
 * that would leave a key the machine does not read, the reader's sentence naming that key.
 */
type SelfRefusal =
    | { refused: 'not_parsed' | 'not_in_file' | 'not_kept' }
    | { refused: 'local_check'; reason: string };

/**
 * A write of the user's key done: the file, the value it held at `self` before (the empty text for
 * none) and after (null for a key taken out), the text the edit replaced, and the file when the
 * write made it (none for an edit in place, the empty list for a key added to a file that was
 * there).
 */
type SelfWritten = {
    path: string;
    before: unknown;
    after: string | null;
    replaced: ReplacedText | null;
    created?: string[];
};

/**
 * The value `self` holds in a `local.yml` now, the empty text for none or a file that is not there.
 */
function selfHeld(path: string): unknown {
    const text = heldText(path) ?? '';
    const found = locate(text, 'self');
    return found.kind === 'found' ? found.node.value : '';
}

/** The line a hub's `.oculus/.gitignore` names the machine's own file with. */
const IGNORED = LOCAL_NAME;

/**
 * Name `local.yml` in the `.gitignore` of the folder that holds it: the file made with that one
 * line when it is not there, the line added when the file does not name it, and nothing written
 * when a line of it does.
 */
function ignoreLocal(folder: string): void {
    const path = join(folder, '.gitignore');
    const held = heldText(path);
    if (held === null) {
        writeTextAtomic(path, `${IGNORED}\n`);
        return;
    }
    if (held.split(/\r?\n/).some((line) => line.trim() === IGNORED)) return;
    const lead = held === '' || held.endsWith('\n') ? held : `${held}\n`;
    writeTextAtomic(path, `${lead}${IGNORED}\n`);
}

/**
 * The edited text of a `local.yml` with `self` set to `key`, or taken out for null: over the bytes
 * of its value when the file holds it as a plain or quoted value, added at the end when it holds
 * no `self`, and its lines cut for a removal. Null when there is nothing to change, unless `copy`
 * asks for a key the file does not hold to be added with the value it equals.
 */
function selfEdit(
    source: string,
    key: string | null,
    copy: boolean
): { edited: string; before: unknown } | SelfRefusal | null {
    const doc = parseDocument(source);
    if (doc.errors.length > 0 || (doc.contents !== null && !isYamlMap(doc.contents))) {
        return { refused: 'not_parsed' };
    }
    const absent = absentIn(source, 'self');
    if (key === null) {
        if (absent) return null;
        const pair = isYamlMap(doc.contents)
            ? doc.contents.items.find((item) => isScalar(item.key) && item.key.value === 'self')
            : undefined;
        const edited = pair === undefined ? null : cutTopPair(source, pair);
        const back = edited === null ? null : readBack(source, edited);
        if (edited === null || back === null) return { refused: 'not_kept' };
        if (!isDeepStrictEqual(back.after, withoutKey(back.before, 'self', false))) {
            return { refused: 'not_kept' };
        }
        return { edited, before: back.before.self };
    }
    const found = locate(source, 'self');
    if (found.kind === 'missing' && !absent) return { refused: 'not_in_file' };
    const before = found.kind === 'found' ? found.node.value : '';
    if (before === key && !(copy && absent)) return null;
    let edited: string | null;
    if (found.kind === 'found') {
        const plain = replaceValue(source, found.node, key);
        edited = 'text' in plain ? plain.text : null;
        if (edited === null || !kept(source, edited, 'self', key)) {
            const quoted = replaceValue(source, found.node, key, 'QUOTE_DOUBLE');
            edited = 'text' in quoted ? quoted.text : null;
        }
    } else {
        edited = insertKey(source, 'self', key, 0);
    }
    if (edited === null || !kept(source, edited, 'self', key)) return { refused: 'not_kept' };
    return { edited, before };
}

/**
 * Set the user's key `self` in the `local.yml` of the hub at `hub` to `key`, or take it out for
 * null, and keep every other byte: the edit must read back as the file with that one key changed,
 * the machine's reader must read the key back as `key` (the empty text once it is out) and give no
 * problem the file did not give, and only then is the file written, keeping its mode. A file that
 * is not there is made at mode 600 and named in the hub's `.oculus/.gitignore`. A refusal names
 * its cause, and for a problem the edit adds carries the reader's sentence naming that key; null is
 * a write with nothing to change. The value is not checked against the people: the caller does that
 * (`writeConfigKey`). A file that cannot be read or written throws.
 */
export function writeSelf(
    hub: string,
    key: string | null,
    copy = false
): SelfWritten | SelfRefusal | null {
    const path = localFile(hub);
    const onDisk = heldText(path);
    const source = onDisk ?? '';
    const edit = selfEdit(source, key, copy);
    if (edit === null || 'refused' in edit) return edit;
    const { edited } = edit;
    if (readLocalText(edited, hub).config.self !== (key ?? '')) return { refused: 'not_kept' };
    const problem = localProblemAdded(source, edited);
    if (problem !== null) return { refused: 'local_check', reason: problem };
    writeTextAtomic(path, edited, 0o600);
    if (onDisk === null) ignoreLocal(dirname(path));
    const added = key !== null && absentIn(source, 'self');
    return {
        path,
        before: edit.before,
        after: key,
        replaced: replacedText(source, edited),
        ...(added ? { created: onDisk === null ? [path] : [] } : {})
    };
}

/** The sentence of a refusal of a write of the user's key. */
function selfRefusal(refusal: SelfRefusal, text: Record<string, string>): string {
    switch (refusal.refused) {
        case 'not_parsed':
            return words(text, 'server.config_key.not_parsed');
        case 'not_in_file':
            return words(text, 'server.config_key.not_in_file');
        case 'not_kept':
            return words(text, 'server.config_key.not_kept');
        case 'local_check':
            return refusal.reason;
    }
}

/** The answer of a write of the user's key, as every config write answers. */
function selfOutcome(
    file: string,
    key: string,
    done: ReturnType<typeof writeSelf>,
    text: Record<string, string>
): ConfigKeyOutcome {
    if (done === null) return { changed: [], refused: [] };
    if ('refused' in done) {
        return refusing(file, key)(selfRefusal(done, text));
    }
    return {
        changed: [`${file}:${key}`],
        refused: [],
        records: [
            {
                file: done.path,
                key: file,
                field: key,
                before: done.before,
                after: done.after,
                undo: 'field',
                ...(done.replaced === null ? {} : { replaced: done.replaced }),
                ...(done.created === undefined ? {} : { created: done.created })
            }
        ]
    };
}

/**
 * Take the user's key out of the primary's `local.yml` for a Reset: the answer as every config
 * write answers, with nothing changed for a file that holds no `self`.
 */
export function resetSelf(
    file: string,
    key: string,
    hub: string,
    text: Record<string, string>
): ConfigKeyOutcome {
    return selfOutcome(file, key, writeSelf(hub, null), text);
}
