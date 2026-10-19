// Layer 3, view partial of Source.svelte. What a LaTeX source tab does with its file's root: the
// build and what shows of it in the breadcrumb bar, the editor actions with their keys, and the
// questions some of them ask (a recipe, a citation, a package name). The facts of the root follow
// the file's language by name, so a file the editor draws as plain text (over the paint limit)
// keeps them; the editing commands (environments, sectioning, formatting shortcuts) come from the
// editor's LaTeX extension and are present only while that extension is (`commands`).
//
// The root is the main file the file builds through (server/content/latex/root.ts), asked of the
// server whenever the saved text changes, since a `% !TEX root` comment is part of it. While the
// root is known the tab follows its files for a build on a change on disk, and the first build
// the reader asks for here that ends well shows the PDF beside the tab, once per tab.

import { untrack } from 'svelte';
import {
    LATEX_CHORD_FIRST,
    LATEX_CHORD_SECONDS,
    LATEX_PRESSES,
    latexChordSecond,
    latexMathFirst
} from '$lib/data/helpers/keys/oculus/editor-keys';
import { isLatexLanguage } from '$lib/state/sources/fs';
import { onMac } from '$lib/ui/controls/editor/kit/load';
import type { LatexCommands } from '$lib/ui/controls/editor/kit/latex/latex-editing';
import type { Choice } from '$lib/ui/forms/choice/quick-pick';
import type { EditorKey, EditorOwnAction, KeyPress } from '$lib/ui/controls/editor/types';
import type { ClientState } from '$lib/state/client/context';
import { takeRoot } from '../../../shared/latex/root-answer';
import { IDLE_BUILD, type LatexRoot, type RootBuild } from '$lib/state/sessions/latex/latex-state';
import type { Caret } from '$lib/state/workbench/navigation/editor-text';
import { t } from '$lib/state/shared/words/text';

/** What the tab says of itself, each as a function. */
export type LatexTabInput = {
    client: ClientState;
    instance: () => string;
    root: () => string;
    path: () => string;
    /** The language the file is named by, whatever the editor draws it in. */
    language: () => string;
    /**
     * Whether the tab shows a file under a served root, not a version, a library file or a draft.
     */
    onDisk: () => boolean;
    /** The tab's text and the text last saved, which a root comment is read from. */
    draft: () => { text: string; saved: string };
    caret: () => Caret;
    /** Whether the text may be written. */
    editing: () => boolean;
    save: () => Promise<void>;
};

/** What the tab asks the reader. */
type LatexAsking =
    | { kind: 'recipe' | 'cite' | 'package'; title: string; placeholder: string; choices: Choice[] }
    | { kind: 'texdoc' };

/** The LaTeX side of one source tab. */
export type LatexTab = {
    /**
     * Whether the file's LaTeX facts apply: a LaTeX file on disk, not a version or a library file.
     */
    readonly applies: boolean;
    /** Whether the file is a `.bib` file. */
    readonly bib: boolean;
    /** The main file the file builds through, or null while it is asked or when there is none. */
    readonly found: NonNullable<LatexRoot> | null;
    readonly build: RootBuild;
    readonly building: boolean;
    readonly asking: LatexAsking | null;
    /** The editing commands of the editor's LaTeX extension, null while it has none. */
    commands: LatexCommands | null;
    press: {
        build: () => void;
        kill: () => void;
        view: () => void;
        log: () => void;
    };
    pick: (id: string) => void;
    texdoc: (name: string) => void;
    release: () => void;
    /** The tab's LaTeX actions that apply now, in the order the palette lists them. */
    actions: () => EditorOwnAction[];
};

/** Whether the text before the caret is inside the braces of a `\cite`-like command. */
function insideCite(before: string): boolean {
    return /\\[A-Za-z]*cite[A-Za-z]*\*?(?:\[[^\]]*\]){0,2}\{[^}]*$/.test(before);
}

/** Reads a value, so the effect that calls it runs again when the value changes. */
function reads(_value: unknown): void {
    // The call is the read.
}

