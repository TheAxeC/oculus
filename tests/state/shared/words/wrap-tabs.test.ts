// Layer 2, client-state tests. The `wrap_tabs` key of config/appearance.yml: read as false unless
// it is true.

import { beforeEach, describe, expect, it } from 'vitest';
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

    it.each([[1], ['true']])('reads the value %j, which is no boolean, as false', (value) => {
        setAppearance({ wrap_tabs: value });
        expect(wrapTabs()).toBe(false);
    });

    it('is forgotten when a later config holds none', () => {
        setAppearance({ wrap_tabs: true });
        setAppearance({});
        expect(wrapTabs()).toBe(false);
    });
});
