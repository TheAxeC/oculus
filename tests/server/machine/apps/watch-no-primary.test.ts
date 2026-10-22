// Layer 2, server tests. The apps watcher over a workspace with no primary hub: it has no machine
// apps folder, reads the folders of the workspace without error, publishes the apps of none, and
// follows a move of the workspace to one that has a primary, whose `.oculus/apps` is then the
// machine's apps folder. The approvals file, the record of the disabled apps and the stores are
// scratch files, and the clock is the case's own.
//
// What this does NOT cover: the apps found in a folder (tests/server/machine/apps/).
// @module-tag slow: each case reads a whole config and a workspace, 0.7 s to 2.4 s alone.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, localDefaults } from '../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { watchApps } from '../../../../src/lib/server/root/watch/apps.ts';
import { manualClock } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { plantHub, workspaceWith } from '../../../fixtures/hubs/workspace.ts';

describe('the apps watcher with no primary hub', () => {
    it('has no apps folder and holds no app, and reads again without error', () => {
        const base = scratchDir('oculus-apps-no-primary-');
        const notes = join(base, 'notes');
        mkdirSync(notes);
        const workspace = workspaceWith([{ name: 'notes', dir: notes }]);
        expect(workspace.open().primary).toBeNull();
        const watcher = watchApps(new Hub(), {
            engine: engineDir(),
            secret: 'a secret',
            local: () => ({
                ...localDefaults(),
                approvals: join(base, 'approvals.json')
            }),
            config: () => loadConfig(engineDir()).config,
            from: () => loadConfig(engineDir()).from,
            open: () => workspace.open(),
            appData: join(base, 'app-data'),
            home: base,
            stateFile: join(base, 'apps.json'),
            clock: manualClock()
        });
        try {
            expect(watcher.folder()).toBeNull();
            expect(watcher.held().apps).toEqual([]);
            expect(() => {
                watcher.reread();
                watcher.follow();
            }).not.toThrow();
            expect(watcher.folder()).toBeNull();
            expect(watcher.held().apps).toEqual([]);
        } finally {
            watcher.close();
        }
    });

    it('takes the primary hub .oculus/apps as the machine apps folder once the workspace has one', () => {
        const base = scratchDir('oculus-apps-primary-');
        const hub = plantHub(join(base, 'lab'));
        mkdirSync(join(hub, '.oculus', 'apps'), { recursive: true });
        const workspace = workspaceWith([{ name: 'lab', dir: hub }], 'lab');
        const watcher = watchApps(new Hub(), {
            engine: engineDir(),
            secret: 'a secret',
            local: () => ({ ...localDefaults(), approvals: join(base, 'approvals.json') }),
            config: () => loadConfig(engineDir()).config,
            from: () => loadConfig(engineDir()).from,
            open: () => workspace.open(),
            appData: join(base, 'app-data'),
            home: base,
            stateFile: join(base, 'apps.json'),
            clock: manualClock()
        });
        try {
            expect(watcher.folder()).toBe(join(hub, '.oculus', 'apps'));
        } finally {
            watcher.close();
        }
    });
});
