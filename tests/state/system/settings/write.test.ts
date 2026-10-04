// Layer 2, client-state tests. What the Settings view writes and keeps: the value a control's text
// makes, the write sequence of a row over a recorded `writeConfigKey`, how each answer is read, and
// the text typed into a field and the query, which are the tab's instance state beside the rail
// list.
//
// What this does NOT cover: a field pressed or left in a browser, which is the look on landing.

import { describe, expect, it } from 'vitest';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { railDraft, withRailDraft } from '../../../../src/lib/state/workbench/navigation/rail.ts';
import { SETTINGS_MESSAGES } from '../../../../src/lib/state/system/config/messages.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    settingsQuery,
    settingsTyped,
    typedText,
    withSettingsQuery,
    withTypedText
} from '../../../../src/lib/state/system/config/typed.ts';
import { text } from './fixture.ts';
import { createClientState } from '../../../fixtures/client.ts';
import { commit, createRowWriter } from '../../../../src/lib/state/system/config/write.ts';

const ENTRIES = {
    'slurm.poll_min': { description: 'Minutes.', default: 20, control: 'number' },
    'slurm.resource': { description: 'The host.', default: 'utwente', control: 'text' },
    'crt.default': { description: 'The overlay.', default: false, control: 'toggle' },
    'cursor.style': {
        description: 'The cursor.',
        default: 'block',
        control: 'choice',
        values: ['block', 'line']
    }
} as const;

/** The rows of a behavior.yml holding these values. */
function rows(poll: number | string = 20): Record<string, ConfigRow> {
    const result = fileRows(
        'behavior.yml',
        ENTRIES as never,
        text(
            `slurm:\n    poll_min: ${poll}\n    resource: utwente\ncrt:\n    default: false\ncursor:\n    style: block\n`
        )
    );
    return Object.fromEntries(result.rows.map((row) => [row.key, row]));
}

/** A recorded `writeConfigKey`, answering what it is told to. */
function recorder(answer: (call: unknown[]) => Promise<WriteAnswer> | WriteAnswer = ok) {
    const calls: unknown[][] = [];
    return {
        calls,
        write: (file: string, key: string, value: unknown) => {
            calls.push([file, key, value]);
            return Promise.resolve(answer([file, key, value]));
        }
    };
}

function ok(): WriteAnswer {
    return { ok: true, changed: ['behavior.yml:slurm.poll_min'], refused: [] };
}

describe('the value a control text makes', () => {
    it('makes a number from decimal text, and writes -0 as 0', () => {
        const row = rows()['slurm.poll_min'];
        expect(commit(row, '12')).toEqual({ write: true, value: 12 });
        expect(commit(row, ' 12.5 ')).toEqual({ write: true, value: 12.5 });
        expect(commit(row, '-3')).toEqual({ write: true, value: -3 });
        expect(commit(row, '.5')).toEqual({ write: true, value: 0.5 });
        expect(commit(row, '1e3')).toEqual({ write: true, value: 1000 });
        const zero = commit(row, '-0');
        expect(zero.write && Object.is(zero.value, 0)).toBe(true);
    });

    it('writes nothing for text that is not a decimal number, and says so', () => {
        const row = rows()['slurm.poll_min'];
        for (const input of ['0x10', 'Infinity', '1e999']) {
            const made = commit(row, input);
            expect(made.write).toBe(false);
            expect(made.write ? '' : made.said?.key).toBe(SETTINGS_MESSAGES.notNumber);
        }
    });

    it('writes nothing for empty text and says the field is empty', () => {
        const row = rows()['slurm.poll_min'];
        for (const input of ['', '\t']) {
            const made = commit(row, input);
            expect(made.write).toBe(false);
            expect(made.write ? '' : made.said?.key).toBe(SETTINGS_MESSAGES.empty);
        }
    });

    it('takes the text of a text option, the boolean of a toggle and a value of a choice', () => {
        const all = rows();
        expect(commit(all['slurm.resource'], 'cluster')).toEqual({ write: true, value: 'cluster' });
        expect(commit(all['slurm.resource'], '')).toEqual({ write: true, value: '' });
        expect(commit(all['crt.default'], true)).toEqual({ write: true, value: true });
        expect(commit(all['cursor.style'], 'line')).toEqual({ write: true, value: 'line' });
    });

    it('writes nothing for the empty choice or a word the choice does not hold', () => {
        const row = rows()['cursor.style'];
        expect(commit(row, '')).toEqual({ write: false });
        expect(commit(row, 'bar').write).toBe(false);
    });
});

