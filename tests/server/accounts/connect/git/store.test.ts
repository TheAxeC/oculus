// Layer 4, server test. A git host's file in the providers' folder (connect/git/store.ts): the
// token a Sign in was granted is kept only in `git-<key>.json` of that folder, at mode 0600 in a
// folder at 0700, with the client id kept beside it; Sign out takes the token, its login and its
// address out and keeps the client id; a file that is not a JSON object is a sentence naming the
// file and never what it held. Every folder is a scratch folder under the system temporary
// directory.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    readGitHost,
    removeGitToken,
    saveGitClientId,
    saveGitToken
} from '../../../../../src/lib/server/accounts/connect/git/store.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

const TOKEN = 'gho_token_of_the_case';
const GRANTED = { token: TOKEN, login: 'reader', address: 'https://github.com' };

/** The permission bits of a path. */
const modeOf = (path: string): number => statSync(path).mode & 0o777;

describe("a git host's file", () => {
    it('keeps the token only in its own file, at 0600 in a folder at 0700, beside the client id (G135)', () => {
        const dir = join(scratchDir('oculus-git-store-'), 'connect');
        saveGitClientId(dir, 'github', 'Iv1.abc');
        saveGitToken(dir, 'github', GRANTED);
        expect(readdirSync(dir)).toEqual(['git-github.json']);
        expect(modeOf(dir)).toBe(0o700);
        expect(modeOf(join(dir, 'git-github.json'))).toBe(0o600);
        expect(readGitHost(dir, 'github')).toEqual({
            clientId: 'Iv1.abc',
            token: TOKEN,
            login: 'reader',
            address: 'https://github.com'
        });
    });

    it('puts a file that was there at a wider mode back to 0600 when it writes it (G135)', () => {
        const dir = scratchDir('oculus-git-store-');
        writeFileSync(join(dir, 'git-github.json'), '{"client_id":"Iv1.abc"}\n', { mode: 0o644 });
        saveGitToken(dir, 'github', GRANTED);
        expect(modeOf(join(dir, 'git-github.json'))).toBe(0o600);
    });

    it('takes the token, its login and its address out on Sign out and keeps the client id (G135)', () => {
        const dir = scratchDir('oculus-git-store-');
        saveGitClientId(dir, 'github', 'Iv1.abc');
        saveGitToken(dir, 'github', GRANTED);
        removeGitToken(dir, 'github');
        expect(readGitHost(dir, 'github')).toEqual({ clientId: 'Iv1.abc' });
        expect(readFileSync(join(dir, 'git-github.json'), 'utf8')).not.toContain(TOKEN);
        removeGitToken(dir, 'gitlab');
        expect(readdirSync(dir)).toEqual(['git-github.json']);
    });

    it('names the file and never what it held when the file is not a JSON object (G135)', () => {
        const dir = scratchDir('oculus-git-store-');
        writeFileSync(join(dir, 'git-github.json'), `token ${TOKEN}`);
        expect(() => readGitHost(dir, 'github')).toThrow(
            `${join(dir, 'git-github.json')} is not JSON`
        );
        let said = '';
        try {
            readGitHost(dir, 'github');
        } catch (error) {
            said = String(error);
        }
        expect(said).not.toContain(TOKEN);
    });
});
