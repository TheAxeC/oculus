// Layer 2, server test support for the mail and calendar connectors: a scratch directory of this
// run's own, one account's credential file in it.
//
// Nothing here opens a connection and nothing reads or writes outside the directory the case made,
// which scratchDir makes inside the system temporary directory, and each file written is asserted
// to be inside that directory first.

import { rmSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type { MailAccountConfig } from '../../../../src/lib/data/model/index.ts';
import { credentialFile } from '../../../../src/lib/server/accounts/connect/store.ts';
import { scratchDir } from '../../../fixtures/scratch.ts';

export const GOOGLE: MailAccountConfig = { provider: 'google', label: 'work' };
const REFRESH = 'the-refresh-token-no-payload-may-carry';

const made: string[] = [];

/** Remove every directory the cases made; called from each file's afterEach. */
export function cleanup(): void {
    while (made.length > 0) rmSync(made.pop() ?? '', { recursive: true, force: true });
}

export function scratch(name = 'oculus-mail-'): string {
    const dir = scratchDir(name);
    made.push(dir);
    return dir;
}

/** One account's file, with the refresh token unless the case asks for the client half alone. */
export function writeAccount(
    dir: string,
    account: Parameters<typeof credentialFile>[1],
    connected = true
): string {
    const file = credentialFile(dir, account);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(
        file,
        JSON.stringify({
            client_id: 'an-id',
            client_secret: 'a-secret',
            ...(connected ? { refresh_token: REFRESH } : {})
        })
    );
    return file;
}