describe('the write of a row', () => {
    it('writes a number once, and a number that is not one never', async () => {
        const sent = recorder();
        const writer = createRowWriter(sent.write, () => undefined);
        const row = rows()['slurm.poll_min'];
        await writer.submit(row, '12');
        expect(sent.calls).toEqual([['behavior.yml', 'slurm.poll_min', 12]]);
        await writer.submit(row, '1x');
        await writer.submit(row, '');
        expect(sent.calls).toHaveLength(1);
        expect(writer.said(row)?.key).toBe(SETTINGS_MESSAGES.empty);
    });

    it('writes nothing for a value equal to the file and to the last value sent', async () => {
        const sent = recorder();
        const writer = createRowWriter(sent.write, () => undefined);
        await writer.submit(rows(20)['slurm.poll_min'], '20');
        expect(sent.calls).toHaveLength(0);
        await writer.submit(rows(20)['slurm.poll_min'], '5');
        expect(sent.calls).toHaveLength(1);
        await writer.submit(rows(5)['slurm.poll_min'], '5');
        expect(sent.calls).toHaveLength(1);
    });

    it('writes a value equal to the file when the last value sent was another', async () => {
        const sent = recorder();
        const writer = createRowWriter(sent.write, () => undefined);
        await writer.submit(rows(20)['slurm.poll_min'], '5');
        await writer.submit(rows(20)['slurm.poll_min'], '20');
        expect(sent.calls.map((call) => call[2])).toEqual([5, 20]);
    });

    it('words a refusal by its reason, a failure by its kind, and says nothing when nothing changed', async () => {
        const row = rows()['slurm.poll_min'];
        const refusing = createRowWriter(
            recorder(() => ({
                ok: true,
                changed: [],
                refused: [{ field: 'behavior.yml:slurm.poll_min', reason: 'must be 1 to 60' }]
            })).write,
            () => undefined
        );
        await refusing.submit(row, '99');
        expect(refusing.said(row)).toEqual({
            key: SETTINGS_MESSAGES.refused,
            args: ['must be 1 to 60']
        });
        expect(refusing.shown(row)).toBeUndefined();

        const kinds: [WriteAnswer, string, (string | number)[]][] = [
            [
                { ok: false, changed: [], refused: [], error: 'unwritable' },
                SETTINGS_MESSAGES.unwritable,
                ['behavior.yml']
            ],
            [
                { ok: false, changed: [], refused: [], error: 'offline', network: true },
                SETTINGS_MESSAGES.network,
                []
            ],
            [
                {
                    ok: false,
                    changed: [],
                    refused: [],
                    error: 'no answer came in time, so the write was given up and may not have landed'
                },
                SETTINGS_MESSAGES.timedOut,
                []
            ],
            [
                { ok: false, changed: [], refused: [], error: 'HTTP 500' },
                SETTINGS_MESSAGES.failed,
                ['HTTP 500']
            ]
        ];
        for (const [answer, key, args] of kinds) {
            const writer = createRowWriter(recorder(() => answer).write, () => undefined);
            await writer.submit(row, '7');
            expect(writer.said(row)).toEqual({ key, args });
        }

        const quiet = createRowWriter(
            recorder(() => ({ ok: true, changed: [], refused: [] })).write,
            () => undefined
        );
        await quiet.submit(row, '7');
        expect(quiet.said(row)).toBeNull();
    });

    it('shows the value sent while the write is out, and holds it until the file moves', async () => {
        let release: (answer: WriteAnswer) => void = () => undefined;
        const writer = createRowWriter(
            () => new Promise<WriteAnswer>((resolve) => (release = resolve)),
            () => undefined
        );
        const row = rows(20)['slurm.poll_min'];
        const pending = writer.submit(row, '5');
        expect(writer.shown(row)).toBe(5);
        release(ok());
        await pending;
        expect(writer.shown(row)).toBe(5);
        // The file's push brings the row to the value sent, and the writer shows the row.
        expect(writer.shown(rows(5)['slurm.poll_min'])).toBeUndefined();
    });

    it('lets the answer of the later write stand when the earlier answers after it', async () => {
        const answers: ((answer: WriteAnswer) => void)[] = [];
        const writer = createRowWriter(
            () => new Promise<WriteAnswer>((resolve) => answers.push(resolve)),
            () => undefined
        );
        const row = rows(20)['slurm.poll_min'];
        const first = writer.submit(row, '5');
        const second = writer.submit(row, '6');
        answers[1]({ ok: true, changed: ['behavior.yml:slurm.poll_min'], refused: [] });
        await second;
        answers[0]({
            ok: true,
            changed: [],
            refused: [{ field: 'behavior.yml:slurm.poll_min', reason: 'too late' }]
        });
        await first;
        expect(writer.shown(row)).toBe(6);
        expect(writer.said(row)).toBeNull();
    });

    it('changes nothing for an answer that arrives after the view is closed', async () => {
        let release: (answer: WriteAnswer) => void = () => undefined;
        let changes = 0;
        const writer = createRowWriter(
            () => new Promise<WriteAnswer>((resolve) => (release = resolve)),
            () => (changes += 1)
        );
        const row = rows(20)['slurm.poll_min'];
        const pending = writer.submit(row, '5');
        const before = changes;
        writer.close();
        release({
            ok: true,
            changed: [],
            refused: [{ field: 'behavior.yml:slurm.poll_min', reason: 'late' }]
        });
        await expect(pending).resolves.toBeUndefined();
        expect(changes).toBe(before);
        expect(writer.said(row)).toBeNull();
    });

    it('writes nothing after the view is closed', async () => {
        const sent = recorder();
        const writer = createRowWriter(sent.write, () => undefined);
        writer.close();
        await writer.submit(rows(20)['slurm.poll_min'], '5');
        expect(sent.calls).toEqual([]);
    });

    it('resets a Modified row by writing its default', async () => {
        const sent = recorder();
        const writer = createRowWriter(sent.write, () => undefined);
        const row = rows(5)['slurm.poll_min'];
        expect(row.modified).toBe(true);
        await writer.reset(row);
        expect(sent.calls).toEqual([['behavior.yml', 'slurm.poll_min', 20]]);
    });

    it('keeps the state of two rows apart, and of a key named like an object member', async () => {
        const reserved = fileRows(
            'behavior.yml',
            { constructor: { description: 'd', default: 1, control: 'number' } } as never,
            text('constructor: 3\n')
        ).rows[0];
        const sent = recorder(() => ({
            ok: true,
            changed: [],
            refused: [{ field: 'behavior.yml:constructor', reason: 'no' }]
        }));
        const writer = createRowWriter(sent.write, () => undefined);
        await writer.submit(reserved, '4');
        expect(writer.said(reserved)?.args).toEqual(['no']);
        expect(writer.said(rows()['slurm.poll_min'])).toBeNull();
    });
});

