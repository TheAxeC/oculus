// Layer 2, client state. The page's end of the write endpoint: the token it was given, the POST it
// makes, and whether one is in flight. The decision on live data is that writes are fetch
// POSTs, so nothing here goes over the socket; what the page sees of its own write is the watcher's
// next push of the portfolio, about a fifth of a second later.
//
// A 403 without a field refusal can mean the server minted a new token while the page kept the old
// one. It reloads the page data and retries once. A field refusal, such as an open path outside the
// folders of the workspace, is reported without retrying.
//
// Every write that does not land, refused by the server or given no answer, is also said to
// whatever registered through onUnwritten, which is the notification the status bar's bell counts,
// beside the line the view that sent it draws. It is said once per write, after the one retry a
// stale token gets, and a caller that says it in a notification of its own sends with `said`.
//
// A write over a hub file that a source tab of this page holds unsaved text of is refused before it
// is sent, whichever control sent it, with the sentence of `app.file_unsaved` said once through
// onUnwritten as any refusal is; the text of the tab is kept. The file is named from the write's
// own arguments by sessions/source/write-files.ts, and whether a tab holds unsaved text of it is
// the predicate createWrites is handed.
//
// `postCommand` is the other POST here: a command to the mail, calendar and account endpoints,
// carrying the same token, answered as `Posted`. It neither retries on a 403 nor tells
// onUnwritten; the store that sent it says its failure in its own view.

import { tick } from 'svelte';
import { fields } from '../../data/helpers/guards.ts';
import { addressOfId, keyOf } from '../../data/helpers/hub-names.ts';
import { readJson } from '../../data/shapes/shapes.ts';
import { answerShape, refusalsShape, writeTimeout } from './shapes/write-answer.ts';
import { APP_HEADER, KIND_HEADER, appHeaderValue } from '../../data/helpers/files/apps/apps.ts';
import { failedAnswer, unreadableAnswer } from '../shared/answers/answers.ts';
import { t } from '../shared/words/text.ts';
import {
    NO_LOOKUPS,
    depositedFile,
    unsavedAnswer,
    writtenFile,
    type FileLookups
} from '../sessions/source/write-files.ts';
import { isPageFeed, type Settle } from '../forms/page-entry.ts';
import type { RailEntry } from '../../data/sources/config/rail.ts';
import type {
    DeckEditAct,
    FollowupAction,
    NewIdeaFields,
    SendOptions,
    SessionFields,
    SubtaskAction,
    SubtaskTarget,
    Posted,
    WriteAnswer,
    WritesStore
} from '../shared/stores/shapes.ts';

export type {
    FollowupAction,
    SendOptions,
    SessionFields,
    SubtaskAction,
    SubtaskTarget,
    WriteAnswer,
    WritesStore
};

/** The endpoint that opens a file in its application or reveals a folder, behind the same token. */
export const OPEN_PATH = '/api/open';

/** The endpoint of the git panel: one action on one workspace, behind the same token. */
export const GIT_PATH = '/api/git';

/** The endpoint of the deposit panel: one action on one project, behind the same token. */
export const DEPOSIT_PATH = '/api/deposit';

/** The endpoint of the Memories wall: one picture added to the folder, behind the same token. */
export const MEMORIES_PATH = '/api/memories';

/**
 * One write's answer, whether the server gave it or the write got none, and whether its `error` is
 * the one the server's answer named (`coded`), which a caller's `words` say as a sentence.
 */
type Exchange = { answer: WriteAnswer; answered: boolean; coded?: boolean };

/** The sink that holds nothing, for a store built with none. Frozen, since such stores share it. */
const NO_SETTLE: Readonly<Settle> = Object.freeze({
    begin: () => 0,
    entry: () => undefined,
    added: () => undefined,
    feed: () => undefined,
    career: () => undefined
});

/** The fields of `sent` that an answer names as written. */
function takenFrom(sent: Record<string, unknown>, answer: WriteAnswer): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(sent).filter(([name]) => answer.changed.includes(name))
    );
}

/**
 * The page's writes. `settings` is the merged configuration as the page last received it, read at
 * each write, so a changed timeout applies to the next write without a reload. `heldUnsaved` says
 * whether a source tab of the page holds unsaved text of a file, `look` names a file a write
 * carries only an id of. `settle` is told what an entry write took, so a page shows it before the
 * rebuilt snapshot does (state/forms/settled.svelte.ts).
 */
