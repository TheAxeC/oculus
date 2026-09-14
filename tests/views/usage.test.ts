// Layer 4, view test. The Usage view renders account cards, meters, live rows, history totals and both empty states.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Usage from '../../src/lib/views/Usage.svelte';
import ToolButton from '../../src/lib/ui/ToolButton.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../src/lib/data/sources/config.ts';
import type { UsagePayload } from '../../src/lib/data/model.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setToken } from '../../src/lib/state/writes.svelte.ts';

// Record the actual control callback while retaining the real primitive's server rendering.
vi.mock('../../src/lib/ui/ToolButton.svelte', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../src/lib/ui/ToolButton.svelte')>();
    return { ...original, default: vi.fn(original.default) };
});

/** The control's handler reads nothing off the event, so the cases hand it an empty stand-in. */
const CLICK = {} as MouseEvent;

/** What a case reads off a drawn control: the handler pressing it runs. */
type Drawn = { onclick: (event: MouseEvent) => unknown };

/** The props the control carrying these words was drawn with, or nothing when none was drawn. */
function drawnWith(label: string): Drawn | undefined {
    return vi.mocked(ToolButton).mock.calls.find((call) => call[1].label === label)?.[1];
}

/** Press the control carrying these words, refusing a case that drew none. */
async function press(label: string): Promise<void> {
    const control = drawnWith(label);
    if (control === undefined) throw new Error(`no control was drawn with the words ${label}`);
    await control.onclick(CLICK);
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(ToolButton).mockClear();
});

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

function refreshPayload(
    state: 'running' | 'refreshing' = 'running',
    renewed = true,
    fetchedAt?: string
): UsagePayload {
    return {
        accounts: [
            {
                tool: 'claude',
                label: 'University',
                dir: '/tmp/unused-usage-view',
                email: '',
                organisation: '',
                tier: '',
                tierLabel: '',
                billing: '',
                fetchedAt,
                windows: [],
                live: [],
                refresher: {
                    state,
                    since: '2026-09-13T12:00:00Z',
                    reason: '',
                    lastRefresh: '',
                    renewed
                }
            }
        ],
        days: [],
        builtAt: '2026-09-13T12:00:00Z'
    };
}

describe('Usage', () => {
    it.each(['running', 'refreshing'] as const)('renders the %s refresher state', (state) => {
        expect(draw(refreshPayload(state))).toContain(`refresher: ${state}`);
    });

    it('says when a refresh renewed nothing and when Claude Code renews the figures', () => {
        const html = draw(refreshPayload('running', false, '2026-09-13T12:34:00Z'));
        expect(html).toContain(
            'refresher: running, figures fetched at 14:34; Claude Code renews them after five minutes'
        );
        expect(draw(refreshPayload('running', false))).toContain('refresher: running');
    });

    it('sends the card account and token, shows refusal until the next usage payload', async () => {
        const fetch = vi.fn(() =>
            Promise.resolve(new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 }))
        );
        vi.stubGlobal('fetch', fetch);
        setToken('usage-test-token');
        draw(refreshPayload());
        expect(drawnWith('Refresh now')).toBeDefined();
        await press('Refresh now');
        expect(fetch).toHaveBeenCalledWith('/api/usage/refresh', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': 'usage-test-token' },
            body: JSON.stringify({ account: 'University' })
        });
        expect(render(Usage, { props: { instance } }).body).toContain(
            'refresh refused: the write token was refused'
        );
        const next = draw(refreshPayload('refreshing'));
        expect(next).not.toContain('refresh refused:');
        expect(next).toContain('refresher: refreshing');
    });

    it('shows network failures and non-JSON refusals as the failed request', async () => {
        const fetch = vi
            .fn()
            .mockRejectedValueOnce(new Error('Network unavailable'))
            .mockResolvedValueOnce(new Response('Unavailable', { status: 503 }));
        vi.stubGlobal('fetch', fetch);
        draw(refreshPayload());
        await press('Refresh now');
        expect(render(Usage, { props: { instance } }).body).toContain(
            'refresh refused: the server did not answer'
        );
        await press('Refresh now');
        expect(render(Usage, { props: { instance } }).body).toContain(
            'refresh refused: the server did not answer'
        );
    });

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
                            windowMinutes: 300,
                            observedAt: '2026-09-13T12:00:00Z'
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
        const live = /<div class="live-row[^>]*>([\s\S]*?)<\/div>/.exec(html)?.[1] ?? '';
        expect(live).toContain('Opus');
        expect(live).toContain('12% context');
        // The words are rounded; the meter's fill keeps the exact width, which nobody reads.
        expect(html).toMatch(/class="text[^"]*">29% \|/);
        expect(html).not.toMatch(/>28\.999/);
        expect(html).toContain('resets in 2h 0m');
        expect(html).toContain('abcdefgh');
        expect(html).toContain('$1.25');
        expect(html).toContain('project');
        expect(html).toContain('claude-opus');
        expect(html).toContain('Total');
        const body = /<tbody[^>]*>([\s\S]*?)<\/tbody>/.exec(html)?.[1] ?? '';
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

    it('orders Claude windows, applies cached severity and shows the newest observation', () => {
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
                    fetchedAt: '2026-09-13T14:30:00',
                    windows: [
                        {
                            name: 'weekly_model',
                            model: 'Fable',
                            usedPercent: 5,
                            resetsAt: Date.parse('2026-09-14T20:00:00Z') / 1000,
                            windowMinutes: 10080,
                            severity: 'critical',
                            active: true,
                            observedAt: '2026-09-13T14:30:00'
                        },
                        {
                            name: 'seven_day',
                            usedPercent: 20,
                            resetsAt: Date.parse('2026-09-14T20:00:00Z') / 1000,
                            windowMinutes: 10080,
                            severity: 'warning',
                            active: false,
                            observedAt: '2026-09-13T13:00:00'
                        },
                        {
                            name: 'five_hour',
                            usedPercent: 0,
                            resetsAt: 0,
                            windowMinutes: 300,
                            observedAt: ''
                        }
                    ],
                    live: []
                }
            ],
            days: [],
            builtAt: '2026-09-13T12:00:00.000Z'
        });
        expect(html.indexOf('5 hour')).toBeLessThan(html.indexOf('7 day'));
        expect(html.indexOf('7 day')).toBeLessThan(html.indexOf('Fable this week'));
        expect(html).toContain('no window open');
        expect(html).toContain('--tone: var(--c-red)');
        expect(html).toContain('--tone: var(--c-amber)');
        expect(html).not.toContain('as of');
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

    it('draws each Claude account refresh control and its refresher state', () => {
        const html = draw({
            accounts: [
                {
                    tool: 'claude',
                    label: 'University',
                    dir: '/tmp/.claude-work',
                    email: '',
                    organisation: '',
                    tier: '',
                    tierLabel: '',
                    billing: '',
                    windows: [],
                    live: [],
                    refresher: {
                        state: 'down',
                        since: '2026-09-13T12:34:00.000Z',
                        reason: 'usage_limit',
                        lastRefresh: '2026-09-13T12:30:00.000Z',
                        renewed: false
                    }
                }
            ],
            days: [],
            builtAt: '2026-09-13T12:35:00.000Z'
        });
        expect(html).toMatch(/<button[^>]*>[\s\S]*Refresh now[\s\S]*<\/button>/);
        expect(html).toContain('refresher: down since 14:34: the account usage limit was reached');
    });
});
