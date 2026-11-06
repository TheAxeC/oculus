// Layer 2, client-state tests. The tabs a saved rail page is given when it is restored, through the
// composition the rail page operations run (`giveViews(giveDocuments(held, sources), sources)`):
// the hub's `docs:` entries of the page's group, the views of its arrangement and the documents of
// oculus's own folder its arrangement shows, each given once and recorded, so a tab the reader
// closed is not given again. A page made fresh and one put back by Reset record what they hold.
//
// Every case builds its pages and its arrangements by hand; nothing reads the config or the DOM.

import { describe, expect, it } from 'vitest';
import {
    parseArrangement,
    withDocs
} from '../../../../../src/lib/state/workbench/navigation/arrangement.ts';
import type { DocEntry } from '../../../../../src/lib/state/workbench/navigation/catalogue.ts';
import { instanceText, tabsOf } from '../../../../../src/lib/state/workbench/layout/instance.ts';
import {
    newPage,
    type Page,
    type Pages
} from '../../../../../src/lib/state/workbench/layout/model.ts';
import { rebuiltPage } from '../../../../../src/lib/state/workbench/layout/open/float/pages.ts';
import {
    giveDocuments,
    type DocSource
} from '../../../../../src/lib/state/workbench/layout/saved/docs.ts';
import { giveViews } from '../../../../../src/lib/state/workbench/layout/saved/views.ts';
import { closeInstance } from '../../../../../src/lib/state/workbench/layout/tree.ts';
import type {
    Instance,
    Layout,
    Pane,
    Workbench
} from '../../../../../src/lib/state/workbench/layout/index.ts';

/** The tab state of a document of oculus's own folder, as an arrangement writes it. */
function guide(file: string, label: string): Record<string, unknown> {
    return { id: `engine:docs/${file}.md`, path: `docs/${file}.md`, engine: true, label };
}

/** The guides of the Help arrangement, in its order. */
const GUIDES = [
    guide('apps', 'Apps guide'),
    guide('templates', 'Templates'),
    guide('data-map', 'Data map'),
    guide('palette', 'Palette'),
    guide('decks', 'Decks guide')
];

/** The ids of the guides, in the arrangement's order. */
const ENGINE = GUIDES.map((state) => String(state.id));

const [APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS] = ENGINE.map((id) => `doc:${id}`);

/** A hub document of the Help page's group, and two others the reader opened by hand. */
const HUB_PATH = 'docs/RESEARCH.md';
const HUB = `doc:${HUB_PATH}`;
const NOTES = 'doc:docs/NOTES.md';
const OTHER = 'doc:docs/OTHER.md';

const HUB_DOCS: DocEntry[] = [{ label: 'Research approach', path: HUB_PATH, group: 'help' }];

/** Three hub documents of the Help page's group, as a hub with three Help documents lists them. */
const THREE_DOCS: DocEntry[] = [
    HUB_DOCS[0],
    { label: 'Agent approach', path: 'docs/AGENT.md', group: 'help' },
    { label: 'HPC how-to', path: 'docs/HPC.md', group: 'help' }
];

const THREE_PATHS = THREE_DOCS.map((entry) => entry.path);

const THREE = THREE_PATHS.map((path) => `doc:${path}`);

/** The Help arrangement: the two views, then the guides, each pinned. */
const HELP_NODE = {
    root: {
        kind: 'pane',
        view: [
            { view: 'help', pinned: true },
            { view: 'keys', pinned: true },
            ...GUIDES.map((state) => ({ view: 'doc', state, pinned: true }))
        ]
    }
};

const PROJECTS_NODE = { root: { kind: 'pane', view: [{ view: 'projects', pinned: true }] } };

