// Layer 2, server tests. Each platform branch names the program its platform has (G85): the shell
// a plain terminal starts when `SHELL` names none (data/places/platform.ts), and the programs the
// packager runs for the app (src/desktop/package.ts), read as data with the platform passed in, so
// both branches are held on any machine and no step is run.

import { describe, expect, it } from 'vitest';
import { fallbackShell } from '../../../src/lib/data/places/platform.ts';
import {
    archiveStep,
    finishSteps,
    iconSteps,
    type AppPlatform
} from '../../../src/desktop/package.ts';

/** Every program the packager runs for one platform, the icon's and the finish's, in order. */
function programs(platform: AppPlatform): string[] {
    const icon = iconSteps(platform, '/co/assets/app-icon.png', '/work');
    const finish = finishSteps(platform, 'arm64', '/work/out/made', '/apps');
    return [...icon.steps, ...finish.steps].map((step) => step.program);
}

describe('each platform branch runs the program its platform has', () => {
    it('starts the environment shell, and with SHELL unset or empty zsh on macOS and bash on Linux', () => {
        expect(fallbackShell('darwin', { SHELL: '/opt/fish' })).toBe('/opt/fish');
        expect(fallbackShell('linux', { SHELL: '/opt/fish' })).toBe('/opt/fish');
        expect(fallbackShell('darwin', {})).toBe('/bin/zsh');
        expect(fallbackShell('darwin', { SHELL: '' })).toBe('/bin/zsh');
        expect(fallbackShell('linux', {})).toBe('/bin/bash');
        expect(fallbackShell('linux', { SHELL: '' })).toBe('/bin/bash');
    });

    it('packages macOS with sips, iconutil, ditto and codesign, and Linux with the PNG and tar alone', () => {
        const mac = programs('darwin');
        expect(new Set(mac)).toEqual(new Set(['sips', 'iconutil', 'ditto', 'codesign']));
        expect(mac.filter((one) => one === 'sips')).toHaveLength(10);
        expect(iconSteps('darwin', '/co/assets/app-icon.png', '/work').icon).toBe(
            '/work/oculus.icns'
        );

        expect(programs('linux')).toEqual(['tar']);
        expect(iconSteps('linux', '/co/assets/app-icon.png', '/work').icon).toBe(
            '/co/assets/app-icon.png'
        );
        const linux = finishSteps('linux', 'arm64', '/work/out/made', '/apps');
        expect(linux.target).toBe('/apps/oculus-linux-arm64');
        expect(linux.steps).toEqual([
            {
                program: 'tar',
                args: [
                    '-czf',
                    '/apps/oculus-linux-arm64.tar.gz',
                    '-C',
                    '/apps',
                    'oculus-linux-arm64'
                ]
            }
        ]);
        expect(archiveStep('darwin', '/r/oculus-0.1.0-darwin-arm64', '/r/a.zip')).toEqual({
            program: 'ditto',
            args: ['-c', '-k', '--keepParent', '/r/oculus-0.1.0-darwin-arm64', '/r/a.zip']
        });
    });
});
