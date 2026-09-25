// The Agents view in a real browser, over a builder a launcher started as a process of its own: the
// launch note written under the served run's home places it under its orchestrating session, the
// row says it was launched, and pressing its open control brings the builder's own turns up in a
// Transcript view. A stamp in the note reaches the open page through the note's watch, a running
// launch's count moves while the page is open, and a stamped one counts its start to its end.
//
// A session reaches the page as a transcript in the store the served run reads, and a launch as a
// record of ~/.oculus/dispatches.json in the run's own home directory, which
// tests/browser/helpers/serve.ts makes beside the hub copy; the sessions watcher rescans when
// either changes. Every file this spec writes is under the temporary directory, asserted before
// the write, and removed when the case ends.

import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { servedHomeDir } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';

/** A path is written to only after this says it is inside the temporary directory. */
function inside(path: string): string {
    expect(resolve(path).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return path;
}

/** The folder this spec's transcripts go in, under the served run's store. */
function store(): string {
    const root = join(servedHomeDir(), '.claude', 'projects');
    if (!existsSync(root)) throw new Error(`the served run has no session store at ${root}`);
    return inside(join(root, 'oculus-agents-spec'));
}

/** The served run's launch note. */
function note(): string {
    return inside(join(servedHomeDir(), '.oculus', 'dispatches.json'));
}

/** A transcript named `title` whose one answer is `said`, stamped now; its path. */
function session(id: string, title: string, said: string): string {
    const when = new Date().toISOString();
    const line = { timestamp: when, cwd: servedHomeDir(), gitBranch: '', version: '2.0.0' };
    const rows = [
        { type: 'ai-title', aiTitle: title },
        {
            type: 'user',
            ...line,
            origin: { kind: 'human' },
            message: { role: 'user', content: 'Do the step.' }
        },
        {
            type: 'assistant',
            ...line,
            message: {
                role: 'assistant',
                model: 'claude-opus-5',
                content: [{ type: 'text', text: said }],
                usage: { input_tokens: 1, output_tokens: 1 }
            }
        }
    ];
    mkdirSync(store(), { recursive: true });
    const file = inside(join(store(), `${id}.jsonl`));
    writeFileSync(file, rows.map((row) => JSON.stringify(row)).join('\n') + '\n');
    return file;
}

test.afterEach(() => {
    rmSync(note(), { force: true });
    for (const name of readdirSync(store())) {
        rmSync(inside(join(store(), name)), { recursive: true, force: true });
    }
});

test('draws the launch under its orchestrator and opens its own transcript', async ({ page }) => {
    const parent = randomUUID();
    const child = randomUUID();
    session(parent, 'Agents spec orchestrator', 'Launched the builder.');
    const transcript = session(child, 'Agents spec builder', 'Built the step in its worktree.');
    mkdirSync(join(servedHomeDir(), '.oculus'), { recursive: true });
    writeFileSync(
        note(),
        JSON.stringify([
            {
                id: 'agents-spec-launch',
                launcher: 'plan-orchestration',
                label: 'Agents spec step',
                harness: 'claude',
                model: 'claude-opus-5',
                parent,
                cwd: servedHomeDir(),
                transcript,
                startedAt: new Date().toISOString(),
                endedAt: ''
            }
        ])
    );

    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    await page.getByRole('tab', { name: t('sessions.rail_title') }).click();
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    if ((await ended.getAttribute('aria-expanded')) !== 'true') await ended.click();
    const row = page.locator('.row').filter({ hasText: 'Agents spec orchestrator' }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button.pick').click();

    await openView(page, 'agents', t('sessions.view_agents'));
    const launched = page.locator('.agents [data-launched="true"]');
    await expect(launched).toHaveCount(1, { timeout: 15000 });
    await expect(launched).toContainText(t('sessions.ag_launched'));
    await expect(launched).toContainText(t('sessions.ag_claude'));
    await expect(launched).toContainText('Agents spec step');
    // No end is stamped, and the builder's own session is not running, so the row reads done.
    await expect(launched).toContainText(t('sessions.ag_done'));

    // revert: src/lib/views/sessions/agents/Agents.svelte:133 => if (session !== null) openView('transcript');
    await launched.getByRole('button', { name: t('sessions.ag_open') }).click();
    const chat = page.locator('.chat[data-instance]').filter({ hasText: 'Built the step' });
    await expect(chat).toBeVisible({ timeout: 15000 });
    await expect(chat).toContainText('Built the step in its worktree.');
    await expect(chat).not.toContainText('Launched the builder.');
});

test('marks the launch ended once its note is stamped', async ({ page }) => {
    const parent = randomUUID();
    session(parent, 'Agents spec ended orchestrator', 'Launched and waited.');
    mkdirSync(join(servedHomeDir(), '.oculus'), { recursive: true });
    const started = Date.now() - 60000;
    const record = {
        id: 'agents-spec-ended',
        launcher: 'plan-orchestration',
        label: 'Agents spec ended step',
        harness: 'codex',
        model: 'gpt-5.6-sol',
        parent,
        cwd: servedHomeDir(),
        transcript: '',
        startedAt: new Date(started).toISOString(),
        endedAt: ''
    };
    // A second launch whose recorded process no longer runs: it reads done already, with no end.
    const exited = {
        ...record,
        id: 'agents-spec-exited',
        label: 'Agents spec exited step',
        pid: 2147483646,
        pidStart: ''
    };
    writeFileSync(note(), JSON.stringify([record, exited]));

    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    await page.getByRole('tab', { name: t('sessions.rail_title') }).click();
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    if ((await ended.getAttribute('aria-expanded')) !== 'true') await ended.click();
    const row = page.locator('.row').filter({ hasText: 'Agents spec ended orchestrator' });
    await expect(row.first()).toBeVisible({ timeout: 15000 });
    await row.first().locator('button.pick').click();
    await openView(page, 'agents', t('sessions.view_agents'));
    const launched = page.locator('.agents [data-agent="dispatch:agents-spec-ended"]');
    await expect(launched).toContainText(t('sessions.ag_running'), { timeout: 15000 });
    await expect(launched).toContainText(t('sessions.ag_codex'));
    // No transcript is known, so the row offers nothing to open.
    await expect(launched.getByRole('button')).toHaveCount(0);

    // The launcher's `end`, which reaches the open page on the sessions channel.
    const closed = { ...record, endedAt: new Date().toISOString() };
    writeFileSync(note(), JSON.stringify([closed, exited]));
    await expect(launched).toContainText(t('sessions.ag_done'), { timeout: 15000 });

    // A stamp that leaves every status as it was reaches the page only through the note's watch,
    // since the liveness re-check publishes only when a status moves.
    // revert: src/lib/server/root/watch/sessions.ts:292 => delete
    const gone = page.locator('.agents [data-agent="dispatch:agents-spec-exited"] .st');
    await expect(gone).toHaveText(t('sessions.ag_done'));
    const stamped = { ...exited, endedAt: new Date(started + 90_000).toISOString() };
    writeFileSync(note(), JSON.stringify([closed, stamped]));
    await expect(gone).toHaveText(
        [t('sessions.ag_done'), t('sessions.ag_mins', '1', '30')].join(
            ` ${t('sessions.meta_sep')} `
        ),
        { timeout: 15000 }
    );
});

test('counts a running launch on while the page is open, and a stamped one from start to end', async ({
    page
}) => {
    // revert: src/lib/views/sessions/agents/Agents.svelte:77 => const timer = 0;
    const parent = randomUUID();
    session(parent, 'Agents spec counting orchestrator', 'Launched and counted.');
    mkdirSync(join(servedHomeDir(), '.oculus'), { recursive: true });
    const started = Date.now() - 20_000;
    const record = {
        id: 'agents-spec-counting',
        launcher: 'plan-orchestration',
        label: 'Agents spec counting step',
        harness: 'codex',
        model: 'gpt-5.6-sol',
        parent,
        cwd: servedHomeDir(),
        transcript: '',
        startedAt: new Date(started).toISOString(),
        endedAt: ''
    };
    writeFileSync(note(), JSON.stringify([record]));

    await boot(page);
    await openView(page, 'session-list', t('sessions.rail_title'));
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    if ((await ended.getAttribute('aria-expanded')) !== 'true') await ended.click();
    const row = page.locator('.row').filter({ hasText: 'Agents spec counting orchestrator' });
    await expect(row.first()).toBeVisible({ timeout: 15000 });
    await row.first().locator('button.pick').click();
    await openView(page, 'agents', t('sessions.view_agents'));
    const line = page.locator('.agents [data-launched="true"] .st');
    await expect(line).toContainText(t('sessions.ag_running'), { timeout: 15000 });

    // Nothing reaches the page while the launch runs unchanged, and its count still moves.
    const first = await line.textContent();
    await expect.poll(() => line.textContent(), { timeout: 5000 }).not.toBe(first);

    // The launcher stamps the end 90 s after the start: the row counts that span, not the page's.
    writeFileSync(
        note(),
        JSON.stringify([{ ...record, endedAt: new Date(started + 90_000).toISOString() }])
    );
    await expect(line).toHaveText(
        [t('sessions.ag_done'), t('sessions.ag_mins', '1', '30')].join(
            ` ${t('sessions.meta_sep')} `
        ),
        { timeout: 15000 }
    );
});
