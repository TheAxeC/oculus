// loadLocal and loadConfig against synthetic files in a temporary directory.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PORT, engineDir, loadConfig, loadLocal } from '../src/lib/data/sources/config.ts';

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-config-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

function writeLocal(dir: string, body: string): void {
    const file = join(dir, 'local.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, body);
}

/** Write one file into <engine>/config, creating the directory the first time. */
function writeConfig(engine: string, name: string, body: string): string {
    const dir = join(engine, 'config');
    const file = join(dir, name);
    expect(resolve(file).startsWith(resolve(engine) + sep)).toBe(true);
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, body);
    return file;
}

describe('loadLocal', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('falls back to the defaults when there is no file', () => {
        const dir = scratch();
        expect(loadLocal(dir)).toEqual({ hub: resolve(dir, '..', '..'), port: DEFAULT_PORT });
        expect(warn).not.toHaveBeenCalled();
    });

    it('takes both keys from the file', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\nport: 8791\n');
        expect(loadLocal(dir)).toEqual({ hub: '/srv/research-hub', port: 8791 });
    });

    it('reports an unknown key once and ignores it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\ncolour: teal\n');
        expect(loadLocal(dir)).toEqual({ hub: '/srv/research-hub', port: DEFAULT_PORT });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain('colour');
    });

    it('refuses a port that is not an integer', () => {
        const dir = scratch();
        writeLocal(dir, 'port: eight\n');
        expect(() => loadLocal(dir)).toThrow(/port must be an integer/);
    });

    it('takes the two session paths when the machine names them', () => {
        const dir = scratch();
        writeLocal(
            dir,
            'hub: /srv/research-hub\nsessions_cache: /srv/state/cache.json\nsessions_overrides: state/sessions.json\n'
        );
        expect(loadLocal(dir)).toEqual({
            hub: '/srv/research-hub',
            port: DEFAULT_PORT,
            sessionsCache: '/srv/state/cache.json',
            sessionsOverrides: join(dir, 'state', 'sessions.json')
        });
        expect(warn).not.toHaveBeenCalled();
    });

    it('refuses a session path that is not a path', () => {
        const dir = scratch();
        writeLocal(dir, 'sessions_cache: 17\n');
        expect(() => loadLocal(dir)).toThrow(/sessions_cache must be a path/);
    });
});

describe('loadConfig', () => {
    it('merges the top-level keys of every file in name order', () => {
        const engine = scratch();
        writeConfig(engine, 'behavior.yml', 'stale_days: 30\nread_limits: { lines: 400 }\n');
        writeConfig(engine, 'vocab.yml', 'palette: [teal, amber]\n');
        // Not a .yml file, so it is not merged.
        writeConfig(engine, 'notes.md', 'palette: ignored\n');

        const { config, findings } = loadConfig(engine);
        expect(Object.keys(config).sort()).toEqual(['palette', 'read_limits', 'stale_days']);
        expect(config.stale_days).toBe(30);
        expect(config.read_limits).toEqual({ lines: 400 });
        expect(config.palette).toEqual(['teal', 'amber']);
        expect(findings).toEqual([]);
    });

    it('reports a top-level key two files define and takes the value from the later one', () => {
        const engine = scratch();
        writeConfig(engine, 'a-first.yml', 'palette: [teal]\nonly_here: 1\n');
        const later = writeConfig(engine, 'b-later.yml', 'palette: [amber]\n');

        const { config, findings } = loadConfig(engine);
        expect(config.palette).toEqual(['amber']);
        expect(config.only_here).toBe(1);
        expect(findings).toEqual([
            {
                file: later,
                key: 'palette',
                message: 'key palette is already defined in a-first.yml; b-later.yml wins'
            }
        ]);
    });

    it('reports a file that does not parse and merges the rest', () => {
        const engine = scratch();
        writeConfig(engine, 'broken.yml', 'title: "unterminated\n  - [\n');
        writeConfig(engine, 'good.yml', 'text: { app: { title: oculus } }\n');

        const { config, findings } = loadConfig(engine);
        expect(config.text).toEqual({ app: { title: 'oculus' } });
        expect(findings.length).toBe(1);
        expect(findings[0].file).toBe(join(engine, 'config', 'broken.yml'));
        expect(findings[0].message).toMatch(/^does not parse: /);
    });

    it('reports a file that is not a map and treats an empty file as no keys', () => {
        const engine = scratch();
        writeConfig(engine, 'listy.yml', '- one\n- two\n');
        writeConfig(engine, 'nothing.yml', '');

        const { config, findings } = loadConfig(engine);
        expect(config).toEqual({});
        expect(findings).toEqual([
            {
                file: join(engine, 'config', 'listy.yml'),
                key: '',
                message: 'is not a map of keys'
            }
        ]);
    });

    it('reports a missing config directory and returns an empty map', () => {
        const engine = scratch();
        const { config, findings } = loadConfig(engine);

        expect(config).toEqual({});
        expect(findings).toEqual([
            {
                file: join(engine, 'config'),
                key: '',
                message: 'config directory does not exist'
            }
        ]);
    });
});