describe('what the tab keeps', () => {
    it('holds a typed field text and the query beside the rail list, losing none of the three', () => {
        const rail = [{ label: 'Focus', glyph: 'compass', page: 'focus' }];
        let state: unknown = withRailDraft({}, rail);
        state = withSettingsQuery(state, 'poll');
        state = withTypedText(state, 'behavior.yml', 'slurm.poll_min', '1x');
        expect(railDraft(state)).toEqual(rail);
        expect(settingsQuery(state)).toBe('poll');
        expect(typedText(state, 'behavior.yml', 'slurm.poll_min')).toBe('1x');
        // Writing the rail list again leaves the other two.
        state = withRailDraft(state, null);
        expect(settingsQuery(state)).toBe('poll');
        expect(typedText(state, 'behavior.yml', 'slurm.poll_min')).toBe('1x');
    });

    it('replaces a field text it already holds, and takes it away for null', () => {
        let state: unknown = withTypedText({}, 'behavior.yml', 'slurm.poll_min', '1');
        state = withTypedText(state, 'behavior.yml', 'slurm.poll_min', '12');
        expect(typedText(state, 'behavior.yml', 'slurm.poll_min')).toBe('12');
        expect(settingsTyped(state)).toBe(true);
        state = withTypedText(state, 'behavior.yml', 'slurm.poll_min', null);
        expect(typedText(state, 'behavior.yml', 'slurm.poll_min')).toBeUndefined();
        expect(settingsTyped(state)).toBe(false);
    });

    it('keeps a text per file and key, the empty file and key and reserved names included', () => {
        let state: unknown = {};
        state = withTypedText(state, 'behavior.yml', 'a', 'one');
        state = withTypedText(state, 'layout.yml', 'a', 'two');
        state = withTypedText(state, '', '', 'three');
        state = withTypedText(state, 'behavior.yml', '__proto__', 'four');
        state = withTypedText(state, 'behavior.yml', 'constructor', 'five');
        expect(typedText(state, 'behavior.yml', 'a')).toBe('one');
        expect(typedText(state, 'layout.yml', 'a')).toBe('two');
        expect(typedText(state, '', '')).toBe('three');
        expect(typedText(state, 'behavior.yml', '__proto__')).toBe('four');
        expect(typedText(state, 'behavior.yml', 'constructor')).toBe('five');
        expect(typedText(state, 'behavior.yml', 'toString')).toBeUndefined();
    });

    it('survives a round trip through JSON, which is how the ui store saves it', () => {
        const state = withTypedText(withSettingsQuery({}, 'poll'), 'behavior.yml', 'x', '1');
        const back: unknown = JSON.parse(JSON.stringify(state));
        expect(settingsQuery(back)).toBe('poll');
        expect(typedText(back, 'behavior.yml', 'x')).toBe('1');
    });

    it('reads nothing from a state that is not a map, or holds a malformed record', () => {
        for (const state of [
            undefined,
            null,
            'x',
            4,
            [],
            { typed: 'x' },
            { typed: [1, null, {}] }
        ]) {
            expect(settingsQuery(state)).toBe('');
            expect(typedText(state, 'behavior.yml', 'x')).toBeUndefined();
            expect(settingsTyped(state)).toBe(false);
        }
    });

    it('is what the ui store answers for a Settings tab, and for no other view', () => {
        const client = createClientState();
        const settings = client.layout.openView('settings');
        const config = client.layout.openView('config');
        const typed = withTypedText({}, 'behavior.yml', 'slurm.poll_min', '1x');
        client.ui.setInstanceState(settings, typed);
        client.ui.setInstanceState(config, typed);
        expect(client.ui.unsaved(settings)).toBe(true);
        expect(client.ui.unsaved(config)).toBe(false);
        client.ui.setInstanceState(settings, withSettingsQuery({}, 'poll'));
        expect(client.ui.unsaved(settings)).toBe(false);
    });

    it('drops an empty query from the state', () => {
        const state = withSettingsQuery(withSettingsQuery({}, 'poll'), '');
        expect(settingsQuery(state)).toBe('');
        expect(Object.keys(state)).not.toContain('query');
    });

    it('hands on every key of the state it was given, the ones a schema would not copy too', () => {
        const kept = Symbol('kept');
        const withSymbol = { rail: 'draft', [kept]: 1 };
        expect(Object.getOwnPropertySymbols(withSettingsQuery(withSymbol, 'poll'))).toEqual([kept]);
        const withProto: unknown = JSON.parse('{"__proto__":{"a":1},"rail":"draft"}');
        const next = withSettingsQuery(withProto, 'poll');
        expect(Object.hasOwn(next, '__proto__')).toBe(true);
        expect(next.rail).toBe('draft');
        expect(settingsQuery(withSymbol)).toBe('');
        expect(settingsQuery({ ...withSymbol, query: 'poll' })).toBe('poll');
    });
});
