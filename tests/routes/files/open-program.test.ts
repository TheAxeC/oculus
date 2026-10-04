// Layer 2, route tests. The floor under macOS `open`, read as a rule and never run: nothing here
// runs `open`.

import { describe, expect } from 'vitest';
import { openArgs } from '../../../src/lib/server/files/open.ts';
import { it } from '../../fixtures/scratch.ts';

describe('what macOS open is run with and the floor under it', () => {
    // The rule and the argument list are read here, never macOpenPath itself: a call that passed
    // would launch an application.
    it('names the application for a file and reveals a folder, the path last', () => {
        expect(
            openArgs({ kind: 'file', path: '/hub/report.docx', app: 'com.microsoft.Word' })
        ).toEqual(['-b', 'com.microsoft.Word', '/hub/report.docx']);
        expect(openArgs({ kind: 'folder', path: '/hub/projects' })).toEqual([
            '-R',
            '/hub/projects'
        ]);
    });
});
