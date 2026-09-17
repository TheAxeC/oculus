// Layer 2, client state. The layout facade owns the stable public import surface while sibling
// modules keep their implementation helpers private to the folder.

export {
    LAYOUT_VERSION,
    MAIN_VIEW,
    MAX_CHILDREN,
    MIN_SIZE,
    PAGES_VERSION,
    WORKBENCH_VERSION,
    defaultLayout,
    defaultPages,
    defaultWorkbench,
    isRecord,
    movePage,
    newPage,
    pageLeaf,
    samePath
} from './model.ts';
export type {
    Edge,
    Focus,
    Instance,
    Layout,
    Page,
    PageLeaf,
    Pages,
    Pane,
    Split,
    ViewId,
    Workbench
} from './model.ts';
export {
    activate,
    closeInstance,
    closePane,
    equalSizes,
    expand,
    expandTo,
    fold,
    foldedCount,
    insertInstance,
    isFolded,
    leafAt,
    moveInstance,
    openInstance,
    pageLeaves,
    paneAt,
    resize,
    restate,
    splitLeaf,
    splitPane
} from './tree.ts';
export { asPreview, isPreview, keepInstance, previewIn, retarget } from './preview.ts';
export {
    clearPage,
    containsPage,
    embedPage,
    embeddable,
    refusedLeaves,
    settlePageLeaves,
    showable,
    showsPage,
    unembedPage
} from './nested.ts';
export type { Refusal } from './nested.ts';
export { focusedPane, maximise, restore, settleFocus, splitWith } from './workbench.ts';
export {
    checkLayout,
    checkPages,
    checkWorkbench,
    parseLayout,
    parseWorkbench,
    serialiseLayout
} from './saved.ts';
export {
    activePath,
    cardCursor,
    documentState,
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    panes,
    reconcileCardCursor,
    stateId,
    tabsOf,
    withCardCursor
} from '../instance.ts';
