// Layer 2, client state test. Which frames a message from an app's host reaches
// (hostTargets in lib/state/system/apps/frame/rules.ts): the frames of the app that sent it,
// narrowed to one tab when the message names a tab.
//
// The frames are plain records. What this does NOT cover: the frame's `onHost` call itself
// (bridge.ts) and the server choosing the tab (tests/server/machine/apps/host-manager.test.ts).

import { describe, expect } from 'vitest';
import { hostTargets } from '../../../../src/lib/state/system/apps/frame/rules.ts';
import { it } from '../../../fixtures/scratch.ts';

const frames = [
    { id: 'app:notes', instance: 'tab-1', name: '' },
    { id: 'app:notes', instance: 'tab-2', name: 'panel-notes-1' },
    { id: 'app:other', instance: 'tab-3', name: '' }
];

describe('sends a message from an app host to the frames of that app', () => {
    it('reaches only the named tab when the message names one', () => {
        expect(hostTargets(frames, { app: 'app:notes', tab: 'tab-2' })).toEqual([frames[1]]);
    });

    it('reaches a panel by the id its host gave it', () => {
        expect(hostTargets(frames, { app: 'app:notes', tab: 'panel-notes-1' })).toEqual([
            frames[1]
        ]);
    });

    it('reaches every open tab of the app, and none of another app, when it names none', () => {
        expect(hostTargets(frames, { app: 'app:notes', tab: '' })).toEqual([frames[0], frames[1]]);
    });

    it('reaches nothing when the named tab belongs to another app', () => {
        expect(hostTargets(frames, { app: 'app:notes', tab: 'tab-3' })).toEqual([]);
    });
});
