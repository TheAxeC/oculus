// Layer 3, view-partial tests. The mark an app's row carries in the Views catalogue and on its tab
// (registerApps in routes/views.ts): the disabled mark over everything else, then the lock of an
// app that is not approved, then the edit mark of a kept app, and none for an approved one, each
// with the words the mark has.
//
// It does not cover how the mark is drawn.

import { describe, expect } from 'vitest';
import { registerApps } from '../../../../src/routes/views.ts';
import { createClientState } from '../../../fixtures/client.ts';
import { badgeOf } from '../../../../src/lib/state/workbench/navigation/registry.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';
import { installRealText } from '../../shared/real-text.ts';

installRealText();

describe('marks an app by its standing', () => {
    it.each([
        ['disabled', { disabled: true }, 'app_disabled', 'apps.disabled_mark'],
        [
            'disabled and not approved',
            { disabled: true, approved: false },
            'app_disabled',
            'apps.disabled_mark'
        ],
        ['not approved', { approved: false, key: '' }, 'lock', 'apps.unapproved_mark'],
        ['kept approved', { kept: true }, 'edit', 'apps.editing_mark'],
        ['approved', {}, '', null]
    ])('%s', (_name, over, glyph, words) => {
        const client = createClientState();
        registerApps(client.registry, [fixtureApp({ name: 'notes', ...over })]);
        const registration = client.registry.viewFor('app:notes');
        expect(registration).toBeDefined();
        if (registration === undefined) return;
        const badge = badgeOf(registration, client);
        expect(badge.glyph).toBe(glyph);
        if (words !== null) expect(badge.title).toContain(t(words));
    });
});