// The nine files that ship with the tool, read the way the server reads them. EXPECTED is the whole
// top-level key set after the regrouping of O10c, so a key that is dropped, renamed or added shows
// up here as well as wherever it is read.
describe("oculus's own config directory", () => {
    /** Every top-level key the nine files hold, by the file it now sits in. */
    const EXPECTED: Record<string, string[]> = {
        'appearance.yml': ['themes', 'wallpaper', 'crt'],
        'behavior.yml': [
            'read_limits',
            'stale_days',
            'data_domains',
            'stale_lag_days',
            'refresh_stale_days',
            'deadline_horizon_days',
            'leads_horizon_days',
            'conf_horizon_months',
            'leads_badge_days',
            'venue_conc_warn',
            'linkedin_cadence_days',
            'file_index',
            'slurm',
            'chat'
        ],
        'glyphs.yml': ['glyphs', 'ascii'],
        'layout.yml': [
            'nav_groups',
            'board',
            'tab_rollup',
            'nav_live',
            'focus_label_mode',
            'project_label_mode',
            'archive_label_mode',
            'map_label_mode'
        ],
        'manifest-schema.yml': ['manifest_schema'],
        'meta.yml': ['meta'],
        'sources.yml': [
            'scan',
            'venues_file',
            'datasets_file',
            'programs_file',
            'domains_file',
            'collections',
            'docs',
            'indexes',
            'leads_file',
            'radar_file',
            'publications_file',
            'linkedin_dir',
            'career_file'
        ],
        'text.yml': ['text'],
        'vocab.yml': [
            'palette',
            'domains',
            'type_color',
            'type_order',
            'status_legend',
            'status_palette',
            'focus_lanes',
            'holding_color',
            'priority_levels',
            'fund_stages',
            'career_host_status',
            'career_score_dims',
            'archive_categories',
            'archive_dead',
            'leads_fit',
            'lifecycle',
            'arch_color',
            'data_access',
            'venue_tiers',
            'radar_buckets'
        ]
    };

    it('merges without a finding, so no key is defined in two files', () => {
        expect(loadConfig(engineDir()).findings).toEqual([]);
    });

    it('holds exactly the expected top-level keys, and no more', () => {
        const { config } = loadConfig(engineDir());
        const expected = Object.values(EXPECTED).flat().sort();
        expect(Object.keys(config).sort()).toEqual(expected);
    });

    it('reads each file on its own and finds its own keys there and nowhere else', () => {
        const dir = join(engineDir(), 'config');
        const seen: Record<string, string> = {};
        for (const [name, keys] of Object.entries(EXPECTED)) {
            const parsed = parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>;
            expect(Object.keys(parsed).sort()).toEqual([...keys].sort());
            for (const key of keys) {
                expect(seen[key]).toBe(undefined);
                seen[key] = name;
            }
        }
        expect(
            readdirSync(dir)
                .filter((name) => name.endsWith('.yml'))
                .sort()
        ).toEqual(Object.keys(EXPECTED).sort());
    });
});