/** An arrangement whose one engine tab has an empty id, and which shows the Apps guide twice. */
const ODD_NODE = {
    root: {
        kind: 'pane',
        view: [
            { view: 'help', pinned: true },
            { view: 'doc', state: { ...guide('blank', 'Blank'), id: '' }, pinned: true },
            { view: 'doc', state: guide('apps', 'Apps guide'), pinned: true },
            { view: 'doc', state: guide('apps', 'Apps guide'), pinned: true }
        ]
    }
};

/** What each rail page is given, as the rail list hands it over. */
const SOURCES: DocSource[] = [
    { page: 'help', docs: HUB_DOCS, node: withDocs(HELP_NODE, HUB_DOCS) },
    { page: 'projects', docs: [], node: PROJECTS_NODE },
    { page: 'odd', docs: [], node: ODD_NODE }
];

/** The same, on a hub whose Help group holds three documents. */
const THREE_SOURCES: DocSource[] = [
    { page: 'help', docs: THREE_DOCS, node: withDocs(HELP_NODE, THREE_DOCS) }
];

/** One restore: the documents, then the views and the guides, as rail-pages.ts runs them. */
function give(held: Pages, sources: DocSource[]): Pages {
    return giveViews(giveDocuments(held, sources), sources);
}

/** The pane builder of one row: a pane of pinned tabs, then unpinned ones, showing `active`. */
type Panes = (pinned: string[], active?: string, unpinned?: string[]) => Pane;

/**
 * A pane builder whose tab ids count from one, made once per row, so a tab's id depends only on the
 * row it is in. A tab is named as `named` names it: a view by its id, a document by `doc:<id>`. A
 * pane shows its first tab when `active` names none.
 */
function paneMaker(): Panes {
    let minted = 0;
    function tab(name: string, pin: boolean): Instance {
        minted += 1;
        const docId = name.startsWith('doc:') ? name.slice('doc:'.length) : null;
        const state =
            docId === null
                ? {}
                : (GUIDES.find((one) => one.id === docId) ?? {
                      id: docId,
                      path: docId,
                      label: docId
                  });
        const made: Instance = { id: `t${minted}`, view: docId === null ? name : 'doc', state };
        return pin ? { ...made, pinned: true } : made;
    }
    return (pinned, active, unpinned = []) => {
        const tabs = [
            ...pinned.map((one) => tab(one, true)),
            ...unpinned.map((one) => tab(one, false))
        ];
        const at = active === undefined ? 0 : [...pinned, ...unpinned].indexOf(active);
        return { kind: 'pane', tabs, active: tabs[at].id };
    };
}

/** A rail page around a tree, with the records it was saved with. */
function page(
    rail: string,
    root: Layout,
    record: { docs?: string[]; views?: string[] } = {}
): Page {
    return { id: rail, label: rail, workbench: { root }, rail, ...record };
}

/** The pages, the first on screen. */
function pagesOf(...pages: Page[]): Pages {
    return { pages, current: pages[0].id, floats: [] };
}

/** A tab as the cases name it, `(unpinned)` after one that is not pinned. */
function named(one: Instance): string {
    const name = one.view === 'doc' ? `doc:${instanceText(one.state, 'id')}` : one.view;
    return one.pinned === true ? name : `${name} (unpinned)`;
}

/** What a page shows and records: each pane's tabs and active tab, and its document record. */
type Shown = { panes: string[][]; active: string[]; docs?: string[] };

function shown(pages: Pages): Record<string, Shown> {
    return Object.fromEntries(
        pages.pages.map((one) => {
            const held = paneList(one.workbench.root);
            const out: Shown = {
                panes: held.map((each) => each.tabs.map(named)),
                active: held.map((each) => {
                    const on = each.tabs.find((tab) => tab.id === each.active);
                    return on === undefined ? '' : named(on);
                })
            };
            if (one.docs !== undefined) out.docs = one.docs;
            return [one.id, out];
        })
    );
}

/** The panes of a tree, in order. */
function paneList(root: Layout): Pane[] {
    if (root.kind === 'pane') return [root];
    return root.kind === 'split' ? root.children.flatMap(paneList) : [];
}

