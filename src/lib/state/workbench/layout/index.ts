// Layer 2, client state. The layout facade owns the stable public import surface while sibling
// modules keep their implementation helpers private to the folder.

export {
    FLOATLESS_VERSION,
    LAYOUT_VERSION,
    MAIN_VIEW,
    MAX_CHILDREN,
    MIN_SIZE,
    PAGES_VERSION,
    WORKBENCH_VERSION,
    defaultLayout,
    defaultPages,
    defaultWorkbench,
    emptyPane,
    floatHost,
    hostsOf,
    isPage,
    newPage,
    pageLeaf,
    samePath
} from './model.ts';
export type {
    DockEdge,
    Edge,
    Float,
    FloatPlace,
    Focus,
    Host,
    Instance,
    Keeps,
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
    removeTab,
    resize,
    restate,
    setLocked,
    splitLeaf,
    splitPane
} from './tree.ts';
export type { KeepRule } from './tree.ts';
export {
    DOCK_MAX,
    FLOAT_MIN,
    START_DOCK,
    START_H,
    START_W,
    adoptFloats,
    dockFloat,
    floatPane,
    floatTab,
    floatsFrom,
    freeFloat,
    placeFits,
    placeFloat,
    returnFloat,
    writeHost
} from './open/floats.ts';
export type { FloatSpec } from './open/floats.ts';
export { newTextFileOpener, untitledLabel } from './open/new-text-file.ts';
export { asPreview, isPreview, keepInstance, previewIn, retarget } from './open/preview.ts';
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
    needsFloats,
    parseLayout,
    parseWorkbench,
    serialiseFloatless,
    serialiseLayout
} from './saved/saved.ts';
export type { LayoutAccess } from './access.ts';
export { LAYOUT_KEY, PREVIOUS_KEY, UNREAD_KEY, createStorage } from './saved/storage.ts';
export type { LayoutStorage, Storable } from './saved/storage.ts';
export { createAttention } from './open/attention.ts';
export type { Attention, Beside, Touched } from './open/attention.ts';
export { createInstances } from './instances.ts';
export type { Instances } from './instances.ts';
export { createOpening } from './open/opening.ts';
export type { OpenOptions, Opening } from './open/opening.ts';
export { createShowInFiles } from './open/show-in-files.ts';
export { createAway } from './open/away.ts';
export type { ShowInFiles } from './open/show-in-files.ts';
export {
    activePath,
    cardCursor,
    documentState,
    findInstance,
    findView,
    instanceFlag,
    instanceLabel,
    instanceMap,
    instanceNumber,
    instanceText,
    isInstanceOf,
    newInstance,
    panes,
    reconcileCardCursor,
    stateId,
    tabsOf,
    withCardCursor
} from './instance.ts';
