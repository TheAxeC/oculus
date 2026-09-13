// Layer 4, view test. The Usage view renders account cards, meters, live rows, history totals and both empty states.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Usage from '../../src/lib/views/Usage.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import type { UsagePayload } from '../../src/lib/data/model.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
const instance = { id: 'usage-one', view: 'usage', title: 'Usage', state: {} };
let version = 10000;

function draw(payload: UsagePayload): string {
    version += 1;
    receive({ channel: 'usage', version, payload });
    return render(Usage, { props: { instance } }).body;
}

describe('Usage', () => {
    it('draws account details, window meters, live sessions and the seven-day total', () => {
        const html = draw({
            accounts: [
                {
                    tool: 'claude',
                    label: 'Personal',
                    dir: '/tmp/.claude',
                    email: 'a@example.test',
                    organisation: 'Lab',
                    tier: 'default_claude_max_20x',
                    tierLabel: 'Max 20x',
                    billing: 'stripe',
                    windows: [
                        {
                            name: 'five_hour',
                            usedPercent: 28.999999999999996,
                            resetsAt: Date.parse('2026-09-13T14:00:00Z') / 1000,
                            windowMinutes: 300
                        }
                    ],
                    live: [
                        {
                            sessionId: 'abcdefgh-rest',
                            model: 'Opus',
                            contextPercent: 12.4,
                            costUsd: 1.25,
                            updatedAt: '2026-09-13T12:00:00Z',
                            cwd: '/tmp/project'
                        }
                    ]
                }
            ],
            days: [
                {
                    tool: 'claude',
                    account: 'Personal',
                    day: '2026-09-13',
                    model: 'claude-opus',
                    input: 10,
                    output: 2,
                    cacheRead: 3,
                    cacheCreation: 4
                },
                {
                    tool: 'codex',
                    account: 'Codex',
                    day: '2026-09-12',
                    model: 'gpt-5',
                    input: 20,
                    output: 5,
                    cacheRead: 6,
                    cacheCreation: 7
                }
            ],
            builtAt: '2026-09-13T12:00:00.000Z'
        });
        expect(html).toContain('data-card');
        expect(html).toContain('role="meter"');
        expect(html).toContain('Personal');
        expect(html).toContain('Max 20x');
        expect(html).toContain('a@example.test');
        expect(html).toContain('Lab');
        expect(html).toContain('stripe');
        const live = html.match(/<div class="live-row[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '';
        expect(live).toContain('Opus');
        expect(live).toContain('12% context');
        expect(html).toContain('resets in 2h 0m');
        expect(html).toContain('abcdefgh');
        expect(html).toContain('$1.25');
        expect(html).toContain('project');
        expect(html).toContain('claude-opus');
        expect(html).toContain('Total');
        const body = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1] ?? '';
        const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) =>
            [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) =>
                cell[1].replace(/<!--[\s\S]*?-->/g, '').trim()
            )
        );
        expect(rows).toEqual([
            ['2026-09-13', 'claude', 'Personal', 'claude-opus', '10', '2', '3', '4'],
            ['2026-09-12', 'codex', 'Codex', 'gpt-5', '20', '5', '6', '7'],
            ['Total', '', '', '', '30', '7', '9', '11']
        ]);
    });

    it('draws the no-account and no-history empty states', () => {
        const html = draw({ accounts: [], days: [], builtAt: '2026-09-13T12:00:00.000Z' });
        expect(html).toContain('No usage accounts are configured.');
        expect(html).toContain('No token use was recorded in the last seven days.');
    });

    it('names the status-line install when a Claude account has no snapshot', () => {
        const html = draw({
            accounts: [
                {
                    tool: 'claude',
                    label: 'Personal',
                    dir: '/tmp/.claude',
                    email: '',
                    organisation: '',
                    tier: '',
                    tierLabel: '',
                    billing: '',
                    windows: [],
                    live: []
                }
            ],
            days: [],
            builtAt: '2026-09-13T12:00:00.000Z'
        });
        expect(html).toContain('Install bin/claude-usage.sh');
    });
});
