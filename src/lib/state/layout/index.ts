// Layer 2, client state. The layout facade owns the stable public import surface while sibling
// modules keep their implementation helpers private to the folder.

export {
    LAYOUT_VERSION,
    MAIN_VIEW,
    MAX_CHILDREN,
    MIN_SIZE,
    PANEL_DEFAULT,
    PANEL_MAX,
    PANEL_MIN,
    WORKBENCH_VERSION,
    clampPanel,
    defaultLayout,
    defaultPages,
    defaultWorkbench,
    isRecord,
    movePage,
    newPage
} from './model.ts';
export type {
    Dock,
    Edge,
    Focus,
    Instance,
    Layout,
    Page,
    Pages,
    Pane,
    Split,
    Target,
    ViewId,
    Workbench
} from './model.ts';
export {
    activate,
    closeInstance,
    closePane,
    equalSizes,
    moveInstance,
    openInstance,
    paneAt,
    resize,
    restate,
    splitPane
} from './tree.ts';
export {
    focusedPane,
    holderOf,
    maximise,
    restore,
    settleFocus,
    splitWith,
    transfer
} from './workbench.ts';
export {
    DOCKS,
    checkLayout,
    checkPages,
    checkWorkbench,
    parseLayout,
    parseWorkbench,
    serialiseLayout
} from './saved.ts';
export {
    activePath,
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    panes,
    stateId
} from '../instance.ts';
