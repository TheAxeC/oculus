// Layer 1, data. Reads one hub file whose top must be a map, for the readers of the registries, the
// collections, the project manifests, the career file and the feed files. Server side only: it
// reads the filesystem and no client module may import it.
//
// The file is read, parsed and tested for a map at its top, and each step that fails raises its
// own finding on the list the caller owns. What the map holds is the caller's to read. A caller
// that must also use the bytes it parsed (the apps' manifest reader hashes them) reads the file
// itself and hands the text to `parseYamlMap`.

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import type { Finding } from '../model/index.ts';
import { mapShape, readAs } from '../shapes/shapes.ts';

/** The first line of an error's message, or the error written out when it is not an Error. */
export function errorLine(error: unknown): string {
    return error instanceof Error ? error.message.split('\n')[0] : String(error);
}

/** Whether a read failed because the file is not there. */
export function isAbsent(error: unknown): boolean {
    return (error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT';
}

/**
 * The map a hub file holds at its top, as it parsed, or null with a finding on `findings` when the
 * file cannot be read, does not parse, or holds anything but a map. `unreadable` words the finding
 * for a file that cannot be read and answers null for a caller that raises none.
 */
export function readYamlMap(
    file: string,
    catalog: TextCatalog,
    findings: Finding[],
    unreadable: (error: unknown) => string | null
): Record<string, unknown> | null {
    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch (error) {
        const message = unreadable(error);
        if (message !== null) findings.push({ file, key: '', message });
        return null;
    }
    return parseYamlMap(file, text, catalog, findings);
}

/**
 * The map the text of a hub file holds at its top, as it parsed, or null with a finding on
 * `findings` when it does not parse or holds anything but a map. `file` names the file the text
 * was read from.
 */
export function parseYamlMap(
    file: string,
    text: string,
    catalog: TextCatalog,
    findings: Finding[]
): Record<string, unknown> | null {
    let parsed: unknown;
    try {
        parsed = parse(text);
    } catch (error) {
        const message = findingText(catalog, 'findings.file.does_not_parse', errorLine(error));
        findings.push({ file, key: '', message });
        return null;
    }
    const map = readAs(mapShape, parsed);
    if (map === null) {
        findings.push({ file, key: '', message: findingText(catalog, 'findings.file.not_a_map') });
    }
    return map;
}
