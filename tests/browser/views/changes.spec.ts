// The Sessions view's Changes panel in a real browser, over sessions whose workspaces are folders
// this spec makes: a repository with a commit, a repository with no commit yet, a folder that is no
// repository, a folder that is not there at all, and a repository whose status read fails on a
// broken index. Each drawn state is checked with the branch listing the panel fetches from /api/git
// counted per workspace, since the fetch runs in an effect and the node suite renders no effect.
//
// A session reaches the page as a transcript in the store the served run reads:
// tests/browser/helpers/serve.ts makes the run's own home directory beside the hub copy, and the
// sessions watcher reads its ~/.claude/projects again when a file lands there. Every folder and
// transcript this spec writes is under the temporary directory, asserted before the write, and
// removed when the case ends.

import { expect, test, type Page, type Route } from '@playwright/test';
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { gitIn } from '../helpers/git.ts';
import { servedHomeDir, writeTranscript } from '../helpers/hub.ts';
import { boot, openView } from '../helpers/rail.ts';
import { t } from '../helpers/words.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

test.afterAll(sweepScratch);

/** Every folder this case made, taken away when it ends however it ended. */
const made: string[] = [];

/** A path is written to only after this says it is inside the temporary directory. */
function inside(path: string): string {
    expect(resolve(path).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return path;
}

/**
 * A fresh folder under the temporary directory, registered for removal before anything writes it.
 */
function folder(name: string): string {
    const dir = inside(scratchDir(`oculus-changes-spec-${name}-`));
    made.push(dir);
    return dir;
}

/** The folder this spec's transcripts go in, under the store. */
const SPEC_STORE = 'oculus-changes-spec';

/**
 * The served run's session store, under the home directory tests/browser/helpers/serve.ts makes.
 */
function storeRoot(): string {
    return inside(join(servedHomeDir(), '.claude', 'projects'));
}

/**
 * Where this spec writes its transcripts. A run whose home directory is somewhere else is named
 * here, rather than reaching the page as a session that never appears.
 */
function store(): string {
    const root = storeRoot();
    if (!existsSync(root)) throw new Error(`the served run has no session store at ${root}`);
    return inside(join(root, SPEC_STORE));
}

/** A transcript whose session works in `cwd` and is named `title`, stamped with this moment. */
function session(title: string, cwd: string): void {
    writeTranscript(store(), title, cwd, { asked: 'Look at the changes.', answered: 'Looked.' });
}

/** The workspace a branch listing was asked for, or empty for any other request. */
function rootOf(url: string): string {
    const parsed = new URL(url);
    return parsed.pathname === '/api/git' ? (parsed.searchParams.get('root') ?? '') : '';
}

/** Count every branch listing per workspace, and let each one through unless `hold` takes it. */
async function listings(
    page: Page,
    hold: (root: string, route: Route) => boolean = () => false
): Promise<Map<string, number>> {
    const asked = new Map<string, number>();
    await page.route(
        (url) => rootOf(url.href) !== '',
        async (route) => {
            const root = rootOf(route.request().url());
            asked.set(root, (asked.get(root) ?? 0) + 1);
            if (hold(root, route)) return;
            await route.continue();
        }
    );
    return asked;
}

/** Select one of this spec's sessions in the list and bring the Changes panel up over it. */
async function showChanges(page: Page, title: string): Promise<void> {
    await page.getByRole('tab', { name: t('sessions.rail_title') }).click();
    // The sessions are not running, so the list keeps them behind the ended head.
    const ended = page.locator('button.ended-h');
    await expect(ended).toHaveCount(1, { timeout: 15000 });
    if ((await ended.getAttribute('aria-expanded')) !== 'true') await ended.click();
    const row = page.locator('.row').filter({ hasText: title }).first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.locator('button.pick').click();
    await page.getByRole('tab', { name: t('sessions.view_changes') }).click();
}

test.describe('the Changes panel', () => {
    // The session files go, the folder stays: the session watcher watches this directory, and a
    // directory removed and remade between cases is not always seen again before the next case asks
    // for its sessions.
    test.afterEach(() => {
        for (const dir of made.splice(0)) rmSync(inside(dir), { recursive: true, force: true });
        for (const name of readdirSync(store())) {
            rmSync(inside(join(store(), name)), { recursive: true, force: true });
        }
    });

    // Revert: in the effect of views/sessions/changes/Changes.svelte, fetch whenever the workspace
    // is not empty, whatever `shape` holds.
    test('draws each state of a workspace, and lists branches only for a repository that reads', async ({
        page
    }) => {
        const committed = folder('committed');
        writeFileSync(inside(join(committed, 'kept.txt')), 'kept\n');
        gitIn(committed, 'init', '--quiet', '--initial-branch=main');
        gitIn(committed, 'add', '--all');
        gitIn(committed, 'commit', '--quiet', '-m', 'one');

        const fresh = folder('fresh');
        gitIn(fresh, 'init', '--quiet', '--initial-branch=start');
        writeFileSync(inside(join(fresh, 'loose.txt')), 'loose\n');

        const plain = folder('plain');

        const broken = folder('broken');
        gitIn(broken, 'init', '--quiet', '--initial-branch=main');
        // An index git cannot parse: the root is a repository, and its status read fails.
        writeFileSync(inside(join(broken, '.git', 'index')), 'not an index\n');

        session('Changes spec committed', committed);
        session('Changes spec fresh', fresh);
        session('Changes spec plain', plain);
        session('Changes spec broken', broken);

        const asked = await listings(page);
        await boot(page);
        await openView(page, 'session-list', t('sessions.rail_title'));
        await openView(page, 'changes', t('sessions.view_changes'));
        const panel = page.locator('.changes[data-instance]');

        await showChanges(page, 'Changes spec committed');
        await expect(panel.locator('[data-repo="readable"]')).toBeVisible({ timeout: 15000 });
        await expect.poll(() => asked.get(committed) ?? 0).toBeGreaterThan(0);

        await showChanges(page, 'Changes spec fresh');
        const readable = panel.locator('[data-repo="readable"]');
        await expect(readable).toBeVisible({ timeout: 15000 });
        await expect(readable.getByRole('button', { name: 'start', exact: true })).toBeVisible();
        await expect(readable.getByText('loose.txt')).toBeVisible();
        await expect(readable.getByText(t('git.push_none'))).toBeVisible();
        // this workspace has something to push, so it is not drawn as in sync
        await expect(panel.getByText(t('sessions.ch_insync'))).toHaveCount(0);
        await expect.poll(() => asked.get(fresh) ?? 0).toBeGreaterThan(0);

        await showChanges(page, 'Changes spec plain');
        await expect(panel.locator('[data-repo="none"]')).toBeVisible({ timeout: 15000 });
        await expect(panel.getByText(t('sessions.ch_norepo'))).toBeVisible();
        // the panel draws the workspace it was shown, which is this one alone
        await expect(panel.locator('[data-repo="readable"]')).toHaveCount(0);

        await showChanges(page, 'Changes spec broken');
        const failed = panel.locator('[data-repo="failed"]');
        await expect(failed).toBeVisible({ timeout: 15000 });
        await expect(failed).toContainText(t('sessions.ch_failed', '').trim());
        await expect(failed).toContainText('index');
        // the workspace is a repository whose read failed, not a folder without one
        await expect(panel.getByText(t('sessions.ch_norepo'))).toHaveCount(0);
        // and the panel draws the workspace it was shown, which is this one alone
        await expect(panel.locator('[data-repo="readable"]')).toHaveCount(0);

        expect(asked.get(plain) ?? 0).toBe(0);
        expect(asked.get(broken) ?? 0).toBe(0);
    });

    // Revert: return 'none' for a root that is not there in views/shared/changes/repo-shape.ts, or
    // set `gone.present = true` in state() of server/git/git.ts where nothing is at the path. This
    // case is over the server and the view together, so either turns it red.
    test('says the workspace folder of a session whose folder has gone is not there', async ({
        page
    }) => {
        const away = folder('gone');
        session('Changes spec gone', away);
        // The folder goes before the page is opened, so the first state the channel carries for the
        // root already says it is not there.
        rmSync(inside(away), { recursive: true, force: true });

        await boot(page);
        await openView(page, 'session-list', t('sessions.rail_title'));
        await openView(page, 'changes', t('sessions.view_changes'));
        const panel = page.locator('.changes[data-instance]');

        await showChanges(page, 'Changes spec gone');
        await expect(panel.locator('[data-repo="missing"]')).toBeVisible({ timeout: 15000 });
        await expect(panel.getByText(t('sessions.ch_nofolder'))).toBeVisible();
        // The folder has gone, so the panel must not also claim it holds no repository.
        await expect(panel.getByText(t('sessions.ch_norepo'))).toHaveCount(0);
        // Nothing can be read at a folder that is not there, so no reading drawing appears.
        await expect(panel.locator('[data-repo="readable"]')).toHaveCount(0);
    });

    // Revert: in load() of views/sessions/changes/Changes.svelte, write `branches = listed`
    // whatever `mine === asked` says.
    test('keeps the newest branch listing when an older one answers after it', async ({ page }) => {
        const repo = folder('superseded');
        writeFileSync(inside(join(repo, 'kept.txt')), 'kept\n');
        gitIn(repo, 'init', '--quiet', '--initial-branch=main');
        gitIn(repo, 'add', '--all');
        gitIn(repo, 'commit', '--quiet', '-m', 'one');
        session('Changes spec superseded', repo);

        let held: Route | null = null;
        const asked = await listings(page, (root, route) => {
            if (root !== repo || held !== null) return false;
            held = route;
            return true;
        });
        await boot(page);
        await openView(page, 'session-list', t('sessions.rail_title'));
        await openView(page, 'changes', t('sessions.view_changes'));
        await showChanges(page, 'Changes spec superseded');
        const readable = page.locator('.changes[data-instance] [data-repo="readable"]');
        await expect(readable).toBeVisible({ timeout: 15000 });
        await expect.poll(() => held !== null).toBe(true);

        // A file written in the repository makes the channel send a new state, which asks again;
        // that listing answers first.
        const answered = page.waitForResponse((response) => rootOf(response.url()) === repo, {
            timeout: 15000
        });
        writeFileSync(inside(join(repo, 'new.txt')), 'new\n');
        await answered;
        await expect(readable.getByText('new.txt')).toBeVisible();
        expect(asked.get(repo) ?? 0).toBeGreaterThan(1);

        // The first listing now answers with a branch the repository does not have.
        const stale = held as Route | null;
        if (stale === null) throw new Error('no listing was held');
        await stale.fulfill({
            json: { branches: [{ name: 'stale', upstream: '', current: false }] }
        });

        await readable.getByRole('button', { name: 'main', exact: true }).click();
        await expect(page.getByRole('menuitem', { name: 'main', exact: true })).toBeVisible();
        // the listing that answered with it was the older one, which a later listing has replaced
        await expect(page.getByRole('menuitem', { name: 'stale', exact: true })).toHaveCount(0);
        await page.keyboard.press('Escape');
    });
});
