// Layer 2, client state. The page's end of what the apps add to the shell. Everything an app
// contributes is read from two channels: the `apps` channel's rows (what its manifest declares,
// read while the app acts) and the `app-shell` channel (what its running host registered and asks
// of the reader). This store derives from them what the shell draws: the commands Cmd-K lists, the
// entries of each menu, the keys that are bound, the context keys the apps set, and the trees and
// status items of the hosts, and it runs a command by its id.
//
// A command runs through the server: `POST /api/app-host` with the action `run` starts the host of
// the app when it declares the command and runs the handler the host registered. A command only an
// open tab of the app registered answers `missing`, and is then run through that tab (the apps
// store); a command nothing handles says so in a notification naming the command and the app.
// What the apps ask of the reader (messages, quick pick, input box, progress, commands that run on
// a page, panels) is state/system/apps/shell/requests.svelte.ts's.

import { fileIconsOf } from '../../../shared/words/appearance.ts';
import { joinedFor } from '../../../../data/helpers/files/apps/tools/languages.ts';
import { languageMap, type LanguageMap } from '../../../../data/helpers/files/languages.ts';
import {
    iconThemeOffers,
    themeOffers,
    type AppOffers
} from '../../../../data/helpers/files/apps/choices.ts';
import { EDITOR_VIEW } from '../../../../data/helpers/files/apps/views.ts';
import { boundKeys, type BoundKey, type KeyApp } from '../../../../data/helpers/keys/bound-keys.ts';
import { railChordLetters } from '../../../../data/helpers/keys/oculus/rail-letters.ts';
import { keybindingText, type KeyPlatform } from '../../../../data/helpers/keys/keys.ts';
import type { IContext } from '../../../../data/helpers/files/apps/when.ts';
import type {
    AppShellHost,
    AppShellPayload,
    AppStatusItem,
    ContextValue
} from '../../../../data/model/index.ts';
import type { EntitiesStore, NoticeSink, WritesStore } from '../../../shared/stores/shapes.ts';
import { t } from '../../../shared/words/text.ts';
import { hostAnswer, type HostAnswer } from '../host-answer.ts';
import { contextOf, holds, type ContextParts } from './context.ts';
import {
    actingApps,
    commandLabel,
    commandOffers,
    editorOffers,
    menuOffers,
    viewOffers,
    type Acting,
    type CommandOffer,
    type MenuOffer,
    type ViewOffer
} from './contributions.ts';
import { defaultEditorFor, editorsFor } from './editors.ts';
import { createKeyResolver, keyLabel } from './keys.ts';
import { pickEditor, type EditorChoice } from './show/editor-pick.ts';
import {
    choiceAt,
    choicesOf,
    entryOf,
    stripOf,
    type ChoiceItem,
    type StripItem
} from './show/strip.ts';
import { placeOf, type FileOfTab, type PlaceTab } from './place.ts';
import { textParts } from './show/icons.ts';
import type { CommandResult, RequestsStore } from './requests.svelte.ts';
import type { FrameItem } from './frames.svelte.ts';

/** What the store reads of the rest of the client. */
export type AppShellDeps = {
    entities: Pick<EntitiesStore, 'apps' | 'appShell' | 'config'>;
    post: WritesStore['postCommand'];
    notices: Pick<NoticeSink, 'post'>;
    /** The id of this page, which a report of an event and an answer carry. */
    pageId: string;
    /** What the apps ask of the reader: the quick input, the modal messages, the progress. */
    requests: RequestsStore;
    /** The status items the open tabs of the apps registered. */
    frameItems: () => FrameItem[];
    /** The status bar commands of the source control the Repositories view has selected. */
    scmItems: () => { app: string; item: AppStatusItem }[];
    /** The address of a file of an app, for the icon a command or a tree row names. */
    picture: (app: string, path: string) => string;
    /**
     * Run a command that only an open tab of the app registered, through that tab; whether a tab
     * held it.
     */
    runInTab: (app: string, command: string, args: unknown[]) => Promise<CommandResult | null>;
    /** Whether a file lies in an apps folder, which opens as source text. */
    holds: (root: string, path: string) => boolean;
    /** The file a tab shows, as the page reads it from the tab's view and state, or null. */
    fileOfTab: FileOfTab;
    platform?: KeyPlatform;
};

/** A status item of an app that acts, as the bar draws it. */
export type BarItem = {
    /** `<view id>/<item id>`, which the bar's hidden list keeps. */
    key: string;
    app: string;
    appTitle: string;
    item: AppStatusItem;
};

