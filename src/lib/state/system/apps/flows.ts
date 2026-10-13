// Layer 2, client state. The questions and notices around managing an app: which choices an app's
// menu offers, the question a disable or a removal asks when other apps depend on the app or when
// files go to the Trash, and the line a refusal or an addition ends with.
//
// A question is handed to the view that raised the pick, which draws it once and runs `act` on a
// yes. A disable that other enabled apps depend on is first sent without `cascade`; the server
// answers with the titles of those apps, which the question names, and the yes sends it again with
// `cascade`. A disable, a removal or a revoke of an app whose custom editors hold changes their
// frames have not saved, or whose host runs a debug session, a task or a terminal, first asks,
// naming the files, the session, the tasks and the terminals, since the editors close, the
// session ends and the tasks and terminals are stopped when the app stops acting.

import { t } from '../../shared/words/text.ts';
import type { AppRow } from '../../../data/model/index.ts';
import { pickedOf } from '../../sources/explorer/acts/folders.ts';
import type { Posted } from '../../shared/stores/shapes.ts';
import type { ManageOutcome, ManageStore } from './manage.ts';

/** One entry of an app's menu: the id a pick carries and the words it is drawn with. */
export type AppChoice = { id: string; label: string };

/** A question held for the reader: what is asked, the line under it, and what a yes runs. */
type AppAsk = {
    message: string;
    detail: string;
    act: () => void;
    confirm?: string;
};

/** What stops with an app: the debug session it runs, its tasks and its terminals, by name. */
export type AppEnding = { debug: string | null; tasks: string[]; terminals: string[] };

/** What the flows need of the rest of the page. */
export type FlowsDeps = {
    manage: ManageStore;
    rowOf: (id: string) => AppRow | undefined;
    post: (path: string, body: unknown) => Promise<Posted>;
    notices: { post: (message: string, options?: { tone?: 'error' }) => unknown };
    /** The files of the custom editors of an app that hold changes not yet saved. */
    dirtyFiles: (id: string) => string[];
    /** What the app of this view id runs, which stops when the app stops acting. */
    ending: (id: string) => AppEnding;
};

/** The choices, the question and the additions of the apps. */
export type FlowsStore = {
    /** The choices the menu of an app offers, in the order they are drawn. */
    choices: (row: AppRow) => AppChoice[];
    /** Do what a choice of the menu of the app of this view id asks, giving a question to `ask`. */
    pick: (id: string, choice: string, ask: (question: AppAsk) => void) => Promise<void>;
    /**
     * Run `act` for the app now, or after a yes when its custom editors hold unsaved changes or it
     * runs a debug session, a task or a terminal: the question names the files, the session, the
     * tasks and the terminals.
     */
    guarded: (id: string, ask: (question: AppAsk) => void, act: () => void) => void;
    /** Choose a folder in the folder panel and add it as an app. */
    addFromPanel: () => Promise<void>;
    /** Add the folder at this absolute path as an app. */
    addPath: (path: string) => Promise<void>;
};

/** The sentence of why an addition was refused, from the word the server gave. */
function addReason(word: string): string {
    switch (word) {
        case 'not_folder':
            return t('apps.add_not_folder');
        case 'no_manifest':
            return t('apps.add_no_manifest');
        case 'name':
            return t('apps.add_name');
        case 'exists':
            return t('apps.add_exists');
        case 'inside':
            return t('apps.add_inside');
        case 'holds':
            return t('apps.add_holds');
        case 'too_large':
            return t('apps.add_too_large');
        default:
            return t('apps.add_copy');
    }
}

