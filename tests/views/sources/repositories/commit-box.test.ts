// The commit box rendered to HTML on the server, the one both git views draw: the message field
// and its placeholder, the height it opens at, Suggest inside the box, and the one action button in
// each of its states (Commit, Sync Changes, Publish Branch and the disabled Commit) with the
// dropdown that goes with Commit alone. The buttons and the confirm dialog are wrapped by a
// recorder that renders the real one and keeps the props the view gave it.
//
// What this does NOT cover: how tall a field that wraps a long line grows, which is layout a
// browser with field sizing answers; the look on TEST sees a long line in a narrow pane.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import AskConfirm from '../../../../src/lib/views/shared/AskConfirm.svelte';
import CommitBox from '../../../../src/lib/views/shared/changes/CommitBox.svelte';
import ToolButton from '../../../../src/lib/ui/controls/ToolButton.svelte';
import { pressWhenDrawn } from './press-on-render.ts';
import { buttonWords, catalog, clear, drawn, git, hold, HUB, fresh } from './harness.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';

let client: ClientState;

vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

vi.mock('../../../../src/lib/views/shared/AskConfirm.svelte', async (original) =>
    (await import('./press-on-render.ts')).recorded(original)
);

beforeEach(() => {
    client = fresh(ToolButton, AskConfirm);
});

const TRACKING = [{ name: 'main', upstream: 'origin/main', current: true }];
const STAGED = [{ path: 'a.ts', status: 'M', added: 1, deleted: 0 }];

/** The commit box drawn over a git state, with the message typed for the root first. */
function box(state: ReturnType<typeof git>, message = ''): string {
    hold(client, { [HUB]: state });
    client.repositories.setMessage(HUB, message);
    return render(CommitBox, {
        context: clientContext(client),
        props: { root: HUB, git: state }
    }).body;
}

/** The one action button, the recorded button of the primary look. */
function action(): Record<string, unknown> | undefined {
    return drawn(ToolButton).find((one) => one.primary === true);
}

