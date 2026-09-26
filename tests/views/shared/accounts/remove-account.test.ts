// The question a Remove on an account row asks: it names the account, and says so when the
// account's own file carries its client id, which is deleted with the file.

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import RemoveAccount from '../../../../src/lib/views/shared/accounts/RemoveAccount.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../../fixtures/doubles.ts';

// The partial reads its words and its glyphs through t(), so both catalogs are the shipped ones.
const shipped = loadConfig(engineDir()).config;
const catalog = textCatalog(shipped);
setCatalog(catalog);
setGlyphs(glyphCatalog(shipped));

/** The question drawn for the account `home`, whose own file does or does not carry its half. */
function ask(ownHalf: boolean): string {
    return render(RemoveAccount, {
        props: { label: 'home', ownHalf, provider: 'Google', onconfirm: noop, oncancel: noop }
    }).body;
}

describe("an account row's Remove question", () => {
    // revert: src/lib/views/shared/accounts/RemoveAccount.svelte:27 => : t('accounts.remove_confirm_own', label)}
    it('says the provider stays set up when the account holds a token alone', () => {
        const body = ask(false);
        expect(body).toContain(catalog['accounts.remove_confirm'].replace('{0}', 'home'));
        expect(body).toContain('Google');
    });

    // revert: src/lib/views/shared/accounts/RemoveAccount.svelte:26 => ? t('accounts.remove_confirm', label)
    it("says the account's own client id is deleted with its file when the file carries one", () => {
        const body = ask(true);
        expect(body).toContain(catalog['accounts.remove_confirm_own'].replace('{0}', 'home'));
        expect(body).toContain('its own client id is deleted with it');
    });
});
