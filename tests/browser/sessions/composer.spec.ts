// Layer 4, browser test. The composer of a new session on the Sessions page, over the served run's
// own tmux: a Shell start types its prompt into the shell as its first command, and a Claude start
// hands the stand-in `claude` of tests/browser/helpers/serve.ts the picked flags and the prompt as
// one last argument, which no shell reads. The picks stay with the tab for its next composer. The
// served run's local.yml names two Claude accounts, the tool's own folder and a folder of the run,
// and its server has CLAUDE_CONFIG_DIR set to a third folder no account names: the stand-in records
// the variable it was started with, so the default account is seen to take it away and the second
// account to set it to its own folder.
//
// The served run's tmux is the machine's own on a socket inside the run's directory, so what these
// cases start is listed by no tmux server of the owner's; each case ends that server when it is
// done, and the run removes the socket with its directory. Every file written is under the
// temporary directory, asserted before the write.

import { expect, test, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import { endServedTerminals, servedArgvDir, startedEnv, startedWith } from '../helpers/hub.ts';
import { SHOWN_VIEW, boot, showRailPage } from '../helpers/rail.ts';
import { t, tabNamed } from '../helpers/words.ts';

/** A path is written to only after this says it is inside the temporary directory. */
function inside(path: string): string {
    expect(resolve(path).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return path;
}

test.afterAll(sweepScratch);

test.afterEach(endServedTerminals);

/** The Sessions page, with its Terminal tab showing a composer. */
async function composer(page: Page): Promise<void> {
    await boot(page);
    await showRailPage(page, 'sessions');
    await page.getByRole('tab', { name: tabNamed(t('sessions.view_terminal')) }).click();
    await expect(page.locator(`${SHOWN_VIEW} [data-composer]`)).toBeVisible();
}

/** Pick one entry of a composer picker, by the picker's key and the entry's words. */
async function pick(page: Page, key: string, label: string): Promise<void> {
    await page.locator(`${SHOWN_VIEW} [data-picker="${key}"] button`).first().click();
    await page.getByRole('menuitem', { name: label, exact: true }).click();
}

// revert: src/lib/server/machine/pty/routes.ts "if (composed.keys.trim() !== '') await steerTerminal(id, composed.keys, options);" => if (composed.keys.trim() === 'never') await steerTerminal(id, composed.keys, options);
test('a Shell start hides the agent pickers and runs its prompt as the first command', async ({
    page
}) => {
    await composer(page);
    await pick(page, 'agent', t('sessions.kind_shell'));
    const shown = page.locator(SHOWN_VIEW);
    // A shell takes no flags of an agent's catalog, so its composer offers none to pick.
    await expect(shown.locator('[data-picker="model"]')).toHaveCount(0);
    await expect(shown.locator('[data-picker="agent"]')).toHaveCount(1);
    const box = shown.getByRole('textbox', { name: t('composer.command') });
    await box.fill('echo composer-spec-$((6*7))');
    await box.press('Enter');
    await expect(shown.locator('[data-terminal]')).toHaveCount(1, { timeout: 15000 });
    await expect(shown.locator('.xterm-rows')).toContainText('composer-spec-42', {
        timeout: 15000
    });
});

// revert: src/lib/server/machine/pty/compose.ts "if (prompt.trim() !== '') argv.push('--', prompt);" => if (prompt.trim() !== '') argv.push('--', ...prompt.split(' '));
test('a Claude start passes the picked flags and the prompt as one argument no shell reads', async ({
    page
}) => {
    const marker = join(inside(scratchDir('oculus-composer-spec-')), 'x');
    const prompt = `$(touch ${marker}); echo "q' ; rm -rf ~"`;
    await composer(page);
    await pick(page, 'model', 'Opus');
    await pick(page, 'effort', 'High');
    const shown = page.locator(SHOWN_VIEW);
    const box = shown.getByRole('textbox', { name: t('composer.prompt') });
    await box.fill(prompt);
    // Shift+Enter is a new line of the prompt, and starts nothing.
    await box.press('Shift+Enter');
    await expect(box).toHaveValue(`${prompt}\n`);
    await box.press('Backspace');
    await box.press('Enter');

    await expect.poll(() => startedWith('claude'), { timeout: 15000 }).toHaveLength(1);
    const [words] = startedWith('claude');
    const flags = ['--model', 'opus', '--effort', 'high', '--permission-mode', 'manual'];
    expect(words).toEqual([...flags, '--', prompt]);
    expect(existsSync(marker)).toBe(false);
    // revert: src/lib/server/machine/pty/compose.ts "return { prefix: ['env', '-u', variable], env: {} };" => return { prefix: [], env: {} };
    expect(startedEnv('claude')).toEqual([{}]);
    await expect(shown.locator('[data-terminal]')).toHaveCount(1);

    // The tab's next composer opens on the picks its last start used.
    await page.getByRole('button', { name: t('sessions.new_session'), exact: true }).click();
    await expect(shown.locator('[data-composer]')).toBeVisible();
    await expect(shown.locator('[data-picker="model"] button').first()).toHaveAccessibleName(
        'Opus'
    );
});

// revert: src/lib/server/machine/pty/compose.ts "return { prefix: [], env: { [variable]: resolve(account.dir) } };" => return { prefix: [], env: {} };
test('a Claude start with the second account and Plan runs in that account with that mode', async ({
    page
}) => {
    const work = join(dirname(servedArgvDir()), 'accounts', 'claude-work');
    await composer(page);
    await pick(page, 'account', 'work');
    // revert: src/lib/server/machine/pty/compose.ts "const flags = choiceArgs(accountChoices(own, account), request.picks);" => const flags = choiceArgs(accountChoices(own, account), {});
    await pick(page, 'mode', 'Plan');
    const shown = page.locator(SHOWN_VIEW);
    const box = shown.getByRole('textbox', { name: t('composer.prompt') });
    await box.fill('plan the change');
    await box.press('Enter');

    await expect.poll(() => startedWith('claude'), { timeout: 15000 }).toHaveLength(1);
    expect(startedWith('claude')).toEqual([['--permission-mode', 'plan', '--', 'plan the change']]);
    expect(startedEnv('claude')).toEqual([{ CLAUDE_CONFIG_DIR: work }]);
});

// revert: src/lib/views/sessions/terminal/TerminalPicker.svelte "else pinInstance(instance, choice.terminal, choice.label);" => else undefined;
test('the Terminal bar picks among the terminals oculus runs, and pins a tab of its own to the pick', async ({
    page
}) => {
    await composer(page);
    await pick(page, 'agent', t('sessions.kind_shell'));
    const shown = page.locator(SHOWN_VIEW);
    const box = shown.getByRole('textbox', { name: t('composer.command') });
    await box.fill('echo picker-spec');
    await box.press('Enter');
    await expect(shown.locator('[data-terminal]')).toHaveCount(1, { timeout: 15000 });
    const made = await shown.locator('[data-terminal]').getAttribute('data-terminal');

    await page.getByRole('button', { name: t('sessions.new_terminal'), exact: true }).click();
    await expect(shown.locator('[data-composer]')).toBeVisible();
    await shown.locator('[data-session-picker] button').first().click();
    await expect(page.getByRole('menuitem')).toHaveCount(1);
    await page.getByRole('menuitem').first().click();
    await expect(shown.locator('[data-terminal]')).toHaveAttribute('data-terminal', made ?? '');
});