/** The value of an attribute of the first tag holding `marker`, its entities decoded. */
function attribute(body: string, marker: string, name: string): string {
    const at = body.indexOf(marker);
    const open = body.lastIndexOf('<', at);
    // a tag ends at the first `>` outside a quoted attribute value
    const tag = /^<[^>"]*(?:"[^"]*"[^>"]*)*>/.exec(body.slice(open))?.[0] ?? '';
    const found = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
    return (found?.[1] ?? '')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

describe('the message field', () => {
    it('says the chord and the branch it commits on', () => {
        const body = box(git({ branch: 'main', staged: STAGED }));

        expect(attribute(body, `aria-label="${catalog['git.commit_label']}"`, 'placeholder')).toBe(
            'Message (Ctrl+Enter to commit on "main")'
        );
    });

    it('says the chord alone when no branch is checked out', () => {
        const body = box(git({ branch: 'HEAD', detached: true, staged: STAGED }));

        expect(attribute(body, `aria-label="${catalog['git.commit_label']}"`, 'placeholder')).toBe(
            'Message (Ctrl+Enter to commit)'
        );
    });

    it('draws a branch name with markup characters in it as text', () => {
        const body = box(git({ branch: 'feat/<b>', staged: STAGED }));

        expect(attribute(body, `aria-label="${catalog['git.commit_label']}"`, 'placeholder')).toBe(
            'Message (Ctrl+Enter to commit on "feat/<b>")'
        );
        // the markup in the branch name is escaped, so it never reaches the page as a tag
        expect(body).not.toContain('feat/<b>"');
    });

    it('carries the line count of the message as its rows, one for an empty field', () => {
        const rowsOf = (message: string): string =>
            attribute(
                box(git({ staged: STAGED }), message),
                `aria-label="${catalog['git.commit_label']}"`,
                'rows'
            );

        expect(rowsOf('')).toBe('1');
        expect(rowsOf('a\nb\nc\nd')).toBe('4');
        expect(rowsOf(Array.from({ length: 30 }, () => 'x').join('\n'))).toBe('10');
        expect(rowsOf('a\n')).toBe('2');
        expect(rowsOf('x'.repeat(500))).toBe('1');
    });

    it('holds Suggest inside the box, as an icon button, between the field and the action button', () => {
        const body = box(git({ staged: STAGED }));
        const field = body.indexOf(`aria-label="${catalog['git.commit_label']}"`);
        const suggest = body.indexOf(`aria-label="${catalog['git.suggest']}"`);
        const commit = body.indexOf(`>${catalog['git.commit']}<`);
        const more = body.indexOf(`aria-label="${catalog['git.commit_more']}"`);

        expect(drawn(ToolButton).find((one) => one.glyph === 'spark')).toMatchObject({
            bare: true,
            compact: true,
            title: catalog['git.suggest']
        });
        expect(field).toBeGreaterThan(-1);
        expect(field).toBeLessThan(suggest);
        expect(suggest).toBeLessThan(commit);
        expect(commit).toBeLessThan(more);
    });
});

describe('the action button in each of its states', () => {
    it('is Commit with a check while anything is staged, with the dropdown of the other ways', () => {
        const body = box(git({ staged: STAGED }), 'A message');

        expect(action()).toMatchObject({
            label: catalog['git.commit'],
            glyph: 'check',
            joined: true,
            disabled: false
        });
        expect(body).toContain(`aria-label="${catalog['git.commit_more']}"`);
    });

    it('is Commit disabled with the reason as its hover words where Commit is disabled', () => {
        box(git({ staged: STAGED }), '');
        expect(action()).toMatchObject({ disabled: true, title: catalog['git.commit_empty'] });

        clear(ToolButton);
        box(git({ conflicted: [{ path: 'x', status: 'UU', added: 0, deleted: 0 }] }), 'm');
        expect(action()).toMatchObject({
            disabled: true,
            title: catalog['git.commit_unmerged'].replace('{0}', '1')
        });
    });

    it('draws neither muted sentence as a line, the reasons being the button hover words', () => {
        const nothing = box(git({ branch: 'main' }));
        const unmerged = box(
            git({ conflicted: [{ path: 'x', status: 'UU', added: 0, deleted: 0 }] })
        );

        // the reason is the disabled button's hover words, so no line of its own is drawn
        expect(nothing).not.toContain('class="none');
        // the same holds for an unmerged path, whose reason is also the hover words of the button
        expect(unmerged).not.toContain('class="none');
    });

    it('is the disabled Commit with nothing to commit and nothing to sync, saying why', () => {
        const body = box(git({ upstream: true, branches: TRACKING }));

        expect(action()).toMatchObject({
            label: catalog['git.commit'],
            disabled: true,
            title: catalog['git.commit_none']
        });
        expect(body).toContain(`aria-label="${catalog['git.commit_more']}"`);
    });

    it('is Sync Changes with the behind and ahead counts when the branch is ahead of its upstream', () => {
        const state = git({ upstream: true, branches: TRACKING, ahead: 2, behind: 1 });
        const body = box(state);
        const button = action();

        expect(button).toMatchObject({
            label: catalog['repositories.sync_changes'],
            glyph: 'sync'
        });
        expect(button?.joined).not.toBe(true);
        // Sync Changes has no other ways to offer, so no dropdown part is joined to it
        expect(body).not.toContain(`aria-label="${catalog['git.commit_more']}"`);
        expect(buttonWords(body, catalog['repositories.sync_changes'])).toBe(
            `${catalog['repositories.sync_changes']} 1 2`
        );
    });

    it('asks the Sync question first and runs the store call on a yes only', () => {
        const calls: string[] = [];
        client.repositories.sync = (root: string): Promise<boolean> => {
            calls.push(root);
            return Promise.resolve(true);
        };
        pressWhenDrawn(ToolButton, (props) => props.primary === true);
        box(git({ upstream: true, branches: TRACKING, ahead: 2, behind: 1 }));

        expect(calls).toEqual([]);
        const question = drawn(AskConfirm).at(-1)?.asking as {
            message: string;
            act: () => void;
        } | null;
        expect(question?.message).toBe(
            catalog['repositories.sync_confirm']
                .replace('{0}', 'main')
                .replace('{1}', 'origin/main')
        );
        question?.act();
        expect(calls).toEqual([HUB]);
    });

    it('is Publish Branch with a cloud when there is nothing to commit and the branch has no upstream', () => {
        const body = box(git({ upstream: false, remotes: ['origin'] }));

        expect(action()).toMatchObject({
            label: catalog['repositories.publish'],
            glyph: 'publish'
        });
        // Publish Branch has no other ways to offer, so no dropdown part is joined to it
        expect(body).not.toContain(`aria-label="${catalog['git.commit_more']}"`);
    });

    it('asks the Publish question for the first remote', () => {
        const calls: string[][] = [];
        client.repositories.publish = (root: string, remote: string): Promise<boolean> => {
            calls.push([root, remote]);
            return Promise.resolve(true);
        };
        pressWhenDrawn(ToolButton, (props) => props.primary === true);
        box(git({ upstream: false, remotes: ['origin', 'backup'] }));

        const question = drawn(AskConfirm).at(-1)?.asking as {
            message: string;
            act: () => void;
        } | null;
        expect(question?.message).toBe(
            catalog['repositories.publish_confirm'].replace('{0}', 'main').replace('{1}', 'origin')
        );
        question?.act();
        expect(calls).toEqual([[HUB, 'origin']]);
    });

    it('is disabled with the busy words in the sync and publish states while a write runs', async () => {
        let release: () => void = () => undefined;
        const held = new Promise<Response>((settle) => {
            release = (): void => settle(new Response('{}', { status: 200 }));
        });
        vi.stubGlobal('fetch', () => held);
        const first = client.repositories.stage(HUB, 'a.ts');

        box(git({ upstream: true, branches: TRACKING, ahead: 2 }));
        expect(action()).toMatchObject({ disabled: true, title: catalog['git.busy'] });

        clear(ToolButton);
        box(git({ upstream: false, remotes: ['origin'] }));
        expect(action()).toMatchObject({ disabled: true, title: catalog['git.busy'] });

        release();
        await first;
        vi.unstubAllGlobals();
    });
});

describe('the message field under body.rice', () => {
    const source = readFileSync('src/lib/views/shared/changes/CommitBox.svelte', 'utf8');
    const textArea = readFileSync('src/lib/ui/forms/TextArea.svelte', 'utf8');
    const rule = (from: string, selector: string): string => {
        const at = from.indexOf(`${selector} {`);
        return at < 0 ? '' : from.slice(at, from.indexOf('}', at));
    };

    it('audits that draws the terminal form of a text area: a line at its left, no radius, no fill', () => {
        const terminal = rule(textArea, '    :global(body.rice) .area');
        const box = rule(source, '    :global(body.rice) .box');

        expect(terminal).toContain('border-left: 1px solid var(--line)');
        expect(terminal).toContain('border-radius: 0');
        expect(box).toContain('border-left: 1px solid var(--line)');
        expect(box).toContain('border-radius: 0');
        expect(box).toContain('background: none');
        expect(rule(source, '    :global(body.rice) .box:focus-within')).toContain(
            'border-left-color: var(--accent)'
        );
    });

    it('audits that leaves the mono font of the terminal form to the text area, whose bare rule keeps it', () => {
        expect(rule(textArea, '    :global(body.rice) .area')).toContain(
            'font-family: var(--font-mono)'
        );
        // the bare rule takes the border, fill and padding away and sets no font
        expect(rule(textArea, '    :global(body.rice) .area.bare')).not.toContain('font');
    });

    it('audits that draws it by the rules scope and never by a forced override', () => {
        // the order and scope of the rules decide which one draws, so a forced override would only
        // hide a clash between two of them
        expect(source).not.toContain('!important');
    });
});