/** The flows over the manage calls. */
export function createFlows(deps: FlowsDeps): FlowsStore {
    const { manage, notices } = deps;

    /** A refusal of the server as one line. */
    const refusal = (outcome: Extract<ManageOutcome, { ok: false }>): string =>
        outcome.reason === '' ? outcome.error : outcome.reason;

    async function toggle(
        id: string,
        enabled: boolean,
        workspace: boolean,
        ask: (question: AppAsk) => void
    ): Promise<void> {
        const outcome = await manage.setEnabled(id, enabled, workspace, false);
        if (outcome.ok) return;
        if (outcome.error !== 'dependents') {
            notices.post(t('apps.manage_failed', refusal(outcome)), { tone: 'error' });
            return;
        }
        const title = deps.rowOf(id)?.title ?? id;
        ask({
            message: t('apps.disable_dependents', title, outcome.dependents.join(', ')),
            detail: '',
            act: () => void again(id, workspace)
        });
    }

    async function again(id: string, workspace: boolean): Promise<void> {
        const outcome = await manage.setEnabled(id, false, workspace, true);
        if (!outcome.ok) {
            notices.post(t('apps.manage_failed', refusal(outcome)), { tone: 'error' });
        }
    }

    async function remove(id: string, ask: (question: AppAsk) => void): Promise<void> {
        const row = deps.rowOf(id);
        const seen = await manage.inspect(id);
        if (!seen.ok) {
            notices.post(t('apps.remove_failed', seen.error), { tone: 'error' });
            return;
        }
        const files =
            seen.secrets === null
                ? t('apps.remove_secrets_unknown', seen.folder)
                : t('apps.remove_secrets', seen.folder, seen.secrets.toString());
        const others =
            seen.dependents.length === 0
                ? ''
                : t('apps.remove_dependents', seen.dependents.join(', '));
        ask({
            message: t('apps.remove_question', row?.title ?? id),
            detail: `${files}${others}`,
            confirm: t('apps.remove_confirm'),
            act: () => void removed(id, seen.dependents.length > 0)
        });
    }

    async function removed(id: string, cascade: boolean): Promise<void> {
        const title = deps.rowOf(id)?.title ?? id;
        const outcome = await manage.remove(id, cascade);
        if (!outcome.ok) {
            notices.post(t('apps.remove_failed', refusal(outcome)), { tone: 'error' });
        } else if (outcome.secretsKept) {
            notices.post(t('apps.remove_secrets_kept', title), { tone: 'error' });
        }
    }

    function guarded(id: string, ask: (question: AppAsk) => void, act: () => void): void {
        const files = deps.dirtyFiles(id);
        const ending = deps.ending(id);
        const lines = [
            ...(ending.debug === null ? [] : [t('apps.ends_debug', ending.debug)]),
            ...ending.tasks.map((name) => t('apps.ends_task', name)),
            ...ending.terminals.map((name) => t('apps.ends_terminal', name))
        ];
        if (files.length === 0 && lines.length === 0) {
            act();
            return;
        }
        const title = deps.rowOf(id)?.title ?? id;
        ask({
            message: [
                files.length === 0 ? '' : t('apps.dirty_question', title),
                lines.length === 0 ? '' : t('apps.ends_question', title)
            ]
                .filter((one) => one !== '')
                .join(' '),
            detail: [...files, ...lines].join('\n'),
            confirm:
                files.length === 0
                    ? t('apps.ends_confirm')
                    : lines.length === 0
                      ? t('apps.dirty_confirm')
                      : t('apps.ends_dirty_confirm'),
            act
        });
    }

    async function addPath(path: string): Promise<void> {
        const outcome = await manage.add(path);
        if (outcome.ok) notices.post(t('apps.add_done', outcome.name));
        else notices.post(t('apps.add_failed', addReason(outcome.error)), { tone: 'error' });
    }

    return {
        choices(row) {
            const choices: AppChoice[] = [];
            if (row.machineDisabled) {
                choices.push({ id: 'enable', label: t('apps.menu_enable') });
            } else {
                choices.push({ id: 'disable', label: t('apps.menu_disable') });
            }
            if (row.disabled) {
                choices.push({ id: 'enable-workspace', label: t('apps.menu_enable_workspace') });
            } else {
                choices.push({ id: 'disable-workspace', label: t('apps.menu_disable_workspace') });
            }
            if (row.root === '') choices.push({ id: 'remove', label: t('apps.menu_remove') });
            return choices;
        },
        guarded,
        async pick(id, choice, ask) {
            const enabling = choice.startsWith('enable');
            const act = (): Promise<void> =>
                choice === 'remove'
                    ? remove(id, ask)
                    : toggle(id, enabling, choice.endsWith('workspace'), ask);
            if (enabling) return act();
            return new Promise((done) => {
                guarded(id, ask, () => void act().then(done));
            });
        },
        async addFromPanel() {
            const posted = await deps.post('/api/folders/pick', {});
            const picked = pickedOf(posted.body, posted.failed);
            if (!picked.ok) {
                const line =
                    picked.error === 'unsupported'
                        ? t('apps.add_unsupported')
                        : picked.error === 'busy'
                          ? t('apps.add_panel_busy')
                          : t('apps.add_panel_failed');
                notices.post(line, { tone: 'error' });
                return;
            }
            const chosen = picked.paths.at(0);
            if (chosen !== undefined) await addPath(chosen);
        },
        addPath
    };
}
