// Layer 2, client-state tests. The two follow-up fields of the manifest editor
// (src/lib/state/forms/schema.ts `fieldValues`) over a project with two notes, which the editor
// shows read-only: each note under its number with its own date, and the date field each date under
// its note's number.
//
// It does not cover the sentence's link opening the tab, which the look does.

import { describe, expect, it } from 'vitest';
import type { Project } from '../../../src/lib/data/model/index.ts';
import { fieldValues } from '../../../src/lib/state/forms/schema.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { TEXT } from '../../server/text.ts';

setCatalog(TEXT);

/** A project holding the follow-up notes given and nothing else the values read. */
function project(followups: Project['followups']): Project {
    const fields: Partial<Project> = {
        id: 'p',
        title: 'P',
        authors: [],
        pillarIds: [],
        domainIds: [],
        fundingIds: [],
        datasetIds: [],
        relatedIds: [],
        results: [],
        ideas: [],
        collaborators: [],
        waitingOn: [],
        subtasks: [],
        followups
    };
    return fields as Project;
}

describe('the follow-up fields', () => {
    it('show each of two notes with its own date', () => {
        const values = fieldValues(
            project([
                { do: 'Present at FLTA 2026' },
                { do: 'Send the camera-ready slides', after: '2026-12-01' }
            ])
        );
        expect([values['followup.do'], values['followup.after']]).toEqual([
            '1. Present at FLTA 2026; 2. Send the camera-ready slides (not until 2026-12-01)',
            '2. 2026-12-01'
        ]);
    });

    it('show one note and its date as they are', () => {
        const values = fieldValues(project([{ do: 'Present', after: '2026-12-01' }]));
        expect([values['followup.do'], values['followup.after']]).toEqual([
            'Present',
            '2026-12-01'
        ]);
    });
});
