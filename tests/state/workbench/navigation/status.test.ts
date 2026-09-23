// The words of the status bar's socket, usage, HPC and live-session items, made from what the
// socket and the three channels hold: the rules of state/workbench/navigation/status.ts over hand-
// built payloads.
//
// What this does NOT cover: the bar drawing the words and the unsaved count, which are
// tests/shell/status/status-bar.test.ts's, and an item pressed, which is the browser layer's.

import { describe, expect, it } from 'vitest';
import {
    hpcWords,
    liveCount,
    socketWords,
    statusWords,
    usageWords
} from '../../../../src/lib/state/workbench/navigation/status.ts';
import type { HpcPayload, SessionsPayload, UsagePayload } from '../../../../src/lib/data/model.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** A usage payload whose accounts carry refreshers in these states. */
function usage(...states: string[]): UsagePayload {
    return {
        accounts: states.map((state) => ({
            tool: 'claude',
            label: state,
            dir: '/x',
            refresher: { state, since: '2026-09-23T10:00:00Z', lastRefresh: '' }
        })),
        history: []
    } as unknown as UsagePayload;
}

describe('the socket item', () => {
    it('names each of the three states in its own word', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:18 => if (state === 'open') return t('workbench.status_socket_closed');
        expect(socketWords('closed')).toBe(t('workbench.status_socket_closed'));
        expect(socketWords('connecting')).toBe(t('workbench.status_socket_connecting'));
        expect(socketWords('open')).toBe(t('workbench.status_socket_open'));
    });
});

describe('the usage item', () => {
    it('takes the refreshers together: down wins, then refreshing, and none says so', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:31 => delete
        expect(usageWords(null)).toBe(t('workbench.status_usage_none'));
        expect(usageWords(usage('running', 'down', 'refreshing'))).toBe(
            t('workbench.status_usage_down')
        );
        expect(usageWords(usage('running', 'refreshing'))).toBe(
            t('workbench.status_usage_refreshing')
        );
        expect(usageWords(usage('running'))).toBe(t('workbench.status_usage_ok'));
    });
});

describe('the HPC item', () => {
    it('says the poll is starting, then names the queue once it is live', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:41 => return t('hpc.live');
        expect(hpcWords(null)).toBe(t('hpc.polling'));
        const live = {
            status: 'ok',
            total: 3,
            running: 2,
            pending: 1,
            jobs: [],
            updated: '2026-09-23T10:00:00Z',
            pollMin: 2
        } as unknown as HpcPayload;
        expect(hpcWords(live)).toBe(t('hpc.queue_summary', 2, 1, 3));
        expect(hpcWords({ ...live, status: 'unreachable' })).toBe(t('hpc.unreachable'));
    });
});

describe('the live sessions item', () => {
    it('counts the live sessions alone', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:46 => return (sessions?.records ?? []).length;
        const held = {
            records: [{ live: true }, { live: false }, { live: true }]
        } as unknown as SessionsPayload;
        expect(liveCount(held)).toBe(2);
        expect(liveCount(null)).toBe(0);
    });

    it('hands the page all four at once', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:58 => usage: usageWords(null),
        expect(statusWords('open', usage('down'), null, null)).toEqual({
            socket: t('workbench.status_socket_open'),
            usage: t('workbench.status_usage_down'),
            hpc: t('hpc.polling'),
            live: 0
        });
    });
});
