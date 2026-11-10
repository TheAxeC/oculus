// Layer 2, server. A server's `workspace/configuration` request answered: each item by the entry's
// answer for its section, told the language of the document the item names by its `scopeUri`, the
// language of the channel the page opened that document on. The text of each answer is kept by
// section and language, which a change of the shipped settings is compared with (`settingsChange`,
// which held.ts `takeSettingsChange` runs).

import type { ServerEntry, Setup } from '../../servers.ts';
import { isRecord, languageOf } from '../../wire.ts';
import { docKey } from '../doc-key.ts';

/** The documents a server holds, by the key `docKey` gives, with the channel each was opened on. */
type HeldDocs = ReadonlyMap<string, { channel: string }>;

/** One answer given: its section, the language it was given for, and its text. */
type Answered = { section: string; language: string | null; text: string };

/** The answers a server was given, one per section and language. */
export type AnsweredMap = Map<string, Answered>;

/** The key of one section's answer for one language in `AnsweredMap`. */
function answerKey(section: string, language: string | null): string {
    return `${section}\n${language ?? ''}`;
}

/** The language of the document an item names by its `scopeUri`, null for none the server holds. */
function scopeLanguage(item: Record<string, unknown>, docs: HeldDocs): string | null {
    const doc = typeof item.scopeUri === 'string' ? docs.get(docKey(item.scopeUri)) : undefined;
    return doc === undefined ? null : languageOf(doc.channel);
}

/**
 * The answers to the items of a request, in their order: null for an item that names no section
 * and for every item before the server was made ready. Each answer's text is kept in `answered`.
 */
export function configurationAnswers(
    items: unknown,
    entry: ServerEntry,
    setup: Setup | null,
    docs: HeldDocs,
    answered: AnsweredMap
): unknown[] {
    return (Array.isArray(items) ? items : []).map((item: unknown) => {
        if (setup === null || !isRecord(item) || typeof item.section !== 'string') return null;
        const language = scopeLanguage(item, docs);
        const answer = entry.configuration(item.section, setup, language);
        const text = JSON.stringify(answer);
        answered.set(answerKey(item.section, language), { section: item.section, language, text });
        return answer;
    });
}

/**
 * What a change of the shipped settings asks of a server, from the answers it was given: `restart`
 * when an answer of a section the server keeps (`entry.kept`) would now differ, since only a new
 * process asks for it again; `ask` when one of a section it follows (`entry.followed`) would, so it
 * is told to ask again; null when none would. Each changed answer's text is remembered, so the next
 * call for the same settings gives null; a section the server has not asked for is no change.
 */
export function settingsChange(
    entry: ServerEntry,
    setup: Setup,
    answered: AnsweredMap
): 'restart' | 'ask' | null {
    let change: 'restart' | 'ask' | null = null;
    for (const one of answered.values()) {
        const kept = entry.kept?.includes(one.section) === true;
        if (!kept && entry.followed?.includes(one.section) !== true) continue;
        const text = JSON.stringify(entry.configuration(one.section, setup, one.language));
        if (text === one.text) continue;
        one.text = text;
        change = kept ? 'restart' : (change ?? 'ask');
    }
    return change;
}
