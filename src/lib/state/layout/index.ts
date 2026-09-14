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
    samePath
} from './model.ts';
export type {
    Edge,
    Focus,
    Instance,
    Layout,
    Page,
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
    isFolded,
    moveInstance,
    openInstance,
    paneAt,
    resize,
    restate,
    splitPane
} from './tree.ts';
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
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    panes,
    reconcileCardCursor,
    stateId,
    withCardCursor
} from '../instance.ts';
