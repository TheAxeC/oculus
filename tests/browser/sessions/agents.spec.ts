// The Agents view in a real browser, over a builder a launcher started as a process of its own: the
// launch note written under the served run's home places it under its orchestrating session, the
// row says it was launched, and pressing its open control brings the builder's own turns up in a
// Transcript view.
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

    // revert: src/lib/views/sessions/agents/Agents.svelte:105 => if (session !== null) openView('transcript');
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
    const record = {
        id: 'agents-spec-ended',
        launcher: 'plan-orchestration',
        label: 'Agents spec ended step',
        harness: 'codex',
        model: 'gpt-5.6-sol',
        parent,
        cwd: servedHomeDir(),
        transcript: '',
        startedAt: new Date(Date.now() - 60000).toISOString(),
        endedAt: ''
    };
    writeFileSync(note(), JSON.stringify([record]));

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
    const launched = page.locator('.agents [data-launched="true"]');
    await expect(launched).toContainText(t('sessions.ag_running'), { timeout: 15000 });
    await expect(launched).toContainText(t('sessions.ag_codex'));
    // No transcript is known, so the row offers nothing to open.
    await expect(launched.getByRole('button')).toHaveCount(0);

    // The launcher's `end`, which reaches the open page on the sessions channel.
    // revert: src/lib/server/watch/sessions.ts:279 => delete
    writeFileSync(note(), JSON.stringify([{ ...record, endedAt: new Date().toISOString() }]));
    await expect(launched).toContainText(t('sessions.ag_done'), { timeout: 15000 });
});
