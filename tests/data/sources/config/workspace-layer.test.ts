// Layer 1, data tests. The open workspace file's `settings:` laid over oculus's values by
// loadConfig: an option the file sets is the workspace's and `from` names the file; a keyed list
// is merged entry by entry by its key field and a map family by its keys, with `removed: true` and
// `null` taking oculus's entry out; any other value replaces oculus's whole; and every key the
// layer does not apply is a finding naming the workspace file and the key, oculus's value then
// standing. The workspace file is given as text, so no file is read for it.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';

/** A workspace file's path; the text is given, so nothing is read at it. */
const FILE = '/scratch/hub/.oculus/workspaces/main.yml';

/** oculus's own merged values, with no workspace, and the file each came from. */
const { config: OCULUS, from: OCULUS_FROM } = loadConfig(engineDir());

/** The merge of oculus's files and a workspace file holding `settings` as YAML text. */
function withSettings(settings: string) {
    const text = `folders: []\nsettings:\n${settings}`;
    return loadConfig(engineDir(), { workspace: { file: FILE, text } });
}

/** The findings of a merge as `key: message`, each checked to name the workspace file. */
function said(read: ReturnType<typeof withSettings>): string[] {
    for (const one of read.findings) expect(one.file).toBe(FILE);
    return read.findings.map((one) => `${one.key}: ${one.message}`);
}

/** The page keys of a rail. */
function pages(rail: unknown): string[] {
    return (rail as { page: string }[]).map((entry) => entry.page);
}

describe('the workspace layer of loadConfig', () => {
    it('applies an option the file sets and names the file as where it came from', () => {
        const read = withSettings('  code_theme: vscode-dark-2026\n  terminal: { font_px: 14 }\n');
        expect(said(read)).toEqual([]);
        expect(read.config.code_theme).toBe('vscode-dark-2026');
        expect(read.from.code_theme).toBe(FILE);
        const terminal = read.config.terminal as Record<string, unknown>;
        const shipped = OCULUS.terminal as Record<string, unknown>;
        expect(terminal).toEqual({ ...shipped, font_px: 14 });
        expect(read.from['terminal.font_px']).toBe(FILE);
        expect(read.from['terminal.cursor_style']).not.toBe(FILE);
    });

    it("words a hub key, a key no option names and a value its option refuses, and keeps oculus's value", () => {
        const read = withSettings('  wallpaper: { image: x }\n  colour: red\n  code_theme: 3\n');
        expect(said(read)).toEqual([
            "settings.wallpaper.image: wallpaper.image is a key of the hub's settings file, .oculus/config.yml, which a workspace file does not set; it is not applied",
            'settings.colour: colour is not an option; it is not applied',
            expect.stringMatching(
                /^settings\.code_theme: settings\.code_theme must be .*; oculus's value stands$/
            )
        ]);
        expect(read.config.code_theme).toBe(OCULUS.code_theme);
        expect(read.config.wallpaper).toEqual(OCULUS.wallpaper);
        expect(read.config).not.toHaveProperty('colour');
    });

    it("takes the workspace's arrangement of one page and oculus's for every other page", () => {
        const read = withSettings(
            '  arrangements:\n    focus: { root: { kind: pane, view: [notes] } }\n'
        );
        expect(said(read)).toEqual([]);
        const mine = read.config.arrangements as Record<string, unknown>;
        const shipped = OCULUS.arrangements as Record<string, unknown>;
        expect(mine.focus).toEqual({ root: { kind: 'pane', view: ['notes'] } });
        expect(Object.keys(mine)).toEqual(Object.keys(shipped));
        for (const page of Object.keys(shipped).filter((one) => one !== 'focus')) {
            expect(mine[page], page).toEqual(shipped[page]);
        }
        expect(read.from.arrangements).toBe(FILE);
        expect(read.from['arrangements.sessions']).toBe(OCULUS_FROM.arrangements);
    });

    it('replaces only the rail entry of its page, at the head of the rail', () => {
        const read = withSettings('  rail:\n    - { page: help, label: Manual }\n');
        expect(said(read)).toEqual([]);
        const rail = read.config.rail as { page: string; label: string; chord?: string }[];
        const shipped = OCULUS.rail as { page: string }[];
        expect(rail[0]).toEqual({ page: 'help', label: 'Manual' });
        expect(pages(rail)).toEqual(['help', ...pages(shipped).filter((page) => page !== 'help')]);
    });

    it("takes oculus's rail entry out with removed: true", () => {
        const read = withSettings('  rail:\n    - { page: focus, removed: true }\n');
        expect(said(read)).toEqual([]);
        expect(pages(read.config.rail)).toEqual(
            pages(OCULUS.rail).filter((page) => page !== 'focus')
        );
    });

    it("takes oculus's key of a map family out with null and keeps the others", () => {
        const read = withSettings('  usage_tiers:\n    prolite: null\n    team: Team\n');
        expect(said(read)).toEqual([]);
        const shipped = { ...(OCULUS.usage_tiers as Record<string, unknown>) };
        delete shipped.prolite;
        expect(read.config.usage_tiers).toEqual({ ...shipped, team: 'Team' });
    });

    it('replaces a list without a key field whole', () => {
        const read = withSettings('  audit_ignore: [x]\n');
        expect(said(read)).toEqual([]);
        expect(read.config.audit_ignore).toEqual(['x']);
    });

    it("words an entry it cannot apply, and oculus's entry stands", () => {
        const read = withSettings(
            [
                '  rail:',
                '    - { page: focus, removed: yes }',
                '    - { page: nowhere, removed: true }',
                '    - { page: help, label: A }',
                '    - { page: help, label: B }',
                '  usage_tiers:',
                '    nothing: null',
                ''
            ].join('\n')
        );
        expect(said(read)).toEqual([
            "settings.rail: settings.rail names help in more than one entry; none of them is applied and oculus's entry stands",
            "settings.rail: settings.rail takes focus out with a removed that is not true; oculus's entry stands",
            "settings.rail: settings.rail takes nowhere out, which oculus's list does not hold",
            "settings.usage_tiers: settings.usage_tiers sets nothing to null, which oculus's map does not hold"
        ]);
        expect(pages(read.config.rail)).toEqual(pages(OCULUS.rail));
        expect(read.config.usage_tiers).toEqual(OCULUS.usage_tiers);
    });
});
