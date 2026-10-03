// The manifest form's values for the fields the model carries since the project record holds them:
// priority, waiting-on, snooze, the subtasks and the follow-up notes. What the form opens with,
// which fields it may write and what a save posts.
//
// The schema is the real config and the projects are synthetic; what is checked is the rule in
// state/forms/schema.ts. The write itself is tests/server/edit/ and tests/routes/edit/.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';
import {
    NOT_IN_MODEL,
    fieldValues,
    followupWritable,
    manifestPayload,
    refusedEdits,
    writableField
} from '../../../src/lib/state/forms/schema.ts';
import { buildPortfolio, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import type { Followup, Project } from '../../../src/lib/data/model/index.ts';
import { present } from '../../fixtures/present.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);

function project(over: Partial<Project> = {}): Project {
    return fixtureProject({ id: 'alpha', tier: 'manuscripts', title: 'A title', ...over });
}

/** The notes of the glassbox manifest (a map) and of hccnet-fl (a bare note). */
const MAP_NOTE: Followup = { do: 'ask the editor', after: '2026-09-18' };
const BARE_NOTE: Followup = { do: 'Register for FLTA 2026' };

describe('the fields the model carries', () => {
    // A save of these fields reads the project's value on the left of the edit, so a field the
    // form opens empty over a value the manifest holds would be saved as a clear.
    it('opens priority, waiting-on, snooze and the subtasks with the project values', () => {
        const values = fieldValues(
            project({
                priority: 'high',
                waitingOn: ['stephanie'],
                snooze: '2026-11-01',
                subtasks: [
                    { key: '0', do: 'a', done: false },
                    { key: '1', do: 'b', done: true },
                    { key: '2', do: 'c', done: false }
                ]
            })
        );
        expect(values.priority).toBe('high');
        expect(values['waiting-on']).toEqual(['stephanie']);
        expect(values.snooze).toBe('2026-11-01');
        expect(values.subtasks).toBe('a; c');
    });

    it('opens the subtasks of a project with none, and with only done ones, as no text', () => {
        expect(fieldValues(project()).subtasks).toBe('');
        const done = project({ subtasks: [{ key: '0', do: 'a', done: true }] });
        expect(fieldValues(done).subtasks).toBe('');
    });

    it('opens waiting-on as the model reads it when the manifest text holds a bare word, and validate reports it', () => {
        // The text goes through the reader, validate and normalise: the model reads
        // `waiting-on: stephanie` as no list, so the form opens with none, and the finding names
        // the file.
        const hub = plantScratch('oculus-schema-modelled-', {
            'projects/active/alpha/project.yml':
                'id: alpha\ntype: active\ntitle: Alpha\nwaiting-on: stephanie\n'
        });
        const snapshot = buildPortfolio(hub, portfolioConfigFrom(config, engineDir()));
        const alpha = present(snapshot.entities.projects.alpha, 'project alpha');
        expect(alpha.waitingOn).toEqual([]);
        expect(fieldValues(alpha)['waiting-on']).toEqual([]);
        expect(
            snapshot.findings.filter((one) => one.key === 'waiting-on' && one.file.startsWith(hub))
        ).toEqual([
            {
                file: join(hub, 'projects/active/alpha/project.yml'),
                key: 'waiting-on',
                message: 'waiting-on must be a list, not a string'
            }
        ]);
    });
});

describe('the follow-up fields', () => {
    it('opens the fields of a map note with its text and its date, writable', () => {
        const one = project({ followups: [MAP_NOTE] });
        const values = fieldValues(one);
        expect(values['followup.do']).toBe('ask the editor');
        expect(values['followup.after']).toBe('2026-09-18');
        expect(followupWritable(one)).toBe(true);
        expect(writableField(one, 'followup.do')).toBe(true);
        expect(writableField(one, 'followup.after')).toBe(true);
    });

    it('opens a bare note with its text and no date, writable', () => {
        const one = project({ followups: [BARE_NOTE] });
        const values = fieldValues(one);
        expect(values['followup.do']).toBe('Register for FLTA 2026');
        expect(values['followup.after']).toBeUndefined();
        expect(followupWritable(one)).toBe(true);
    });

    it('opens both fields empty for a project with no note, the text writable and the date writable only once the text is typed', () => {
        const one = project();
        const values = fieldValues(one);
        expect(values['followup.do'] ?? '').toBe('');
        expect(values['followup.after'] ?? '').toBe('');
        expect(followupWritable(one)).toBe(true);
        expect(writableField(one, 'followup.do')).toBe(true);
        expect(writableField(one, 'followup.after')).toBe(false);
        expect(writableField(one, 'followup.after', { 'followup.do': '  ' })).toBe(false);
        expect(writableField(one, 'followup.after', { 'followup.do': 'call' })).toBe(true);
        // A project that holds a note takes a date whatever the text box says.
        const held = project({ followups: [BARE_NOTE] });
        expect(writableField(held, 'followup.after', {})).toBe(true);
        expect(NOT_IN_MODEL).not.toContain('followup.do');
        expect(NOT_IN_MODEL).not.toContain('followup.after');
    });

    it('opens the fields of two notes read-only, showing every note', () => {
        const two = project({ followups: [MAP_NOTE, BARE_NOTE] });
        expect(followupWritable(two)).toBe(false);
        expect(writableField(two, 'followup.do')).toBe(false);
        expect(writableField(two, 'followup.after')).toBe(false);
        expect(writableField(two, 'title')).toBe(true);
        const values = fieldValues(two);
        expect(values['followup.do']).toBe('ask the editor; Register for FLTA 2026');
        expect(values['followup.after']).toBe('2026-09-18');
    });

    it('never makes the three fields a write never touches writable', () => {
        for (const field of ['id', 'tier', 'type']) {
            expect(writableField(project(), field)).toBe(false);
        }
    });
});

/** What the editor posts for a project, the edits and the fields among them that differ. */
function posted(one: Project, edits: Record<string, unknown>) {
    const dirty = Object.keys(edits);
    return manifestPayload(one, edits, dirty);
}

describe('what a save posts', () => {
    it('posts each changed field under its name', () => {
        const out = posted(project({ priority: 'low' }), { priority: 'high', next: 'go' });
        expect(out.body).toEqual({ priority: 'high', next: 'go' });
    });

    it('never posts id, tier or type', () => {
        const out = posted(project(), { id: 'other', tier: 'x', type: 'y', title: 'T' });
        expect(out.body).toEqual({ title: 'T' });
    });

    it('leaves out a follow-up edit kept in the draft from before the second note', () => {
        const two = project({ followups: [MAP_NOTE, BARE_NOTE] });
        const out = posted(two, { 'followup.do': 'typed earlier', title: 'T' });
        expect(out.body).toEqual({ title: 'T' });
        expect(out.taken).toEqual({ title: 'T' });
    });

    it('posts the date of the one note, and the text when it is edited', () => {
        const out = posted(project({ followups: [BARE_NOTE] }), {
            'followup.after': '2026-11-01'
        });
        expect(out.body).toEqual({ 'followup.after': '2026-11-01' });
        const both = posted(project({ followups: [MAP_NOTE] }), {
            'followup.do': 'new text',
            'followup.after': ''
        });
        expect(both.body).toEqual({ 'followup.do': 'new text', 'followup.after': '' });
    });

    it('clears the whole follow-up when its text is emptied, the date edit with it', () => {
        for (const note of [BARE_NOTE, MAP_NOTE]) {
            const out = posted(project({ followups: [note] }), {
                'followup.do': '  ',
                'followup.after': '2026-12-01'
            });
            expect(out.body).toEqual({ followup: null });
            // the edits the clear covers count as sent, so the draft drops them with the save
            expect(out.taken).toEqual({
                followup: null,
                'followup.do': '  ',
                'followup.after': '2026-12-01'
            });
        }
    });

    it('writes no date for a project with no note, since a date alone is not a note', () => {
        const out = posted(project(), { 'followup.after': '2026-12-01' });
        expect(out.body).toEqual({});
        const typed = posted(project(), { 'followup.do': 'call', 'followup.after': '2026-12-01' });
        expect(typed.body).toEqual({ 'followup.do': 'call', 'followup.after': '2026-12-01' });
    });
});

describe('the edits a refusal covers', () => {
    it('keeps both follow-up edits when the server refuses the clear of the follow-up', () => {
        expect(refusedEdits(['followup', 'title'])).toEqual([
            'followup',
            'followup.do',
            'followup.after',
            'title'
        ]);
        expect(refusedEdits(['followup.after'])).toEqual(['followup.after']);
    });
});