/** A command as Cmd-K lists it. */
export type CommandRow = {
    offer: CommandOffer;
    /** The words Cmd-K lists it by. */
    label: string;
    /** Whether its `enablement` holds. */
    enabled: boolean;
    /** The key bound to it on this platform, as a hint reads it, or the empty string. */
    key: string;
};

/**
 * Where a key is pressed: the tab on screen with what its editor said, and what holds the keyboard.
 */
export type KeyPlace = {
    tab: PlaceTab | null;
    status: { language: string } | null;
    /** A text field or an editor holds the keyboard. */
    textual: boolean;
    /** The source editor holds the keyboard. */
    editor: boolean;
};

/** What a question to a host came to: its value, or the word it was refused with. */
export type ProvideResult = HostAnswer;

/** The events a page reports to a host: a view shown or hidden, a selection, a panel closed. */
export type HostEvent = 'visibility' | 'selection' | 'expand' | 'collapse' | 'dispose';

/** The menu whose entries decide whether Cmd-K lists a command. */
const PALETTE = 'commandPalette';

const NOTHING: AppShellPayload = { hosts: [], requests: [] };

/** The platform the page runs on. */
function platformOf(): KeyPlatform {
    if (typeof navigator === 'undefined') return 'linux';
    if (navigator.userAgent.includes('Macintosh')) return 'mac';
    return navigator.userAgent.includes('Windows') ? 'win' : 'linux';
}

export type AppShellStore = ReturnType<typeof createAppShell>;

