// Layer 4, view test. The Code theme menu's items as the builder answers them: From the theme
// first, then Shiki's bundled themes by their own display names, the dark ones and then the light
// ones, each group under a rule, the one in force marked. Menu.svelte draws its items in a portal
// that the unit render never draws while the menu is closed, so the items are tested here as data.
//
// Each case is named an audit, as tests/checks/tree/audits.test.ts requires of a case under
// tests/views that draws nothing; every one still fails under the revert its comment names.
// What this does NOT cover: the menu opened and a pick pressed, which is the look at the landing.

import { bundledThemesInfo } from 'shiki/themes';
import { describe, expect, it } from 'vitest';
import { codeThemeMenu } from '../../../../src/lib/views/system/workbench/code-theme-menu.ts';
import { catalog } from './workbench-fixture.ts';

const t = (key: string): string => catalog[key];

describe('codeThemeMenu', () => {
    // Revert: build the list as `grouped([of(true), of(false), [tokens item]])`; the tokens item
    // then comes last.
    it('audits that the list opens with From the theme, then 44 dark and 21 light themes by display name', () => {
        const items = codeThemeMenu('nord', t);
        expect(items[0]).toMatchObject({ id: 'tokens', label: catalog['ui.code_theme_tokens'] });
        const dark = bundledThemesInfo.filter((info) => info.type === 'dark');
        const light = bundledThemesInfo.filter((info) => info.type === 'light');
        expect(dark).toHaveLength(44);
        expect(light).toHaveLength(21);
        expect(items.slice(1).map((item) => item.label)).toEqual([
            ...dark.map((info) => info.displayName),
            ...light.map((info) => info.displayName)
        ]);
        expect(items.slice(1).map((item) => item.id)).toEqual([
            ...dark.map((info) => info.id),
            ...light.map((info) => info.id)
        ]);
    });

    // Revert: return the items flat (`[tokens item, ...of(true), ...of(false)]`); the rules between
    // the groups are gone.
    it('audits that a rule sits above the dark group and above the light group, none above the first item', () => {
        const items = codeThemeMenu('tokens', t);
        expect(items.filter((item) => item.rule === true).map((item) => item.id)).toEqual([
            bundledThemesInfo.find((info) => info.type === 'dark')?.id,
            bundledThemesInfo.find((info) => info.type === 'light')?.id
        ]);
        expect(items[0].rule).toBeUndefined();
    });

    // Revert: set `active: false` on every item.
    it('audits that the one in force is marked active, and only that one', () => {
        expect(
            codeThemeMenu('nord', t)
                .filter((item) => item.active === true)
                .map((item) => item.id)
        ).toEqual(['nord']);
        expect(
            codeThemeMenu('tokens', t)
                .filter((item) => item.active === true)
                .map((item) => item.id)
        ).toEqual(['tokens']);
    });

    // Revert: add a second tokens item to the list.
    it('audits that every id is unique and none but the first is tokens', () => {
        const ids = codeThemeMenu('tokens', t).map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.filter((id) => id === 'tokens')).toHaveLength(1);
    });
});
