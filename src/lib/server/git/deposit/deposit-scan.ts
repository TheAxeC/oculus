// Layer 2, server. What the deposit's scan objects to in the files a mirror would ship: a name
// that looks like a credential, a file too big for a public repository, and a missing README.md.
// It reads the mirror's staged file list and the sizes on disk and runs no command.

import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { DepositFinding as Finding } from '../../../data/model/index.ts';

/** Names and suffixes that look like a credential, and the size above which a file is flagged. */
const SECRET_HINTS = ['.secrets', '.env', '.netrc', 'id_rsa', 'credentials'];
const SECRET_SUFFIXES = ['.pem', '.key'];
const BIG_FILE_MB = 25;

/** Anything that looks like a credential or is too big to belong in a public repository. */
export function scan(mirror: string, files: string[]): Finding[] {
    const found: Finding[] = [];
    for (const path of files) {
        const low = path.toLowerCase();
        if (SECRET_HINTS.some((hint) => low.includes(hint)) || SECRET_SUFFIXES.some(endsIn(low))) {
            found.push({ kind: 'secret', path, mb: 0 });
        }
        const mb = sizeOf(join(mirror, path)) / 1e6;
        if (mb > BIG_FILE_MB) found.push({ kind: 'large', path, mb: Math.round(mb) });
    }
    if (!files.includes('README.md')) found.push({ kind: 'readme', path: 'README.md', mb: 0 });
    return found;
}

function endsIn(low: string): (suffix: string) => boolean {
    return (suffix) => low.endsWith(suffix);
}

function sizeOf(file: string): number {
    try {
        return statSync(file).size;
    } catch {
        return 0;
    }
}
