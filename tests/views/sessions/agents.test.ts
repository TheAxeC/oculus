// The Agents view rendered to HTML on the server, over a session that dispatched native subagents
// and launched builders: the order the rows come in, what a launched row says, and which rows offer
// to open a transcript.
//
// The catalog and glyphs are the real config; the session is the test's own. Nothing reads
// ~/.claude, ~/.codex or ~/.oculus. Pressing the open control needs a DOM and is proven in
// tests/browser/sessions/agents.spec.ts.

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
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import { area, payload, record, workspace } from '../../fixtures/sessions-fixture.ts';
import type { SessionAgent } from '../../../src/lib/data/model.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

/** A subagent the transcript named, started at the given moment. */
function subagent(id: string, started: string, description: string): SessionAgent {
    return {
        id,
        description,
        subagentType: 'Explore',
        model: 'claude-sonnet-5',
        started,
        ended: null,
        status: 'running',
        resultChars: 0
    };
}

/** A builder a launch note placed under the session. */
function launched(
    id: string,
    started: string,
    over: Partial<NonNullable<SessionAgent['dispatch']>> = {},
    ended: string | null = null
): SessionAgent {
    return {
        id: `dispatch:${id}`,
        description: `step ${id}`,
        subagentType: 'plan-orchestration',
        model: 'gpt-5.6-sol',
        started,
        ended,
        status: ended === null ? 'running' : 'done',
        resultChars: 0,
        dispatch: {
            launcher: 'plan-orchestration',
            harness: 'codex',
            cwd: '/ws/.agents/worktrees/O99',
            transcript: '',
            session: null,
            tokens: null,
            ...over
        }
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

describe('the agents view over launched builders', () => {
    it('draws newest first by start, whatever order the server lists them in', () => {
        // The server lists the transcript's subagents newest first and appends the launches.
        holding([
            subagent('toolu_2', '2026-09-23T10:02:00.000Z', 'second subagent'),
            subagent('toolu_1', '2026-09-23T10:00:00.000Z', 'first subagent'),
            launched('one', '2026-09-23T10:01:00.000Z')
        ]);
        // revert: src/lib/views/sessions/agents/Agents.svelte:58 => [...(record?.agents ?? [])].reverse()
        const body = html();
        const at = (text: string): number => body.indexOf(text);
        expect(at('second subagent')).toBeGreaterThan(-1);
        expect(at('second subagent')).toBeLessThan(at('step one'));
        expect(at('step one')).toBeLessThan(at('first subagent'));
    });

    it('marks a launched row, names its harness and model, and carries a Codex token count', () => {
        holding([
            launched('one', '2026-09-23T10:01:00.000Z', {
                tokens: { input: 12000, output: 3000, cacheRead: 0, cacheCreation: 0, thinking: 0 }
            })
        ]);
        // revert: src/lib/views/sessions/agents/Agents.svelte:90 => if (harness === 'codex') return agent.subagentType;
        const body = html();
        expect(body).toContain('data-launched="true"');
        expect(body).toContain(catalog['sessions.ag_launched']);
        expect(body).toMatch(new RegExp(`class="ty[^"]*">${catalog['sessions.ag_codex']}<`));
        expect(body).toContain('step one');
        expect(body).toContain(catalog['sessions.ag_tokens'].replace('{0}', '15k'));
        expect(body).toContain(catalog['sessions.ag_running']);
    });

    it('draws no launched mark and no open control on a subagent', () => {
        holding([subagent('toolu_1', '2026-09-23T10:00:00.000Z', 'a subagent')]);
        // revert: src/lib/views/sessions/agents/Agents.svelte:147 => {#if true}
        const body = html();
        // A subagent carries no launch record, so nothing marks it as a process of its own.
        expect(body).not.toContain('data-launched');
        // The same reason: the mark is drawn for a launch record and this row has none.
        expect(body).not.toContain(`>${catalog['sessions.ag_launched']}<`);
        // Its turns live in the parent's transcript, so there is no session of its own to open.
        expect(body).not.toContain(catalog['sessions.ag_open']);
    });

    it('offers to open the transcript only of a launch whose session the payload holds', () => {
        holding([
            launched('known', '2026-09-23T10:01:00.000Z', { session: 'builder-session' }),
            launched('unknown', '2026-09-23T10:00:00.000Z', {}, '2026-09-23T10:05:00.000Z')
        ]);
        // revert: src/lib/views/sessions/agents/Agents.svelte:154 => {#if true}
        const body = html();
        const known = body.slice(body.indexOf('data-agent="dispatch:known"'));
        const unknown = body.slice(body.indexOf('data-agent="dispatch:unknown"'));
        expect(known.slice(0, known.indexOf('data-agent="dispatch:unknown"'))).toContain(
            catalog['sessions.ag_open']
        );
        // That launch names no transcript, so the payload holds no session for it to open.
        expect(unknown).not.toContain(catalog['sessions.ag_open']);
        expect(unknown).toContain(catalog['sessions.ag_done']);
    });
});
