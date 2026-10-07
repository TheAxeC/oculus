// Layer 3, view partial of the TeX view. The Commands tree, as LaTeX Workshop's activity bar lists
// its commands: Build, with Clean and Kill and one node per recipe; View PDF, with the four ways to
// open it and Refresh Viewers; Logs; Navigate, Select and Edit; Miscellaneous; and BibTeX. Each
// node carries what it does, so the tree is read without a rendering. A node whose command needs a
// source tab of a LaTeX file (SyncTeX from Cursor, the environment commands, Insert Root Comment)
// is listed only while the view follows one, and the commands that write the text only while that
// tab may be written; the commands of the root need a root.

import { t } from '$lib/state/shared/words/text';

/** One node of the tree: a command that runs, or a group of commands. */
export type CommandNode = {
    id: string;
    label: string;
    glyph?: string;
    title?: string;
    run?: () => void;
    children?: CommandNode[];
};

/** What the tree reads of the view and what its nodes do. */
export type CommandDeps = {
    recipes: string[];
    /** Whether a root is known, which the commands of the root need. */
    rooted: boolean;
    /** Whether the view follows a source tab of a LaTeX file. */
    source: boolean;
    /** Whether that tab may be written. */
    editing: boolean;
    /** Whether that tab is a `.bib` file. */
    bib: boolean;
    building: boolean;
    build: (recipe?: string) => void;
    buildClean: () => void;
    kill: () => void;
    viewTab: () => void;
    viewWindow: () => void;
    viewBrowser: () => void;
    viewProgram: () => void;
    refresh: () => void;
    compilerLog: () => void;
    buildLog: () => void;
    count: () => void;
    reveal: () => void;
    checkcites: () => void;
    /** Run an action of the followed source tab by its id (latex/latex-tab.svelte.ts). */
    action: (id: string) => void;
};

/** One node that runs an action of the followed source tab. */
function acts(deps: CommandDeps, id: string, label: string): CommandNode {
    return { id: `act:${id}`, label, run: () => deps.action(`oculus.latex.${id}`) };
}

/** The tree for a view in its state. */
export function commandTree(deps: CommandDeps): CommandNode[] {
    const tree: CommandNode[] = [];
    if (deps.source || deps.rooted) {
        tree.push({
            id: 'build',
            label: t('latex.tree_build'),
            glyph: 'latex_build',
            children: [
                { id: 'build-now', label: t('latex.tree_build_now'), run: () => deps.build() },
                { id: 'build-clean', label: t('latex.tree_build_clean'), run: deps.buildClean },
                ...(deps.building
                    ? [{ id: 'kill', label: t('latex.tree_kill'), run: deps.kill }]
                    : []),
                ...deps.recipes.map((name) => ({
                    id: `recipe:${name}`,
                    label: t('latex.tree_recipe', name),
                    run: () => deps.build(name)
                }))
            ]
        });
        tree.push({
            id: 'view',
            label: t('latex.tree_view'),
            glyph: 'latex_view',
            children: [
                { id: 'view-tab', label: t('latex.tree_view_tab'), run: deps.viewTab },
                { id: 'view-window', label: t('latex.tree_view_window'), run: deps.viewWindow },
                { id: 'view-browser', label: t('latex.tree_view_browser'), run: deps.viewBrowser },
                { id: 'view-program', label: t('latex.tree_view_program'), run: deps.viewProgram },
                { id: 'refresh', label: t('latex.tree_refresh'), run: deps.refresh }
            ]
        });
        tree.push({
            id: 'logs',
            label: t('latex.tree_logs'),
            glyph: 'latex_log',
            children: [
                { id: 'compiler-log', label: t('latex.tree_compiler_log'), run: deps.compilerLog },
                { id: 'build-log', label: t('latex.tree_build_log'), run: deps.buildLog }
            ]
        });
    }
    if (deps.source) {
        const navigate: CommandNode[] = [
            acts(deps, 'synctex', t('latex.tree_synctex')),
            acts(deps, 'navigate', t('latex.tree_navigate')),
            acts(deps, 'selectEnvironment', t('latex.tree_select_environment')),
            acts(deps, 'selectContent', t('latex.tree_select_content')),
            acts(deps, 'selectName', t('latex.tree_select_name')),
            acts(deps, 'selectSection', t('latex.tree_select_section'))
        ];
        const edit: CommandNode[] = deps.editing
            ? [
                  acts(deps, 'cursorsInName', t('latex.tree_cursors_in_name')),
                  acts(deps, 'toggleEquation', t('latex.tree_toggle_equation')),
                  acts(deps, 'closeEnvironment', t('latex.tree_close_environment')),
                  acts(deps, 'wrapEnvironment', t('latex.tree_wrap_environment')),
                  acts(deps, 'promote', t('latex.tree_promote')),
                  acts(deps, 'demote', t('latex.tree_demote')),
                  acts(deps, 'rootComment', t('latex.tree_root_comment'))
              ]
            : [];
        tree.push({
            id: 'edit',
            label: t('latex.tree_edit'),
            glyph: 'latex_edit',
            children: [...navigate, ...edit]
        });
    }
    if (deps.source || deps.rooted) {
        tree.push({
            id: 'misc',
            label: t('latex.tree_misc'),
            glyph: 'latex_misc',
            children: [
                ...(deps.source ? [acts(deps, 'cites', t('latex.tree_cites'))] : []),
                ...(deps.rooted
                    ? [
                          { id: 'count', label: t('latex.tree_count'), run: deps.count },
                          { id: 'reveal', label: t('latex.tree_reveal'), run: deps.reveal }
                      ]
                    : []),
                ...(deps.source
                    ? [
                          acts(deps, 'texdoc', t('latex.tree_texdoc')),
                          acts(deps, 'texdocPackages', t('latex.tree_texdoc_packages'))
                      ]
                    : [])
            ]
        });
        tree.push({
            id: 'bib',
            label: t('latex.tree_bib'),
            glyph: 'latex_bib',
            children: [
                ...(deps.bib && deps.editing
                    ? [
                          acts(deps, 'bibAlign', t('latex.tree_bib_align')),
                          acts(deps, 'bibSort', t('latex.tree_bib_sort')),
                          acts(deps, 'bibAlignSort', t('latex.tree_bib_align_sort'))
                      ]
                    : []),
                ...(deps.rooted
                    ? [
                          {
                              id: 'checkcites',
                              label: t('latex.tree_checkcites'),
                              run: deps.checkcites
                          }
                      ]
                    : [])
            ]
        });
    }
    return tree.filter((node) => node.children === undefined || node.children.length > 0);
}