/** A tree of two panes side by side. */
function sideBySide(left: Pane, right: Pane): Layout {
    return { kind: 'split', dir: 'row', sizes: [0.5, 0.5], children: [left, right] };
}

/**
 * A saved Help page that shows the Apps guide, the Templates, the Data map and the Palette, with
 * the Data map on screen.
 */
function savedHelp(pane: Panes, record: { docs?: string[]; views?: string[] }): Page {
    const tabs = ['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE];
    return page('help', pane(tabs, DATA_MAP), record);
}

/** A tree's tab of one document closed, as the reader's Close does. */
function closed(root: Layout, docId: string): Layout {
    const found = tabsOf(root).find((one) => instanceText(one.state, 'id') === docId);
    return found === undefined ? root : closeInstance(root, found.id);
}

/** The Help arrangement with the hub's document, as a fresh page and a Reset make it. */
function helpWorkbench(): Workbench {
    const made = parseArrangement(SOURCES[0].node);
    if (made === null) throw new Error('the Help arrangement does not read');
    return made;
}

/** The Help page's record of every document and the two views. */
const RECORDED = { docs: [HUB_PATH, ...ENGINE], views: ['help', 'keys'] };

type Row = {
    name: string;
    held: (pane: Panes) => Pages;
    after: Record<string, Shown>;
    sources?: DocSource[];
};

const rows: Row[] = [
    {
        name: 'a saved Help page with no record of the Decks guide gains it after Palette, pinned',
        held: (pane) => pagesOf(savedHelp(pane, { docs: [HUB_PATH], views: ['help', 'keys'] })),
        after: {
            help: {
                panes: [['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS]],
                active: [DATA_MAP],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: 'the guide goes into the pane that holds the tab before it',
        held: (pane) =>
            pagesOf(
                page(
                    'help',
                    sideBySide(
                        pane(['help', HUB, 'keys']),
                        pane([APPS, TEMPLATES, DATA_MAP, PALETTE], DATA_MAP)
                    ),
                    { docs: [HUB_PATH], views: ['help', 'keys'] }
                )
            ),
        after: {
            help: {
                panes: [
                    ['help', HUB, 'keys'],
                    [APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS]
                ],
                active: ['help', DATA_MAP],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: 'with Palette closed the guide goes after the nearest earlier tab the page holds',
        sources: THREE_SOURCES,
        held: (pane) =>
            pagesOf(
                page(
                    'help',
                    sideBySide(
                        pane(['help', ...THREE, 'keys']),
                        pane([APPS, TEMPLATES, DATA_MAP], DATA_MAP)
                    ),
                    { docs: [...THREE_PATHS, ...ENGINE.slice(0, 4)], views: ['help', 'keys'] }
                )
            ),
        after: {
            help: {
                panes: [
                    ['help', ...THREE, 'keys'],
                    [APPS, TEMPLATES, DATA_MAP, DECKS]
                ],
                active: ['help', DATA_MAP],
                docs: [...THREE_PATHS, ...ENGINE]
            }
        }
    },
    {
        name: 'a saved Help page whose record holds the closed Decks guide is given nothing',
        held: (pane) => pagesOf(savedHelp(pane, RECORDED)),
        after: {
            help: {
                panes: [['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE]],
                active: [DATA_MAP],
                docs: RECORDED.docs
            }
        }
    },
    {
        name: 'a page that shows the guide with no record of it gets no second tab, and records it',
        held: (pane) =>
            pagesOf(
                page(
                    'help',
                    pane(['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE], DATA_MAP, [
                        DECKS
                    ]),
                    { docs: [HUB_PATH], views: ['help', 'keys'] }
                )
            ),
        after: {
            help: {
                panes: [
                    ['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, `${DECKS} (unpinned)`]
                ],
                active: [DATA_MAP],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: 'a page with no record is given every document it lacks, once, in order',
        held: (pane) => pagesOf(page('help', pane(['help']))),
        after: {
            help: {
                panes: [['help', 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS, HUB]],
                active: ['help'],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: "another rail page gets none of Help's guides, and Help gets its hub document",
        held: (pane) =>
            pagesOf(
                page('projects', pane(['projects']), { views: ['projects'] }),
                page('help', pane(['help', 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS]), {
                    docs: ENGINE,
                    views: ['help', 'keys']
                })
            ),
        after: {
            projects: { panes: [['projects']], active: ['projects'] },
            help: {
                panes: [['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS]],
                active: ['help'],
                docs: [...ENGINE, HUB_PATH]
            }
        }
    },
    {
        name: 'with Palette closed in one pane the guide goes after the Data map, pinned',
        held: (pane) =>
            pagesOf(
                page(
                    'help',
                    pane(['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP], DATA_MAP, [NOTES]),
                    {
                        docs: [HUB_PATH, ...ENGINE.slice(0, 4)],
                        views: ['help', 'keys']
                    }
                )
            ),
        after: {
            help: {
                panes: [
                    ['help', HUB, 'keys', APPS, TEMPLATES, DATA_MAP, DECKS, `${NOTES} (unpinned)`]
                ],
                active: [DATA_MAP],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: "a page holding no tab before the guide gets it after the first pane's pinned tabs",
        held: (pane) =>
            pagesOf(
                page('help', sideBySide(pane([NOTES]), pane([OTHER])), {
                    docs: [HUB_PATH, ...ENGINE.slice(0, 4)],
                    views: ['help', 'keys']
                })
            ),
        after: {
            help: {
                panes: [[NOTES, DECKS], [OTHER]],
                active: [NOTES, OTHER],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: 'an engine tab with an empty id is given to no page, and a repeated one once',
        held: (pane) => pagesOf(page('odd', pane(['help']), { views: ['help'] })),
        after: {
            odd: { panes: [['help', APPS]], active: ['help'], docs: [ENGINE[0]] }
        }
    },
    {
        name: 'a hub document the reader closed is not given again, at its place or another',
        held: (pane) =>
            pagesOf(
                page(
                    'help',
                    pane(['help', 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS]),
                    RECORDED
                )
            ),
        after: {
            help: {
                panes: [['help', 'keys', APPS, TEMPLATES, DATA_MAP, PALETTE, DECKS]],
                active: ['help'],
                docs: RECORDED.docs
            }
        }
    },
    {
        name: 'a fresh Help page records its guides, so one closed is not given again',
        held: () => {
            const made = newPage('Help', helpWorkbench(), 'help');
            const root = closed(made.workbench.root, ENGINE[2]);
            return pagesOf({ ...made, id: 'help', workbench: { root } });
        },
        after: {
            help: {
                panes: [['help', HUB, 'keys', APPS, TEMPLATES, PALETTE, DECKS]],
                active: ['help'],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    },
    {
        name: 'a Help page put back by Reset records its guides, so one closed is not given again',
        held: (pane) => {
            const old = pagesOf(page('help', pane(['help']), { docs: [HUB_PATH] }));
            const reset = rebuiltPage(old, 'help', 'Help', helpWorkbench(), {
                unique: () => false
            });
            const made = reset.pages[0];
            const root = closed(made.workbench.root, ENGINE[2]);
            return pagesOf({ ...made, workbench: { root } });
        },
        after: {
            help: {
                panes: [['help', HUB, 'keys', APPS, TEMPLATES, PALETTE, DECKS]],
                active: ['help'],
                docs: [HUB_PATH, ...ENGINE]
            }
        }
    }
];

describe('the tabs a saved rail page is given', () => {
    it.each(rows)('$name', ({ held, after, sources = SOURCES }) => {
        const given = give(held(paneMaker()), sources);
        expect(shown(given)).toEqual(after);
        // A second restore gives nothing more.
        expect(give(given, sources)).toBe(given);
    });
});
