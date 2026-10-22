// Layer 2, client state. The layout facade owns the stable public import surface while sibling
// modules keep their implementation helpers private to the folder.

export {
    LAYOUT_VERSION,
    MAIN_VIEW,
    MAX_CHILDREN,
    MIN_SIZE,
    defaultLayout,
    defaultPages,
    defaultWorkbench,
    emptyPane,
    floatHost,
    folderName,
    folderPlace,
    hostsOf,
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
    FolderItem,
    FolderRef,
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
    markDocuments,
    moveInstance,
    openInstance,
    pageLeaves,
    paneAt,
    removeTab,
    resize,
    restate,
    setLocked,
    setRowHidden,
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
    defaultBeside,
    placeFits,
    rebuiltPage,
    resetAll,
    withoutHeld,
    writeHost
} from './open/float/pages.ts';
export type { Arranged, Builds, UniqueRule } from './open/float/pages.ts';
export { WINDOW_START, createFloatOps } from './open/float/store.ts';
export { createFolderOps } from './open/float/folder-store.ts';
export type { FolderLayout, FolderOps } from './open/float/folder-store.ts';
export type { FloatOps, WindowBounds } from './open/float/store.ts';
export type { FloatSpec } from './open/float/pages.ts';
export { newTextFileOpener, untitledLabel } from './open/new-text-file.ts';
export {
    asPreview,
    isPreview,
    keepInstance,
    previewIn,
    retarget,
    stillPreview
} from './open/preview.ts';
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
export { checkLayout, checkPages, checkWorkbench, serialiseLayout } from './saved/saved.ts';
export type { LayoutAccess } from './access.ts';
export { createStorage } from './saved/storage.ts';
export type { LayoutStorage } from './saved/storage.ts';
export { createLoad } from './saved/load.ts';
export type { DocSource } from './saved/docs.ts';
export { createAttention } from './open/attention.ts';
export type { Attention, Beside, Touched } from './open/attention.ts';
export { createInstances } from './tabs/instances.ts';
export type { Instances } from './tabs/instances.ts';
export { carriedIndex, leftOutTabs } from './tabs/left-out.ts';
export { createOpening } from './open/opening.ts';
export type { OpenOptions, Opening } from './open/opening.ts';
export { createShowDeck, createShowInFiles, createShowPlaced } from './open/show.ts';
export type { Dock, PlaceRule } from './open/show.ts';
export { createAway } from './open/away.ts';
export type { Away } from './open/away.ts';
export type { ShowDeck, ShowInFiles } from './open/show.ts';
export {
    activePath,
    cardCursor,
    documentState,
    editorTab,
    findInstance,
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
    tabForKind,
    tabWithEditor,
    tabsOf,
    withCardCursor
} from './instance.ts';
export type { AppOpens } from './instance.ts';
