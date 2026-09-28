// The Agents view rendered to HTML on the server, over a session that dispatched subagents: the
// order the rows come in, and what each row's status line counts.
//
// The catalog and glyphs are the real config; the session is the test's own. Nothing reads
// ~/.claude, ~/.codex or ~/.oculus.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Agents from '../../../src/lib/views/sessions/agents/Agents.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { area, payload, record, workspace } from '../../fixtures/sessions-fixture.ts';
import type { SessionAgent } from '../../../src/lib/data/model/index.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

/** A subagent the transcript named, started at the given moment and running until `ended`. */
function subagent(
    id: string,
    started: string,
    description: string,
    ended: string | null = null
): SessionAgent {
    return {
        id,
        description,
        subagentType: 'Explore',
        model: 'claude-sonnet-5',
        started,
        ended,
        status: ended === null ? 'running' : 'done',
        resultChars: 0
    };
}

let client: ClientState;

/** One session holding these agents, in the order the server lists them, selected. */
function holding(agents: SessionAgent[]): void {
    client = createClientState();
    const one = record('orchestrator', { agents });
    client.entities.receive({
        channel: 'sessions',
        version: 1,
        payload: payload([workspace('/ws', [area('/ws', [one])])])
    });
    client.selection.select('orchestrator');
}

function html(): string {
    const instance: Instance = { id: 'agents-probe', view: 'agents', state: {} };
    client.layout.apply({ root: { kind: 'pane', tabs: [instance], active: instance.id } });
    return render(Agents, { context: clientContext(client), props: { instance } }).body;
}

beforeEach(() => holding([]));

describe("the agents view's rows", () => {
    it('draws newest first by start, whatever order the server lists them in', () => {
        holding([
            subagent('toolu_1', '2026-09-23T10:00:00.000Z', 'first subagent'),
            subagent('toolu_2', '2026-09-23T10:01:00.000Z', 'second subagent')
        ]);
        const body = html();
        const at = (text: string): number => body.indexOf(text);
        expect(at('first subagent')).toBeGreaterThan(-1);
        expect(at('second subagent')).toBeGreaterThan(-1);
        expect(at('second subagent')).toBeLessThan(at('first subagent'));
    });

    /** The status line of one row of the rendered view. */
    function line(body: string, id: string): string {
        const row = body.slice(body.indexOf(`data-agent="${id}"`));
        const found = /<span class="st[^"]*">([^<]*)<\/span>/.exec(row);
        return found === null ? '' : found[1];
    }

    it('counts a finished subagent from its start to its end', () => {
        holding([
            subagent(
                'ran',
                '2026-09-23T16:12:23.433Z',
                'a finished subagent',
                '2026-09-23T16:13:53.869Z'
            )
        ]);
        const took = catalog['sessions.ag_mins'].replace('{0}', '1').replace('{1}', '30');
        expect(took).toBe('1m 30s');
        expect(line(html(), 'ran')).toBe(
            [catalog['sessions.ag_done'], took].join(` ${catalog['sessions.meta_sep']} `)
        );
    });

    it('counts a running subagent from its start to now', () => {
        const started = new Date(Date.now() - 45_000).toISOString();
        holding([subagent('runs', started, 'a running subagent')]);
        const said = line(html(), 'runs');
        expect(
            said.startsWith(`${catalog['sessions.ag_running']} ${catalog['sessions.meta_sep']} `)
        ).toBe(true);
        // Rendering takes well under a second, so the count is 45 s or the second after it.
        expect(['45 s', '46 s']).toContain(said.split(` ${catalog['sessions.meta_sep']} `)[1]);
    });

    it('draws no count for a finished subagent whose end is not known', () => {
        const gone = {
            ...subagent('gone', '2026-09-23T10:00:00.000Z', 'a finished subagent'),
            status: 'done' as const
        };
        holding([gone]);
        expect(line(html(), 'gone')).toBe(catalog['sessions.ag_done']);
    });

    it('says a subagent stopped before it finished is stopped, apart from one that failed', () => {
        const stopped = {
            ...subagent('toolu_s', '2026-09-23T10:00:00.000Z', 'a stopped subagent'),
            status: 'stopped',
            ended: '2026-09-23T10:01:00.000Z'
        };
        holding([stopped]);
        const body = html();
        expect(body).toContain(
            `>${catalog['sessions.ag_stopped']} ${catalog['sessions.meta_sep']} 1m 00s<`
        );
        expect(body).toContain('--tone: var(--c-amber)');
    });
});
