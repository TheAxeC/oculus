// Layer 2, client state. The source controls the apps' hosts created, as the Repositories view
// draws them. The `app-tools` channel carries the whole state of each control (input box, count,
// groups with their resources, accept and status bar commands); this store lists them in the Views
// list's order and sends the reader's acts back through `POST /api/app-host` with the action `scm`:
// typing in the input box, the accept command, a press on a row, a menu command on the control, a
// group, rows or a change of a quick diff, and the original text of a file for the quick diff.
//
// A control is named by its app's view id and its own id, `key(app, id)`. The view selects one
// (`select`); the status bar commands of the selected control show in the bar's left group while
// it is selected, and a control that goes away leaves the selection.

import { hostAnswer, type HostAnswer } from '../host-answer.ts';
import type {
    AppScmGroup,
    AppScmResource,
    AppScmState,
    AppStatusItem,
    AppToolsPayload
} from '../../../../data/model/index.ts';

export type { AppScmGroup, AppScmResource, AppScmState };
import type { WritesStore } from '../../../shared/stores/shapes.ts';
import { t } from '../../../shared/words/text.ts';
import type { MenuOffer } from '../shell/contributions.ts';
import { choiceAt, entryOf } from '../shell/show/strip.ts';

/** What the store reads of the rest of the client. */
export type ScmDeps = {
    payload: () => AppToolsPayload | null;
    post: WritesStore['postCommand'];
    /** Tell the reader a line. */
    say: (message: string) => void;
};

/** What an act on a control came to. */
export type ScmAnswer = HostAnswer;

/** The sentence for the word the server refused an act with. */
export function scmReason(word: string): string {
    switch (word) {
        case 'closed':
            return t('repositories.app_source_word_closed');
        case 'host_down':
            return t('repositories.app_source_word_host_down');
        case 'missing':
            return t('repositories.app_source_word_missing');
        case 'not_declared':
            return t('repositories.app_source_word_not_declared');
        case 'outside':
            return t('repositories.app_source_word_outside');
        case 'timeout':
            return t('repositories.app_source_word_timeout');
        default:
            return t('repositories.app_source_word_other', word);
    }
}

/** One change of a quick diff, with Monaco's line numbers. */
export type ScmLineChange = {
    originalStartLineNumber: number;
    originalEndLineNumber: number;
    modifiedStartLineNumber: number;
    modifiedEndLineNumber: number;
};

/** The act of the reader on a control. */
export type ScmOp =
    | { kind: 'input'; value: string }
    | { kind: 'accept' }
    | { kind: 'pressed'; group: string; uri: string }
    | {
          kind: 'execute';
          command: string;
          scope: 'sourceControl' | 'group' | 'resource' | 'change';
          group?: string;
          resources?: string[];
          change?: { root: string; path: string; changes: ScmLineChange[]; index: number };
      }
    | { kind: 'original'; root: string; path: string };

/** The key a control is held by. */
export function scmKey(app: string, id: string): string {
    return `${app}\u0000${id}`;
}

/** The status bar items of a control's commands, as the bar draws an item of an app. */
function scmStatusItems(state: AppScmState): AppStatusItem[] {
    return state.statusCommands.map((one, at) => ({
        id: `scm.${state.id}.${at}`,
        alignment: 'left',
        priority: 1000 - at,
        visible: true,
        text: one.title,
        tooltip: one.tooltip,
        command: one.command,
        name: state.label,
        background: '',
        accessibility: ''
    }));
}

export function createScm(deps: ScmDeps) {
    let selected = $state('');

    const all = $derived((deps.payload()?.hosts ?? []).flatMap((host) => host.sources));

    async function act(app: string, id: string, op: ScmOp): Promise<ScmAnswer> {
        return hostAnswer(await deps.post('/api/app-host', { action: 'scm', app, id, op }));
    }

    /**
     * Run the command of the entry a strip action or a menu choice stands for (Alt runs the entry's
     * alternative), on the control, a group of it or rows of it. The host builds the arguments an
     * app's command takes from the ids.
     */
    function execute(
        state: AppScmState,
        offers: readonly MenuOffer[],
        pick: string,
        on: {
            scope: 'sourceControl' | 'group' | 'resource' | 'change';
            group?: string;
            resources?: string[];
            change?: { root: string; path: string; changes: ScmLineChange[]; index: number };
        },
        alt = false
    ): Promise<ScmAnswer> {
        const offer = entryOf(offers, choiceAt(pick));
        if (offer === undefined) return Promise.resolve({ ok: false, word: 'missing' });
        const command = alt && offer.alt !== null ? offer.alt : offer.command;
        return act(state.app, state.id, { kind: 'execute', command: command.command, ...on }).then(
            (answer) => {
                if (!answer.ok) {
                    deps.say(
                        t('repositories.app_source_refused', command.title, scmReason(answer.word))
                    );
                }
                return answer;
            }
        );
    }

    /** The control the reader selected, or undefined when it is gone. */
    function current(): AppScmState | undefined {
        return all.find((one) => scmKey(one.app, one.id) === selected);
    }

    return {
        /** Every control, in the order of the hosts. */
        sources: (): AppScmState[] => all,
        stateOf: (app: string, id: string): AppScmState | undefined =>
            all.find((one) => one.app === app && one.id === id),
        act,
        execute,
        /** The sum of the counts of the controls, for the view's rail badge. */
        count: (): number => all.reduce((sum, one) => sum + (one.count ?? 0), 0),
        select: (key: string): void => {
            selected = key;
        },
        /** Leave the selection when it is still this control's, so a later one is not undone. */
        deselect: (key: string): void => {
            if (selected === key) selected = '';
        },
        selected: (): AppScmState | undefined => current(),
        /** The status bar items of the selected control. */
        statusItems: (): { app: string; item: AppStatusItem }[] => {
            const one = current();
            return one === undefined
                ? []
                : scmStatusItems(one).map((item) => ({ app: one.app, item }));
        }
    };
}
