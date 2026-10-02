// Layer 3, view test. What the picks of a graph commit's menu do once chosen
// (views/sources/repositories/graph/graph-picks.ts): the question each asks and the write a yes
// sends, and the prompt of Create Branch and Create Tag.
//
// The words are a stand-in `t` that answers each key as `@key(arguments)`, so a question is
// asserted by the key it is worded by.
//
// What this does NOT cover: the dialog the question is asked in and the prompt's fields on screen,
// which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import {
    askPick,
    namePrompt,
    type PickDeps,
    type PickWrites
} from '../../../../../src/lib/views/sources/repositories/graph/graph-picks.ts';
import type { BranchDeletion } from '../../../../../src/lib/state/sources/repositories/repositories.svelte.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

const HASH = 'abcdef0123456789';

type Sent = [string, ...unknown[]];

/** The writes as recorders, and the questions asked, for one case. */
function harness(deletion: BranchDeletion = 'deleted') {
    const sent: Sent[] = [];
    const asked: { message: string; detail: string; confirm?: string; act: () => void }[] = [];
    const record =
        (name: string) =>
        (...args: unknown[]): Promise<void> => {
            sent.push([name, ...args]);
            return Promise.resolve();
        };
    const repositories = {
        checkoutDetached: record('checkoutDetached'),
        cherryPick: record('cherryPick'),
        deleteBranch: (...args: unknown[]) => {
            sent.push(['deleteBranch', ...args]);
            return Promise.resolve(deletion);
        },
        deleteBranchAnyway: record('deleteBranchAnyway'),
        createTag: record('createTag'),
        createBranch: record('createBranch')
    } as unknown as PickWrites;
    const deps: PickDeps = {
        root: '/hub',
        onto: 'main',
        ask: (message, detail, act, confirm) => asked.push({ message, detail, confirm, act }),
        repositories,
        t: words
    };
    return { sent, asked, deps, repositories };
}

describe('the questions of a graph commit pick', () => {
    // Revert: send the detached checkout without waiting for the yes.
    it('audits that asks before a detached checkout of the commit and sends it on a yes', () => {
        const { sent, asked, deps } = harness();
        askPick({ kind: 'detach' }, HASH, deps);
        expect(asked.map((one) => one.message)).toEqual(['@repositories.detach_confirm(abcdef0)']);
        expect(sent).toEqual([]);
        asked[0].act();
        expect(sent).toEqual([['checkoutDetached', '/hub', HASH]]);
    });

    // Revert: check out the commit's hash for a remote branch name.
    it('audits that checks a remote branch out detached by its name', () => {
        const { sent, asked, deps } = harness();
        askPick({ kind: 'detach-ref', name: 'origin/dev' }, HASH, deps);
        expect(asked[0].message).toBe('@repositories.detach_confirm(origin/dev)');
        asked[0].act();
        expect(sent).toEqual([['checkoutDetached', '/hub', 'origin/dev']]);
    });

    // Revert: name the commit instead of the branch the pick lands on.
    it('audits that names the commit and the branch it is picked onto, then cherry picks the commit', () => {
        const { sent, asked, deps } = harness();
        askPick({ kind: 'cherry-pick' }, HASH, deps);
        expect(asked[0].message).toBe('@repositories.cherry_pick_confirm(abcdef0,main)');
        expect(asked[0].detail).toBe('@repositories.cherry_pick_detail');
        asked[0].act();
        expect(sent).toEqual([['cherryPick', '/hub', HASH]]);
    });

    // Revert: send the branch delete without its question.
    it('audits that asks before deleting a branch, with the Delete Branch button', () => {
        const { sent, asked, deps } = harness();
        askPick({ kind: 'delete-branch', name: 'topic' }, HASH, deps);
        expect(asked[0].message).toBe('@repositories.branch_delete_confirm(topic)');
        expect(asked[0].confirm).toBe('@repositories.branch_delete_button');
        expect(sent).toEqual([]);
        asked[0].act();
        expect(sent).toEqual([['deleteBranch', '/hub', 'topic']]);
    });
});

describe('the second question of Delete Branch', () => {
    // Revert: send deleteBranchAnyway without the second question.
    it('audits that asks the unmerged question after the first and sends -D only on its yes', async () => {
        const { sent, asked, deps } = harness('not-merged');
        askPick({ kind: 'delete-branch', name: 'topic' }, HASH, deps);
        asked[0].act();
        await Promise.resolve();
        await Promise.resolve();
        expect(sent).toEqual([['deleteBranch', '/hub', 'topic']]);
        expect(asked).toHaveLength(2);
        expect(asked[1].message).toBe('@repositories.branch_unmerged_confirm(topic)');
        expect(asked[1].confirm).toBe('@repositories.branch_delete_button');
        asked[1].act();
        expect(sent).toEqual([
            ['deleteBranch', '/hub', 'topic'],
            ['deleteBranchAnyway', '/hub', 'topic']
        ]);
    });
});

describe('the prompt of Create Branch and Create Tag', () => {
    // Revert: put a start point field back into the branch prompt.
    it('audits that asks a branch for a name alone and starts it at the commit picked', () => {
        const { sent, deps } = harness();
        let closed = 0;
        const prompt = namePrompt({ kind: 'create-branch' }, HASH, deps, () => (closed += 1));
        expect(prompt.fields.map((field) => field.label)).toEqual(['@repositories.branch_name']);
        prompt.act([' topic ']);
        expect(closed).toBe(1);
        expect(sent).toEqual([['createBranch', '/hub', 'topic', HASH]]);
    });

    // Revert: read the tag message from a start point's field.
    it('audits that asks a tag for a name and a message and tags the commit picked', () => {
        const { sent, deps } = harness();
        const prompt = namePrompt({ kind: 'create-tag' }, HASH, deps, () => undefined);
        expect(prompt.fields.map((field) => field.label)).toEqual([
            '@repositories.tag_name',
            '@repositories.tag_message'
        ]);
        prompt.act(['v2', 'release']);
        expect(sent).toEqual([['createTag', '/hub', 'v2', 'release', HASH]]);
    });

    // Revert: send a write for a prompt answered with an empty name.
    it('audits that sends nothing for an empty name, but still closes', () => {
        const { sent, deps } = harness();
        let closed = 0;
        namePrompt({ kind: 'create-tag' }, HASH, deps, () => (closed += 1)).act(['  ', '']);
        expect(closed).toBe(1);
        expect(sent).toEqual([]);
    });
});