export function createWrites(
    settings: () => Record<string, unknown> | null = () => null,
    heldUnsaved: (file: { root: string; path: string }) => boolean = () => false,
    look: Readonly<FileLookups> = NO_LOOKUPS,
    settle: Readonly<Settle> = NO_SETTLE
): WritesStore {
    const state: { pending: number; error: string | null } = $state({ pending: 0, error: null });

    let token = '';

    /** What registered to hear a write that did not land. */
    const unwrittenListeners: ((reason: string, refused: boolean) => void)[] = [];

    function onUnwritten(listener: (reason: string, refused: boolean) => void): void {
        unwrittenListeners.push(listener);
    }

    /**
     * Say a write that did not land to every listener: one the server refused, in whole or a field
     * of it, or one that got no answer, a refusal the server named by a code in the caller's
     * `words` for it. A listener that fails leaves the caller the answer it already has, which is
     * what the caller acts on.
     */
    function tell(sent: Exchange, options: SendOptions): WriteAnswer {
        const { answer, answered } = sent;
        if (options.said === true || (answer.ok && answer.refused.length === 0)) return answer;
        if (answer.code !== undefined && options.asked?.includes(answer.code) === true) {
            return answer;
        }
        const fields = answer.refused.map((one) => one.reason).filter((one) => one !== '');
        const { words } = options;
        const named = sent.coded === true && words !== undefined && answer.error !== undefined;
        const error = named ? words(answer.error ?? '', answer.reason) : (answer.error ?? '');
        const reason = fields.length > 0 ? fields.join('; ') : error;
        for (const listener of unwrittenListeners) {
            try {
                listener(reason, answered);
            } catch {
                continue;
            }
        }
        return answer;
    }

    /** What registered to hear the token change: the socket, which carries it to the server. */
    const tokenListeners: (() => void)[] = [];

    function onToken(listener: () => void): void {
        tokenListeners.push(listener);
    }

    /**
     * Install the token the page was given. Called from the page's load, on every load; a token
     * that differs from the one held is told to every listener.
     */
    function setToken(next: string): void {
        const given = typeof next === 'string' ? next : '';
        if (given === token) return;
        token = given;
        for (const listener of tokenListeners) {
            try {
                listener();
            } catch {
                continue;
            }
        }
    }

    /**
     * The token, for the one reader that is not a fetch: the socket sends it with its subscription,
     * so that a page which may write a manifest may also type into a terminal.
     */
    function writeToken(): string {
        return token;
    }

    /**
     * Run the page's load again, so that the token a restarted server minted replaces the stale
     * one. The import is here rather than at the top so nothing but a stale token pulls Kit's
     * navigation module in, and a server-rendered page never touches it. The load hands the token
     * to the page rather than installing it, and the page's effect is what puts it in this store;
     * the tick flushes that effect, so the next request carries the new token.
     */
    async function renewToken(): Promise<void> {
        const { invalidateAll } = await import('$app/navigation');
        await invalidateAll();
        await tick();
    }

    /**
     * Post one command to an endpoint of its own, which answers a JSON body of its own and not a
     * write's answer, with the page's token. A 403 renews the token and posts once more, as a
     * write does. A fetch that fails and an answer that is not JSON are answered as what went
     * wrong rather than thrown, so a press whose request did not come back says so in its view
     * instead of ending in a rejection nobody reads. A `keepalive` post outlives the page that
     * sent it, which is how a page that is closing says so.
     */
    async function postCommand(
        path: string,
        body: unknown,
        headers: Record<string, string> = {},
        keepalive = false
    ): Promise<Posted> {
        const send = (): Promise<Response> =>
            fetch(path, {
                method: 'POST',
                keepalive,
                headers: {
                    ...headers,
                    'content-type': 'application/json',
                    'x-oculus-token': token
                },
                body: JSON.stringify(body)
            });
        let response: Response;
        try {
            response = await send();
            if (response.status === 403) {
                await renewToken();
                response = await send();
            }
        } catch {
            return { ok: false, status: 0, body: {}, failed: 'unreachable' };
        }
        let parsed: unknown;
        try {
            parsed = await response.json();
        } catch {
            return { ok: false, status: response.status, body: {}, failed: 'unreadable' };
        }
        return { ok: response.ok, status: response.status, body: fields(parsed), failed: '' };
    }

    /** Whether a write is in flight. */
    function pending(): boolean {
        return state.pending > 0;
    }

    /** What the last write failed with, or null when the last one was answered. */
    function lastError(): string | null {
        return state.error;
    }

    async function post(
        body: unknown,
        path: string,
        signal: AbortSignal,
        extra: Record<string, string> = {}
    ): Promise<Response> {
        return fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': token, ...extra },
            body: JSON.stringify(body),
            signal
        });
    }

    /**
     * Set fields of one project's manifest. The answer says what changed and what was refused; a
     * request the server would not answer at all comes back as `ok: false` with the error it gave.
     */
    async function writeManifest(
        id: string,
        fields: Record<string, unknown>
    ): Promise<WriteAnswer> {
        return send({ kind: 'manifest', id, fields });
    }

    /**
     * Ask the local server to reveal one project folder, under the primary hub or the hub `root`.
     */
    async function openFolder(path: string, root = ''): Promise<WriteAnswer> {
        return send(root === '' ? { path } : { root, path }, OPEN_PATH);
    }

    /**
     * Ask the local server to open one file in the application `open.program_ext` names for it, or
     * reveal one folder, addressed the way the file browser addresses it: the key of a served root
     * and the path under that root.
     */
    async function openFile(root: string, path: string): Promise<WriteAnswer> {
        return send({ root, path }, OPEN_PATH);
    }

    /**
     * Ask the local server to reveal one file or folder in the file manager without opening it,
     * addressed as `openFile` addresses it.
     */
    async function revealPath(root: string, path: string): Promise<WriteAnswer> {
        return send({ root, path, reveal: true }, OPEN_PATH);
    }

    /**
     * Dismiss one session or bring it back, pin it to an area or unpin it, rename it or clear the
     * name. It is the same endpoint and the same token as a manifest write; what it writes is the
     * per-session overrides file rather than a project.yml, and the answer's `refused` names a
     * field the server would not write, an area that is not an absolute path above all.
     */
    async function writeSession(id: string, fields: SessionFields): Promise<WriteAnswer> {
        return send({ kind: 'session', id, ...fields });
    }

    /**
     * Set fields of one collection entry, found by the id the reader gave it. The same endpoint and
     * the same token as a manifest write; what it writes is one entry's lines inside its collection
     * file.
     */
    async function writeEntry(
        collection: string,
        id: string,
        fields: Record<string, unknown>
    ): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send({ kind: 'entry', collection, id, fields });
        settle.entry(collection, id, takenFrom(fields, answer), seq);
        return answer;
    }

    /**
     * Tick one subtask line, reopen it, snooze it until a date, change its text or its deadline, or
     * delete it. `key` is what the reader addressed the line by: the key of the map the file
     * writes, or the position in the list.
     */
    async function writeSubtask(
        target: SubtaskTarget,
        key: string,
        action: SubtaskAction,
        value?: string
    ): Promise<WriteAnswer> {
        return writeLine('subtask', target, key, action, value);
    }

    /**
     * Add one subtask line to a project or to a collection entry, making the block when it has
     * none.
     */
    async function addSubtask(
        target: SubtaskTarget,
        fields: { do: string; deadline?: string }
    ): Promise<WriteAnswer> {
        return send({ kind: 'subtask-add', target, fields });
    }

    /**
     * Take one follow-up note out once it is done, or change its text or the date before which it
     * stays hidden. `key` is the note's position in the `followup:` list.
     */
    async function writeFollowup(
        target: SubtaskTarget,
        key: string,
        action: FollowupAction,
        value?: string
    ): Promise<WriteAnswer> {
        return writeLine('followup', target, key, action, value);
    }

    /** One action on one line of a subtask list or a follow-up list, the two sent alike. */
    async function writeLine(
        kind: 'subtask' | 'followup',
        target: SubtaskTarget,
        key: string,
        action: SubtaskAction | FollowupAction,
        value: string | undefined
    ): Promise<WriteAnswer> {
        return send({ kind, target, key, action, ...(value === undefined ? {} : { value }) });
    }

    /**
     * Add one follow-up note to a project or a collection entry, making the list when it has none.
     */
    async function addFollowup(
        target: SubtaskTarget,
        fields: { do: string; after?: string }
    ): Promise<WriteAnswer> {
        return send({ kind: 'followup-add', target, fields });
    }

    /**
     * Set the changed sections of the career file: each key of `fields` is a section of the
     * file, and a section set to null is removed. A value that does not fit the section's type in
     * the file's own `schema:` is refused with its reason and the other sections are written.
     */
    async function writeCareer(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send({ kind: 'career', fields });
        settle.career(takenFrom(fields, answer), seq);
        return answer;
    }

    /**
     * Add one entry to a collection of the hub `root` names, else of the hub the server picks (the
     * primary, else the one hub of the workspace). The answer's `id` is the new entry's id in the
     * portfolio, the hub the server wrote and the key it gave the entry, which its page is opened
     * with and the entry is shown by until the snapshot holds it.
     */
    async function newEntry(
        collection: string,
        fields: Record<string, unknown>,
        root?: string
    ): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send(
            root === undefined
                ? { kind: 'new-entry', collection, fields }
                : { kind: 'new-entry', collection, fields, root }
        );
        if (answer.ok && answer.id !== undefined) settle.added(collection, answer.id, fields, seq);
        return answer;
    }

    /** Remove one entry from a collection, in the hub the entry's id names. */
    async function deleteEntry(collection: string, id: string): Promise<WriteAnswer> {
        return send({ kind: 'delete-entry', collection, id });
    }

    /**
     * Add one position lead to the leads feed of the primary hub, else the one hub. The answer's
     * `id` is the new lead's internal id, the hub the server wrote and its title, which the lead is
     * shown by until the feed holds it.
     */
    async function addLead(fields: Record<string, unknown>): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send({ kind: 'lead-add', fields });
        if (answer.ok && answer.id !== undefined) settle.added('leads', answer.id, fields, seq);
        return answer;
    }

    /**
     * Put one collection's entries in the order a drag left them. `order` is every entry's value of
     * the file's primary key, in the new order; an order that does not name every entry exactly
     * once is refused by the server and the file is left alone.
     */
    async function reorderEntries(collection: string, order: string[]): Promise<WriteAnswer> {
        return send({ kind: 'reorder', collection, order });
    }

    /**
     * Set or clear one field allowed by a generated feed, on the entry its internal id `id` names
     * (`feedEntryId` of state/shared/page/idents.ts), in the feed of that id's hub.
     */
    async function writeFeedField(
        feed: string,
        id: string,
        field: string,
        value: string | number | boolean | null
    ): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send({ kind: 'feed-field', feed, id, field, value });
        if (isPageFeed(feed)) settle.feed(feed, id, takenFrom({ [field]: value }, answer), seq);
        return answer;
    }

    /** Delete one entry, named by its internal id, from a generated feed that permits deletion. */
    async function deleteFeedEntry(feed: string, id: string): Promise<WriteAnswer> {
        return send({ kind: 'feed-delete', feed, id });
    }

    /**
     * Add one paper to the Lit Watch radar of the hub `root` names, else of the hub the server
     * picks for a write naming none (`homeOf` of server/edit/writes/hubs.ts: the primary, else the
     * one hub of the workspace). The answer's `id` is the new paper's internal id, which it is
     * shown by until the feed holds it.
     */
    async function addRadarEntry(
        fields: Record<string, unknown>,
        root?: string
    ): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send(
            root === undefined ? { kind: 'radar-add', fields } : { kind: 'radar-add', fields, root }
        );
        if (answer.ok && answer.id !== undefined) settle.added('radar', answer.id, fields, seq);
        return answer;
    }

    /**
     * Save one paper to the Literature collection of the hub `root` names, else of the primary when
     * it names the collection, else of the one other hub that does. The answer's `id` is the
     * paper's id in the portfolio: the hub the server wrote and the key it gave the paper; the page
     * holds the paper under that hub's key of the `literature` registry until the snapshot does.
     */
    async function saveLiterature(
        source: 'search' | 'lit-watch' | 'hand',
        paper: Record<string, unknown>,
        root?: string
    ): Promise<WriteAnswer> {
        const seq = settle.begin();
        const answer = await send(
            root === undefined
                ? { kind: 'literature-save', source, paper }
                : { kind: 'literature-save', source, paper, root }
        );
        if (answer.ok && answer.id !== undefined) {
            const key = look.registryKey(addressOfId(answer.id).hub, 'literature');
            settle.added(key, answer.id, { ...paper, key: keyOf(answer.id) }, seq);
        }
        return answer;
    }

    /**
     * Add one LinkedIn idea stub through the configured folder of the primary hub, else the one
     * hub. The answer's `id` is the idea's internal id: the hub the server wrote and the file's
     * name.
     */
    async function addLinkedinIdea(fields: Record<string, unknown>): Promise<WriteAnswer> {
        return send({
            kind: 'linkedin-idea',
            title: typeof fields.title === 'string' ? fields.title : '',
            category: typeof fields.category === 'string' ? fields.category : ''
        });
    }

    /**
     * Rename one LinkedIn idea, named by its internal id, and its same-basename sidecars as the
     * next numbered post, in the folder of the hub the idea is of.
     */
    async function markPosted(id: string): Promise<WriteAnswer> {
        return send({ kind: 'linkedin-post', id });
    }

    /**
     * Save the lists of a deck's `present.yml` as one edit: the `slides:` of each group in
     * `groups` and, when given, the `order:` entries. Each list's `base` is what the caller read,
     * so a file that changed since is refused and nothing is written, as is a name no deck of its
     * group answers to.
     */
    async function writeDeckSlides(
        deck: { root: string; path: string },
        groups: { group: string; base: string[]; slides: string[] }[],
        order?: { base: string[]; entries: string[] }
    ): Promise<WriteAnswer> {
        const body = { kind: 'deck-slides', root: deck.root, path: deck.path, groups };
        return send(order === undefined ? body : { ...body, order });
    }

    /**
     * One act on the files of a deck: a new slide, a slide copied or taken out, an image dropped on
     * a slide, a deck made in a folder or from a Markdown file. The answer's `id` is what to show
     * next: the new slide's key, or the new deck's folder. `said` when the caller words a refusal
     * itself, as the Present pane does in its status line.
     */
    async function writeDeckEdit(act: DeckEditAct, said = false): Promise<WriteAnswer> {
        return send({ kind: 'deck-edit', ...act }, '/api/write', { said });
    }

    /**
     * Save the rail list as the reader sees it: the endpoint writes it into the open workspace
     * file's `settings:`, over oculus's rail entry by entry, and the watcher pushes the config,
     * which is what redraws the rail.
     */
    async function writeRail(rail: RailEntry[], said = false): Promise<WriteAnswer> {
        return send({ kind: 'rail', rail }, '/api/write', { said });
    }

    /**
     * Set one option of a defaults file (`behavior.yml`) at the dotted `key` (`changes.keep`): the
     * endpoint writes the value into the open workspace file's `settings:`, or into the primary
     * hub's .oculus/config.yml for a key of the hub list, and answers a refusal as
     * `refused: [{ field: '<file>:<key>', reason }]` with nothing written. `copy` adds the key even
     * when the value is the one in force, which Edit in a file sends before it opens the file. The
     * change is recorded in History and can be taken back.
     */
    async function writeConfigKey(
        file: string,
        key: string,
        value: unknown,
        copy = false
    ): Promise<WriteAnswer> {
        return send({ kind: 'config-key', file, key, value, ...(copy ? { copy: true } : {}) });
    }

    /**
     * Set one setting an app declares: the endpoint writes the value under the setting's whole key
     * in `app_settings` of the primary hub's .oculus/config.yml, and refuses, writing nothing, a
     * key no approved app declares and a value that breaks its declaration. The change is recorded
     * in History and can be taken back.
     */
    async function writeAppSetting(key: string, value: unknown): Promise<WriteAnswer> {
        return send({ kind: 'app-setting', key, value });
    }

    /**
     * Set one list option or one family of a defaults file as a whole, in the file `writeConfigKey`
     * writes in, and refuse, writing nothing, unless the value in force is still `base` (the value
     * the caller read). A refusal and `copy` are as for `writeConfigKey`. The change is recorded in
     * History and can be taken back.
     */
    async function writeConfigValue(
        file: string,
        key: string,
        value: unknown,
        base: unknown,
        copy = false
    ): Promise<WriteAnswer> {
        return send({
            kind: 'config-value',
            file,
            key,
            value,
            base,
            ...(copy ? { copy: true } : {})
        });
    }

    /**
     * Take one option out of the file the user's value of it lives in (the open workspace file's
     * `settings:`, or the primary hub's .oculus/config.yml for a key of the hub list), so oculus's
     * value is in force again. A refusal is answered as for `writeConfigKey`. The change is
     * recorded in History and can be taken back.
     */
    async function resetConfig(file: string, key: string): Promise<WriteAnswer> {
        return send({ kind: 'config-reset', file, key });
    }

    /**
     * Park one audit finding, or bring it back. The signature is the scan's own; the endpoint
     * writes the `audit_ignore:` list in force, with it added or taken out, into the open workspace
     * file's `settings:`, and the watcher pushes the scan again.
     */
    async function muteFinding(signature: string, muted: boolean): Promise<WriteAnswer> {
        return send({ kind: 'audit-mute', signature, muted });
    }

    /**
     * Add one picture to the Memories wall. `data` is the file as base64, which is what the
     * browser's own FileReader gives; the endpoint is the wall's own rather than /api/write, since
     * what it writes is bytes into a folder and not a field of a YAML file.
     */
    async function addMemory(name: string, data: string): Promise<WriteAnswer> {
        return send({ name, data }, MEMORIES_PATH);
    }

    /**
     * Scaffold one new project: a manifest and a README under `<folder>/<id>`, in the hub `root`
     * names, else in the hub the server picks (the primary, else the one hub). `tier` and `folder`
     * are the board's; a call that names no folder is made under the `new_project_dir` of its tier,
     * the tier `projects` when it names none, in the settings of the hub written to.
     */
    async function newIdea(fields: NewIdeaFields, root?: string): Promise<WriteAnswer> {
        return send({ kind: 'new-idea', fields, ...(root === undefined ? {} : { root }) });
    }

    /**
     * Take one recorded change back. The server checks that the file still holds what the change
     * wrote before it writes the earlier value, and answers `moved` when it does not, so an undo
     * never writes over an edit made since.
     */
    async function undoWrite(at: string): Promise<WriteAnswer> {
        return send({ kind: 'undo', at });
    }

    /**
     * One git action on one workspace: staging, a commit, a push, a branch, or the suggested
     * message. The endpoint is /api/git rather than /api/write, and the answer's `output` is what
     * git said or the message that was suggested; everything else, the token and the one retry
     * above all, is the same. An action that can lose work carries `confirm: true`, which the panel
     * sets only from its dialog. The answer is waited for with no limit of the page's, since the
     * server's limits and Cancel govern a git command; `cancel` itself keeps the configured wait.
     */
    async function writeGit(
        action: string,
        root: string,
        fields: Record<string, unknown> = {},
        options: SendOptions = {}
    ): Promise<WriteAnswer> {
        return send({ action, root, ...fields }, GIT_PATH, options, action === 'cancel');
    }

    /**
     * One deposit action on one project: adopt, plan, commit, push, snapshot, or a branch. The
     * endpoint is /api/deposit, and what the action did to the mirror is read back by
     * state/system/deposit.svelte.ts, whose query is asked again by the panel, rather than carried
     * here. An action that can lose work carries `confirm: true`, which the panel sets only from
     * its dialog. The answer is waited for with no limit of the page's, as `writeGit` does, and
     * `cancel` keeps the configured wait.
     */
    async function writeDeposit(
        action: string,
        id: string,
        fields: Record<string, unknown> = {}
    ): Promise<WriteAnswer> {
        return send({ action, id, ...fields }, DEPOSIT_PATH, {}, action === 'cancel');
    }

    /** The hub file a write changes, when the page can name it. */
    function fileOf(request: unknown, path: string): { root: string; path: string } | null {
        if (path === '/api/write') return writtenFile(request, settings(), look);
        if (path !== DEPOSIT_PATH) return null;
        const body = fields(request);
        return depositedFile(
            typeof body.action === 'string' ? body.action : '',
            typeof body.id === 'string' ? body.id : '',
            look
        );
    }

    /**
     * The refusal of a write over a file a source tab holds unsaved text of, or null when the write
     * goes out. Nothing is posted for it; the file's name is what the sentence says.
     */
    function unsavedRefusal(request: unknown, path: string): Exchange | null {
        const answer = unsavedAnswer(fileOf(request, path), look, heldUnsaved);
        return answer === null ? null : { answered: true, answer };
    }

    /** One write, said to the listeners when it does not land. */
    async function send(
        request: unknown,
        path = '/api/write',
        options: SendOptions = {},
        limited = true
    ): Promise<WriteAnswer> {
        const held = unsavedRefusal(request, path);
        return tell(held ?? (await exchange(request, path, limited)), options);
    }

    /**
     * One write from an app's frame. The headers name the app and the kind it sent, which the
     * server checks against the body before any writer runs. The file is named from the body as for
     * any write, so an app's write over a file a tab holds unsaved text of is refused too.
     */
    async function sendFromApp(request: unknown, app: string, kind: string): Promise<WriteAnswer> {
        const headers = { [APP_HEADER]: appHeaderValue(app), [KIND_HEADER]: kind };
        const held = unsavedRefusal(request, '/api/write');
        return tell(held ?? (await exchange(request, '/api/write', true, headers)), {
            said: true
        });
    }

    /** A write whose request failed or whose answer could not be read, said as a failed read. */
    function failedRead(error: string): Exchange {
        state.error = error;
        const answer = { ok: false, changed: [], refused: [], error, network: true };
        return { answered: false, answer };
    }

    /**
     * One write, with the one retry a stale token gets. The whole of it, the retry and the reading
     * of each answer included, is given up once the configured time has passed with no answer, so a
     * request that never answers leaves no form waiting on it. A git write passes `limited` false
     * and waits for the server's answer, which its own limits and Cancel bound.
     */
    async function exchange(
        request: unknown,
        path: string,
        limited = true,
        extra: Record<string, string> = {}
    ): Promise<Exchange> {
        state.pending += 1;
        state.error = null;
        const gate = new AbortController();
        const wait = limited ? writeTimeout(settings()) : null;
        const timer = wait === null ? null : setTimeout(() => gate.abort(), wait);
        try {
            let response = await post(request, path, gate.signal, extra);
            let body = await readJson(response);
            // A 403 naming the kind is a refusal of the request's own, not a stale token.
            const stale =
                response.status === 403 &&
                refusalsShape.parse(fields(body)).refused.length === 0 &&
                fields(body).error !== 'kind';
            if (stale) {
                await renewToken();
                response = await post(request, path, gate.signal, extra);
                body = await readJson(response);
            }
            const held = answerShape.parse(fields(body));
            if (!response.ok) {
                const error = held.error ?? failedAnswer(response, body);
                state.error = error;
                return {
                    answered: true,
                    coded: held.error !== undefined,
                    answer: {
                        ok: false,
                        changed: [],
                        refused: held.refused,
                        error,
                        status: response.status,
                        ...(held.code === undefined ? {} : { code: held.code }),
                        ...(held.reason === undefined ? {} : { reason: held.reason })
                    }
                };
            }
            // A successful status whose body is JSON null or is not JSON is a read that failed.
            if (body === undefined) return failedRead(unreadableAnswer(response.status));
            return {
                answered: true,
                answer: {
                    ok: true,
                    changed: held.changed,
                    refused: held.refused,
                    output: held.output,
                    branches: held.branches,
                    id: held.id,
                    hash: held.hash,
                    file: held.file
                }
            };
        } catch (error) {
            if (gate.signal.aborted) {
                const words = t('app.write_timed_out');
                state.error = words;
                return {
                    answered: false,
                    answer: { ok: false, changed: [], refused: [], error: words }
                };
            }
            return failedRead(error instanceof Error ? error.message : String(error));
        } finally {
            if (timer !== null) clearTimeout(timer);
            state.pending -= 1;
        }
    }

    return {
        setToken,
        onToken,
        writeToken,
        renewToken,
        postCommand,
        pending,
        lastError,
        writeManifest,
        openFolder,
        openFile,
        revealPath,
        writeSession,
        writeEntry,
        writeSubtask,
        addSubtask,
        writeFollowup,
        addFollowup,
        writeCareer,
        newEntry,
        deleteEntry,
        addLead,
        reorderEntries,
        writeFeedField,
        deleteFeedEntry,
        addRadarEntry,
        saveLiterature,
        addLinkedinIdea,
        markPosted,
        writeDeckSlides,
        writeDeckEdit,
        writeRail,
        writeConfigKey,
        writeAppSetting,
        writeConfigValue,
        resetConfig,
        muteFinding,
        addMemory,
        newIdea,
        undoWrite,
        writeGit,
        writeDeposit,
        send,
        sendFromApp,
        onUnwritten
    };
}
