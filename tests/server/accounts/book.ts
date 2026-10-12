// Layer 4, test fixture. The account book the connect and mail suites hand a target: both file
// names are one file inside the case's own folder, and a write with no primary hub is refused with
// a fixed sentence.

import { join } from 'node:path';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { noop } from '../../fixtures/doubles.ts';

/** The book over one account file of a folder. */
export function bookIn(dir: string) {
    return {
        file: () => join(dir, 'local.yml'),
        fileOf: () => join(dir, 'local.yml'),
        noPrimary: () => 'the workspace has no primary hub',
        writes: fsWrites(),
        reload: noop
    };
}
