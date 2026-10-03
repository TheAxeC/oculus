// Layer 2, client state test. The `wrap_tabs` key of config/appearance.yml: read as false unless it
// is true, installed by the config vocabulary, and described in the options catalog as a toggle
// under Appearance so the Settings view draws it.

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { VOCAB_KEYS } from '../../../../src/lib/data/sources/config/catalogs.ts';
import { setAppearance, wrapTabs } from '../../../../src/lib/state/shared/words/appearance.ts';

beforeEach(() => setAppearance({}));

describe('the wrap_tabs key', () => {
    // Revert: read the key as it stands without the boolean test.
    it('reads as false when the config holds no key', () => {
        setAppearance({});
        expect(wrapTabs()).toBe(false);
    });

    it('reads as true when it is set to true and false when it is set to false', () => {
        setAppearance({ wrap_tabs: true });
        expect(wrapTabs()).toBe(true);
        setAppearance({ wrap_tabs: false });
        expect(wrapTabs()).toBe(false);
    });

    it.each([['yes'], [1], [''], [null], [undefined], ['true'], [['true']]])(
        'reads the value %j, which is no boolean, as false',
        (value) => {
            setAppearance({ wrap_tabs: value });
            expect(wrapTabs()).toBe(false);
        }
    );

    it('is forgotten when a later config holds none', () => {
        setAppearance({ wrap_tabs: true });
        setAppearance({});
        expect(wrapTabs()).toBe(false);
    });

    it('is a key the first config load installs with the other appearance keys', () => {
        expect(VOCAB_KEYS).toContain('wrap_tabs');
    });
});

describe('the wrap_tabs option', () => {
    const { config } = loadConfig(engineDir());

    it('is false in the tracked appearance.yml', () => {
        expect(config.wrap_tabs).toBe(false);
    });

    it('is a toggle under Appearance in the options catalog', () => {
        const entry = catalogOf(config)['appearance.yml'].wrap_tabs;
        expect(entry.control).toBe('toggle');
        expect(entry.section).toBe('Appearance');
        expect(entry.default).toBe(false);
    });
});