export function createAppShell(deps: AppShellDeps) {
    const platform = deps.platform ?? platformOf();
    const rows = $derived(deps.entities.apps()?.rows ?? []);
    const config = $derived(deps.entities.config()?.config ?? {});
    const fileIcons = $derived(fileIconsOf(config));
    const languages = $derived(joinedFor(languageMap(config), rows));
    const acting = $derived(actingApps(rows));
    const shell = $derived(deps.entities.appShell() ?? NOTHING);
    const keyApps = $derived(
        acting.map((one): KeyApp => ({
            id: one.id,
            title: one.row.title,
            keybindings: one.row.contributes.keybindings
        }))
    );
    const letters = $derived(railChordLetters(config));
    const bound = $derived(boundKeys(keyApps, platform, letters).bound);
    const set = $derived(
        Object.assign({}, ...shell.hosts.map((host) => host.context)) as Record<
            string,
            ContextValue
        >
    );

    /** The host registrations of an app that acts; none for any other. */
    function hostOf(app: string): AppShellHost | undefined {
        return acting.some((one) => one.id === app)
            ? shell.hosts.find((host) => host.app === app)
            : undefined;
    }

    function context(parts: ContextParts = {}): IContext {
        return contextOf(parts, platform, set);
    }

    /** The key bound to a command, as a hint reads it. */
    function keyOf(command: string): string {
        const found = bound.find((one) => one.binding.command === command);
        return found === undefined
            ? ''
            : keyLabel(keybindingText(found.binding, platform), platform);
    }

    /**
     * The Keyboard Shortcuts view's rows for the apps: each bound key with its command's title and
     * its app.
     */
    function keyRows(): { key: string; meaning: string }[] {
        return bound.map((one) => {
            const command = acting
                .find((app) => app.id === one.app)
                ?.row.contributes.commands.find((cmd) => cmd.command === one.binding.command);
            const title = command === undefined ? one.binding.command : commandLabel(command);
            const appTitle = acting.find((app) => app.id === one.app)?.row.title ?? one.app;
            return {
                key: keyLabel(keybindingText(one.binding, platform), platform),
                meaning: `${title} (${appTitle})`
            };
        });
    }

    /** The commands Cmd-K lists, while their `commandPalette` entry (if any) shows them. */
    function commandRows(parts: ContextParts = {}): CommandRow[] {
        const here = context(parts);
        return commandOffers(acting).flatMap((offer) => {
            const entries = acting
                .filter((one) => one.id === offer.app)
                .flatMap((one) => one.row.contributes.menus[PALETTE] ?? [])
                .filter((entry) => entry.command === offer.command.command);
            if (entries.length > 0 && !entries.some((entry) => holds(entry.when, here))) return [];
            return [
                {
                    offer,
                    label: commandLabel(offer.command),
                    enabled: holds(offer.command.enablement, here),
                    key: keyOf(offer.command.command)
                }
            ];
        });
    }

    /**
     * Run a command of an app by its id; a notification says so when nothing handled it, and when
     * the program of the app stopped, with Restart, since a program that ended on its own starts
     * again only when the reader asks.
     */
    async function run(app: string, command: string, args: unknown[] = []): Promise<boolean> {
        const posted = await deps.post('/api/app-host', { action: 'run', command, args, app });
        if (posted.ok && posted.body.ok === true) return true;
        const word = typeof posted.body.word === 'string' ? posted.body.word : '';
        const title = acting.find((one) => one.id === app)?.row.title ?? app;
        if (word === 'host_down') {
            const restart = (): void => {
                void deps.post('/api/app-host', { action: 'restart', view: app });
            };
            deps.notices.post(t('apps.command_host_down', command, title), {
                tone: 'warning',
                actions: [{ label: t('apps.restart'), run: restart }]
            });
            return false;
        }
        if (word === 'missing') {
            const done = await deps.runInTab(app, command, args);
            if (done?.ok === true) return true;
            if (done !== null) {
                deps.notices.post(t('apps.command_failed', command, title), { tone: 'warning' });
                return false;
            }
        }
        deps.notices.post(t('apps.command_unhandled', command, title), { tone: 'warning' });
        return false;
    }

    /** Run the command of a menu entry, or the entry's alternative while Alt is held. */
    function runOffer(offer: MenuOffer, args: unknown[], alt = false): Promise<boolean> {
        const command = alt && offer.alt !== null ? offer.alt : offer.command;
        return run(offer.app, command.command, args);
    }

    /**
     * The entries of a menu with the choices a context menu draws for them. The entries of the
     * group `without` are left out, since a row draws them as buttons.
     */
    function choices(
        id: string,
        parts: ContextParts = {},
        prefix = '',
        without = ''
    ): { offers: MenuOffer[]; items: ChoiceItem[] } {
        const here = context(parts);
        const offers = menuOffers(acting, id, here).filter((one) => one.group !== without);
        return {
            offers,
            items: choicesOf(
                offers,
                keyOf,
                (offer) => holds(offer.command.enablement, here),
                prefix
            )
        };
    }

    /**
     * The entries of a title menu with the actions a strip draws for them; the entries of the group
     * `buttons` are buttons and the others are choices of the More Actions list.
     */
    function strip(
        id: string,
        parts: ContextParts = {},
        buttons = 'navigation'
    ): { offers: MenuOffer[]; actions: StripItem[] } {
        const offers = menuOffers(acting, id, context(parts));
        return { offers, actions: stripOf(offers, deps.picture, buttons) };
    }

    /** Run the entry a choice or an action of `choices` or `strip` stands for. */
    function runEntry(
        offers: readonly MenuOffer[],
        pick: string,
        args: unknown[],
        alt = false
    ): Promise<boolean> {
        const offer = entryOf(offers, choiceAt(pick));
        return offer === undefined ? Promise.resolve(false) : runOffer(offer, args, alt);
    }

    /**
     * The status items of the apps that act, shown ones only, of a side of the bar: higher priority
     * first, then by the app's view id. A host's item and a tab's of the same key show once.
     */
    function statusItems(side: 'left' | 'right'): BarItem[] {
        const seen = new Set<string>();
        const items: BarItem[] = [];
        const add = (app: string, item: AppStatusItem): void => {
            const one = acting.find((held) => held.id === app);
            const key = `${app}/${item.id}`;
            if (one === undefined || seen.has(key) || !item.visible || item.alignment !== side) {
                return;
            }
            seen.add(key);
            items.push({ key, app, appTitle: one.row.title, item });
        };
        for (const host of shell.hosts) host.statusItems.forEach((item) => add(host.app, item));
        for (const frame of deps.frameItems()) add(frame.app, frame.item);
        for (const one of deps.scmItems()) add(one.app, one.item);
        return items.sort(
            (left, right) =>
                right.item.priority - left.item.priority || left.app.localeCompare(right.app)
        );
    }

    const editors = $derived(editorOffers(acting));

    /** The custom editors that open a file, none for a file of an apps folder. */
    function editorsOf(root: string, path: string) {
        return deps.holds(root, path) ? [] : editorsFor(editors, path);
    }

    /** What opening a file asks of the apps: the apps folders and the editor a file opens in. */
    const opens = {
        holds: deps.holds,
        editorFor: (root: string, path: string): { app: string; viewType: string } | null => {
            if (deps.holds(root, path)) return null;
            const found = defaultEditorFor(editors, path);
            return found === undefined ? null : { app: found.app, viewType: found.editor.viewType };
        }
    };

    /** Whether a tab of this view shows a file an editor can be chosen for. */
    const reopens = (view: string): boolean => view === 'source' || view === EDITOR_VIEW;

    /** Ask which editor opens a file: Text Editor or one of the custom editors that match it. */
    function chooseEditor(root: string, path: string): Promise<EditorChoice | null> {
        return pickEditor(deps.requests, editorsOf(root, path), path);
    }

    /** Ask the host of an app for the children or the item of a tree element. */
    async function provide(
        app: string,
        kind: 'children' | 'item',
        view: string,
        handle: string
    ): Promise<ProvideResult> {
        return hostAnswer(
            await deps.post('/api/app-host', { action: 'provide', app, kind, view, handle })
        );
    }

    /** Tell the host of an app that something happened on this page. */
    async function report(
        app: string,
        kind: HostEvent,
        params: Record<string, unknown>
    ): Promise<void> {
        await deps.post('/api/app-host', { action: 'event', app, kind, params, page: deps.pageId });
    }

    const resolver = createKeyResolver(() => bound);

    /** The context parts of the tab on screen and what its editor last said. */
    function place(
        tab: PlaceTab | null,
        status: { language: string } | null,
        textFocus: boolean
    ): ContextParts {
        return placeOf(tab, status, textFocus, deps.fileOfTab);
    }

    /**
     * Resolve a press of the keyboard against the apps' bindings. A press that starts a chord or
     * runs a command is taken (true), and a command runs through `run`.
     */
    function press(event: KeyboardEvent, where: KeyPlace): boolean {
        const parts = place(where.tab, where.status, where.editor);
        const outcome = resolver.press(event, context(parts), where.textual);
        if (outcome.kind === 'none') return false;
        if (outcome.kind === 'run') void run(outcome.app, outcome.command, outcome.args);
        return true;
    }

    // The colour themes and file icon themes the acting apps offer; the readers of the theme list,
    // the icon theme list and the theme take them from `offers()`. The value changes when the
    // offers or the key of an app change, and not for any other change of the rows, so a theme file
    // that changed is loaded again and a change of anything else leaves the theme as drawn. Until
    // the first `apps` payload arrives there are none known, and no theme is told unavailable.
    const made = $derived.by(() => {
        const loaded = deps.entities.apps();
        return {
            themes: loaded === null ? null : themeOffers(loaded.rows),
            icons: loaded === null ? null : iconThemeOffers(loaded.rows),
            keys: loaded === null ? null : loaded.rows.map((row) => row.key)
        };
    });
    const signature = $derived(JSON.stringify(made));
    const offers = $derived.by((): AppOffers => {
        const { themes, icons } = JSON.parse(signature) as AppOffers;
        return { themes, icons };
    });

    return {
        /** Whether the `app-shell` channel has sent its first payload. */
        loaded: (): boolean => deps.entities.appShell() !== null,
        /** What the hosts registered and ask now. */
        payload: (): AppShellPayload => shell,
        acting: (): Acting[] => acting,
        /** The colour themes and file icon themes the acting apps offer. */
        offers: (): AppOffers => offers,
        /** The file icon theme the configuration names, `seti` or an app's saved theme name. */
        fileIcons: (): string => fileIcons,
        /** The language each file name or extension has, which an icon theme's rules read. */
        languages: (): LanguageMap => languages,
        hostOf,
        context,
        /** The context parts of the tab on screen and what its editor last said. */
        place,
        /** The runs of words and glyphs a status item's text is made of. */
        textParts,
        /** Whether a `when` clause holds in the place `parts` describe. */
        holds: (when: string, parts: ContextParts = {}): boolean => holds(when, context(parts)),
        /** The context keys the apps set, by key. */
        keys: (): Record<string, ContextValue> => set,
        platform,
        bound: (): readonly BoundKey[] => bound,
        keyOf,
        keyRows,
        commandRows,
        menu: (id: string, parts: ContextParts = {}): MenuOffer[] =>
            menuOffers(acting, id, context(parts)),
        views: (): ViewOffer[] => viewOffers(acting),
        run,
        runOffer,
        press,
        choices,
        strip,
        statusItems,
        requests: deps.requests,
        runEntry,
        opens,
        editorsOf,
        chooseEditor,
        reopens,
        picture: deps.picture,
        provide,
        report
    };
}
