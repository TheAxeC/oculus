// Layer 2, client state. The choice of a data file's primary key that the finding of a file with
// none offers (server/edit/primary-key.ts): which finding of the Findings view offers it, the
// fields it offers, and the write. A finding offers it when it is about the schema of a collection
// file (`key_none`, `key_two`, `key_beside`) or about the whole of one that has no schema
// (`key_missing`), and the file's cause of no primary key is one a chosen field mends
// (`CHOSEN_KEY_CAUSES`). The fields are `keyChoices` over the file's schema and entries, the same
// answer the server checks the field against.

import {
    CHOSEN_KEY_CAUSES,
    keyChoices,
    type Collection,
    type Finding
} from '../../../data/model/index.ts';
import { bareId } from '../../../data/helpers/hub-names.ts';
import { postForRefusal } from '../../shared/answers/posted.ts';
import type { TokenSource } from '../../shared/stores/token-post.ts';

/** The choice a finding offers: the collection, its hub and the fields it may be keyed by. */
export type KeyChoice = { root: string; collection: string; fields: string[] };

/** The keys a finding of a file's primary key stands on: the schema, or the whole file. */
const KEY_FINDING_KEYS = ['schema', ''];

/**
 * The choice of a primary key a finding offers, or null for a finding that offers none: it is on a
 * collection file of a named hub whose cause of no primary key a chosen field mends, at the schema
 * or the file, and the file holds at least one field it could be keyed by.
 */
function keyChoiceOf(finding: Finding, collections: readonly Collection[]): KeyChoice | null {
    if (!KEY_FINDING_KEYS.includes(finding.key)) return null;
    const held = collections.find((one) => one.file === finding.file);
    const cause = held?.key_fault?.cause;
    if (held?.root === undefined || cause === undefined || !CHOSEN_KEY_CAUSES.includes(cause)) {
        return null;
    }
    if ((cause === 'missing') !== (finding.key === '')) return null;
    const fields = keyChoices(
        held.schema,
        held.entries.map((one) => one.fields)
    );
    return fields.length === 0 ? null : { root: held.root, collection: bareId(held), fields };
}

/**
 * The choices a list of findings offers, by the place of the finding that offers each. A file
 * offers its choice once, on the first of its findings that offers it: a file's schema may carry
 * other findings at the key `schema` (one naming no field to display, after the key's), and the
 * one choice mends the file whichever row draws it.
 */
export function keyChoicesOf(
    findings: readonly Finding[],
    collections: readonly Collection[]
): Map<number, KeyChoice> {
    const offered = new Map<number, KeyChoice>();
    const files = new Set<string>();
    for (const [at, finding] of findings.entries()) {
        if (files.has(finding.file)) continue;
        const choice = keyChoiceOf(finding, collections);
        if (choice === null) continue;
        files.add(finding.file);
        offered.set(at, choice);
    }
    return offered;
}

/** Write the choice; null when it was written, else the sentence of why not. */
export async function writeKeyChoice(
    writes: TokenSource,
    choice: KeyChoice,
    field: string
): Promise<string | null> {
    const body = { root: choice.root, collection: choice.collection, field };
    return postForRefusal('/api/primary-key', body, writes);
}