/** Make the LaTeX side of one source tab. */
export function createLatexTab(input: LatexTabInput): LatexTab {
    const { client } = input;
    const { latex, latexActions, editorStatus } = client;
    const mac = onMac();

    const applies = $derived(
        isLatexLanguage(input.language()) &&
            input.onDisk() &&
            input.root() !== '' &&
            input.path() !== ''
    );
    const bib = $derived(applies && input.path().toLowerCase().endsWith('.bib'));

    let found = $state<NonNullable<LatexRoot> | null>(null);
    let asking: LatexAsking | null = $state(null);
    let commands: LatexCommands | null = $state(null);
    /** Whether the PDF was shown beside the tab, which a build ends well once does. */
    let shown = false;
    /** Whether the reader pressed Build here and the PDF is still to be shown. */
    let wants = false;
    /** The citations asked for by the Citation Browser, by key, for the pick that follows. */
    let cited = new Map<string, string>();

    // The root, asked again whenever the saved text changes (a root comment is part of it).
    $effect(() => {
        const at = { root: input.root(), path: input.path() };
        reads(input.draft().saved);
        if (!applies) {
            found = null;
            return;
        }
        return takeRoot(latexActions.rootOfFile(at.root, at.path), (answer) => (found = answer));
    });

    // The root's files are followed while the tab names the root, for a build on a change on disk.
    $effect(() => {
        const one = found;
        if (one === null) return;
        return latex.follow(one.root, one.path, one.main);
    });

    const build = $derived(
        found === null
            ? IDLE_BUILD
            : latex.buildOf({ root: found.root, path: found.path }, found.main)
    );
    const building = $derived(build.status === 'building' && build.step === 'build');

    // The PDF is shown beside the tab by the first build the reader asked for here that ends well.
    $effect(() => {
        return latex.onBuilt((built) => {
            const one = untrack(() => found);
            if (!wants || one === null || built.status !== 'succeeded') return;
            const target = built.target;
            if (!('root' in target) || target.root !== one.root || target.path !== one.path) return;
            if (built.main !== one.main) return;
            wants = false;
            shown = true;
            void latexActions.viewPdf(input.root(), input.path(), input.instance());
        });
    });

    const press = {
        build: (): void => {
            wants = !shown;
            void latexActions.build(input.root(), input.path());
        },
        kill: (): void => void latexActions.stop(input.root(), input.path()),
        view: (): void => {
            shown = true;
            void latexActions.viewPdf(input.root(), input.path(), input.instance());
        },
        log: (): void => void latexActions.buildLog(input.root(), input.path())
    };

    /** Ask the editor for a change of the tab's text. */
    function ask(change: Parameters<typeof editorStatus.ask>[1]): void {
        editorStatus.ask(input.instance(), change);
    }

    /** The recipes' names, asked as a pick. */
    function askRecipe(): void {
        const names = latex.recipes();
        asking = {
            kind: 'recipe',
            title: t('latex.pick_recipe'),
            placeholder: t('latex.pick_recipe_placeholder'),
            choices: names.map((name) => ({ id: name, label: name }))
        };
    }

    async function askCite(): Promise<void> {
        const answer = await latex.cites(input.root(), input.path());
        if (answer.error !== '') {
            latexActions.say(answer.error, true);
            return;
        }
        cited = new Map();
        const choices = answer.entries.map((entry, index) => {
            const id = String(index);
            cited.set(id, entry.key);
            const detail = [entry.year, entry.author, entry.title].filter((one) => one !== '');
            return { id, label: [entry.key, ...detail].join('  ') };
        });
        if (choices.length === 0) {
            latexActions.say(t('latex.no_cites'));
            return;
        }
        asking = {
            kind: 'cite',
            title: t('latex.pick_cite'),
            placeholder: t('latex.pick_cite_placeholder'),
            choices
        };
    }

    async function askPackage(): Promise<void> {
        const answer = await latex.packages(input.root(), input.path());
        if (answer.error !== '') {
            latexActions.say(answer.error, true);
            return;
        }
        if (answer.names.length === 0) {
            latexActions.say(t('latex.no_packages'));
            return;
        }
        asking = {
            kind: 'package',
            title: t('latex.pick_package'),
            placeholder: t('latex.pick_package_placeholder'),
            choices: answer.names.map((name) => ({ id: name, label: name }))
        };
    }

    function pick(id: string): void {
        const kind = asking?.kind;
        asking = null;
        if (kind === 'recipe') {
            void latexActions.build(input.root(), input.path(), { recipe: id });
        } else if (kind === 'cite') {
            const key = cited.get(id);
            if (key === undefined) return;
            const caret = input.caret();
            const line = input.draft().text.split(/\r?\n/)[caret.line - 1] ?? '';
            const inside = insideCite(line.slice(0, Math.max(0, caret.column - 1)));
            ask({ kind: 'insert', text: inside ? key : `\\cite{${key}}` });
        } else if (kind === 'package') {
            void latexActions.texdoc(id);
        }
    }

    async function rootComment(): Promise<void> {
        const line = await latexActions.rootComment(input.root(), input.path());
        if (line === null) return;
        const lines = input.draft().text.split(/\r?\n/);
        const has = /^\s*%\s*!TEX\s+root\s*=/i.test(lines[0] ?? '');
        const rest = has ? lines.slice(1) : lines;
        ask({ kind: 'replace', text: [line, ...rest].join('\n') });
    }

    /** One of the bibliography rewrites, as one edit that saves nothing. */
    async function rewrite(kind: 'align' | 'sort' | 'alignSort'): Promise<void> {
        const changed = await client.latexReader.bib[kind](input.draft().text);
        if (changed === null) {
            latexActions.say(t('latex.bib_unread'), true);
            return;
        }
        if (changed !== input.draft().text) ask({ kind: 'replace', text: changed });
    }

    /** One key of `latex_editing.chords` as the chord that applies it, for the first key given. */
    function chordKey(first: KeyPress, character: string): EditorKey {
        // The table's second press names a letter, a digit or the minus, which Monaco names too.
        return [first, latexChordSecond(character) as KeyPress];
    }

    function actions(): EditorOwnAction[] {
        if (!applies) return [];
        const listed: EditorOwnAction[] = [];
        const add = (
            id: string,
            label: string,
            run: () => void,
            key?: EditorKey,
            menu?: string
        ): void => {
            listed.push({
                id,
                label,
                run,
                ...(key === undefined ? {} : { key }),
                ...(menu === undefined ? {} : { menu })
            });
        };
        const here = { root: input.root(), path: input.path() };
        // Build and SyncTeX from Cursor are in the right-click menu when `latex.context_menu` is
        // true.
        const menu = latex.settings()?.contextMenu === true ? 'navigation' : undefined;
        add('oculus.latex.build', t('latex.cmd_build'), press.build, LATEX_PRESSES.build, menu);
        add('oculus.latex.buildRecipe', t('latex.cmd_build_recipe'), askRecipe);
        if (building) add('oculus.latex.kill', t('latex.cmd_kill'), press.kill);
        add(
            'oculus.latex.clean',
            t('latex.cmd_clean'),
            () => void latexActions.clean(here.root, here.path),
            LATEX_PRESSES.clean
        );
        if (!bib) {
            add('oculus.latex.view', t('latex.cmd_view'), press.view, LATEX_PRESSES.view);
            add(
                'oculus.latex.synctex',
                t('latex.cmd_synctex'),
                () => {
                    const caret = input.caret();
                    void latexActions.forward(
                        here.root,
                        here.path,
                        caret.line,
                        caret.column - 1,
                        input.instance()
                    );
                },
                LATEX_PRESSES.synctex,
                menu
            );
            add(
                'oculus.latex.mathPreview',
                t('latex.cmd_math_preview'),
                () => void client.layout.openBeside('math-preview', {}),
                LATEX_PRESSES.mathPreview
            );
        }
        if (input.editing()) {
            add('oculus.latex.saveQuietly', t('latex.cmd_save_quietly'), () => {
                void latexActions.saveWithoutBuilding(here.root, here.path, input.save);
            });
            if (!bib)
                add(
                    'oculus.latex.rootComment',
                    t('latex.cmd_root_comment'),
                    () => void rootComment()
                );
        }
        add(
            'oculus.latex.count',
            t('latex.cmd_count'),
            () => void latexActions.count(here.root, here.path)
        );
        add(
            'oculus.latex.compilerLog',
            t('latex.cmd_compiler_log'),
            () => void latexActions.compilerLog(here.root, here.path)
        );
        add('oculus.latex.buildLog', t('latex.cmd_build_log'), press.log);
        add('oculus.latex.cites', t('latex.cmd_cites'), () => void askCite());
        add(
            'oculus.latex.checkcites',
            t('latex.cmd_checkcites'),
            () => void latexActions.checkcites(here.root, here.path)
        );
        add('oculus.latex.texdoc', t('latex.cmd_texdoc'), () => (asking = { kind: 'texdoc' }));
        add('oculus.latex.texdocPackages', t('latex.cmd_texdoc_packages'), () => void askPackage());
        add(
            'oculus.latex.reveal',
            t('latex.cmd_reveal'),
            () => void latexActions.revealOutput(here.root, here.path)
        );
        if (bib && input.editing()) {
            add('oculus.latex.bibAlign', t('latex.cmd_bib_align'), () => void rewrite('align'));
            add('oculus.latex.bibSort', t('latex.cmd_bib_sort'), () => void rewrite('sort'));
            add(
                'oculus.latex.bibAlignSort',
                t('latex.cmd_bib_align_sort'),
                () => void rewrite('alignSort')
            );
        }
        const on = commands;
        if (on === null || !input.editing()) return listed;
        const { text, math } = latex.editing().chords;
        const first = LATEX_CHORD_FIRST;
        const mathFirst = latexMathFirst(mac);
        add('oculus.latex.promote', t('latex.cmd_promote'), on.promote, LATEX_PRESSES.promote);
        add('oculus.latex.demote', t('latex.cmd_demote'), on.demote, LATEX_PRESSES.demote);
        add('oculus.latex.navigate', t('latex.cmd_navigate'), on.navigate);
        add(
            'oculus.latex.selectEnvironment',
            t('latex.cmd_select_environment'),
            on.selectEnvironment
        );
        add('oculus.latex.selectContent', t('latex.cmd_select_content'), on.selectContent);
        add('oculus.latex.selectName', t('latex.cmd_select_name'), on.selectName);
        add('oculus.latex.cursorsInName', t('latex.cmd_cursors_in_name'), on.cursorsInName);
        add('oculus.latex.toggleEquation', t('latex.cmd_toggle_equation'), on.toggleEquation);
        add('oculus.latex.closeEnvironment', t('latex.cmd_close_environment'), on.closeEnvironment);
        add('oculus.latex.wrapEnvironment', t('latex.cmd_wrap_environment'), on.wrapEnvironment);
        add('oculus.latex.selectSection', t('latex.cmd_select_section'), on.selectSection);
        add('oculus.latex.item', t('latex.cmd_item'), on.item, [first, LATEX_CHORD_SECONDS.item]);
        add('oculus.latex.surround', t('latex.cmd_surround'), on.surround, [
            first,
            LATEX_CHORD_SECONDS.surround
        ]);
        for (const [character, command] of Object.entries(text)) {
            add(
                `oculus.latex.text.${command}`,
                t('latex.cmd_command', command),
                () => on.keyword(command),
                chordKey(first, character)
            );
        }
        for (const [character, command] of Object.entries(math)) {
            add(
                `oculus.latex.math.${command}`,
                t('latex.cmd_command', command),
                () => on.keyword(command),
                chordKey(mathFirst, character)
            );
        }
        return listed;
    }

    return {
        get applies() {
            return applies;
        },
        get bib() {
            return bib;
        },
        get found() {
            return found;
        },
        get build() {
            return build;
        },
        get building() {
            return building;
        },
        get asking() {
            return asking;
        },
        get commands() {
            return commands;
        },
        set commands(next: LatexCommands | null) {
            commands = next;
        },
        press,
        pick,
        texdoc: (name: string) => {
            asking = null;
            void latexActions.texdoc(name);
        },
        release: () => (asking = null),
        actions
    };
}
