// Layer 2, client-state tests. The line a card draws about its disabled controls, and the refusal
// to place an entry in a file's text, for a file with no primary key: each names the cause the
// snapshot carries (`Collection.key_fault`) with what takes it away. The source store is a stub
// that hands one draft and records no edit, since no entry is placed.

import { describe, expect, it } from 'vitest';
import type { KeyFault } from '../../../../src/lib/data/model/model-collections.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { identityFaults, type Entry } from '../../../../src/lib/state/boards/collection/index.ts';
import {
    noPrimaryKeyLine,
    placeEntry
} from '../../../../src/lib/state/sessions/source/draft-entry.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const CAUSES: [KeyFault, string][] = [
    [{ cause: 'none' }, t('collection.no_primary_key_none', 'people.yml')],
    [
        { cause: 'two', fields: ['key', 'name'] },
        t('collection.no_primary_key_two', 'people.yml', 'key, name')
    ],
    [
        { cause: 'unkeyed', field: 'role', type: 'tags' },
        t('collection.no_primary_key_unkeyed', 'people.yml', 'role', 'tags')
    ],
    [
        { cause: 'beside', named: 'key', field: 'key' },
        t('collection.no_primary_key_beside', 'people.yml', 'key', 'key')
    ],
    [{ cause: 'missing' }, t('collection.no_primary_key_missing', 'people.yml')],
    [{ cause: 'unread' }, t('collection.no_primary_key_unread', 'people.yml')],
    [{ cause: 'none', named: 'key' }, t('collection.no_primary_key_named', 'people.yml', 'key')]
];

describe('a file with no primary key', () => {
    it('words each cause by its own line', () => {
        for (const [fault, line] of CAUSES) {
            expect(noPrimaryKeyLine('people.yml', fault)).toBe(line);
        }
    });

    it('gives every entry the unkeyed fault with the cause of its file', () => {
        const entry: Entry = {
            id: 'ada',
            title: 'Ada',
            fields: {},
            file: '/hub/people.yml',
            index: 0
        };
        const faults = identityFaults([entry], null, { cause: 'missing' });
        expect(faults.get(0)).toEqual({
            kind: 'unkeyed',
            field: '',
            value: '',
            own: true,
            cause: { cause: 'missing' }
        });
    });

    it.each(CAUSES)('refuses to place an entry in the text of a file with %o', (fault, line) => {
        const draft = {
            text: 'people:\n  - name: Ada\n',
            file: 'hub/.oculus/data/people/people.yml',
            readonly: false,
            truncated: false,
            notText: false,
            disk: 'same'
        };
        const source = {
            sourceDraft: () => draft,
            editSourceDraft: () => undefined
        } as unknown as Parameters<typeof placeEntry>[0];
        const answer = placeEntry(source, 'tab', undefined, { key_fault: fault });
        expect(answer).toEqual({ ok: false, sentence: line, line: 1 });
    });
});
