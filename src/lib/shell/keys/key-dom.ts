// Layer 3, shell. Keyboard actions over the focused pane's DOM. Each reports whether a target
// exists and was acted on, so an unavailable action leaves the browser's default key handling
// intact.
//
// A pane keeps the views of the tabs it has shown mounted, the one it shows drawn and the others
// hidden (shell/panes/TabView.svelte), so every action here looks inside the view the pane shows
// and never at a hidden one: a search box or a card of a tab the reader is not looking at is not
// one a key acts on.

/**
 * The event a key sends the focused pane when the pane's own close question or opener is what the
 * key means (Cmd+W closes its active tab, Cmd+N opens a text file in it): the pane component holds
 * both, and the key handler holds neither. The detail is the command.
 */
export const PANE_COMMAND = 'oculus-pane-command';

/** The commands a pane answers on PANE_COMMAND. */
export type PaneCommand = 'close-tab' | 'new-text-file';

/** The attachment that makes a pane answer PANE_COMMAND with `answer`. */
export function answersCommands(
    answer: (command: PaneCommand) => void
): (node: HTMLElement) => () => void {
    return (node) => {
        const heard = (event: Event): void => answer((event as CustomEvent<PaneCommand>).detail);
        node.addEventListener(PANE_COMMAND, heard);
        return () => node.removeEventListener(PANE_COMMAND, heard);
    };
}

/** The selector of the view a pane shows, among the tab views it keeps mounted. */
export const SHOWN_VIEW = '[data-tab-view]:not([hidden])';

/** The view the pane shows, or null for a pane showing none. */
export function shownView(pane: ParentNode | null): HTMLElement | null {
    return pane?.querySelector<HTMLElement>(SHOWN_VIEW) ?? null;
}

/** Focus and select the shown view's search text only when a search input exists. */
export function focusSearch(pane: ParentNode | null): boolean {
    const search = shownView(pane)?.querySelector<HTMLInputElement>('input[data-search]');
    if (!search) return false;
    search.focus();
    search.select();
    return true;
}

/** The selector for one card id, quoted so punctuation in an id remains data. */
export function cardSelector(id: string): string {
    return `[data-card=${JSON.stringify(id)}]`;
}

/** The controls the keyboard can focus, which Enter on a card with a field area looks for. */
const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Activate the selected card. A card with a field area (`[data-card-focus]`, a Settings card) moves
 * the focus to the first control in it and clicks nothing, so a checkbox keeps its value; any other
 * card presses its title, or its marked toggle when the title is plain.
 */
export function activateCursor(pane: ParentNode | null, cursor: string | null): boolean {
    if (cursor === null) return false;
    const card = shownView(pane)?.querySelector<HTMLElement>(cardSelector(cursor));
    const field = card?.querySelector<HTMLElement>(`[data-card-focus] :is(${FOCUSABLE})`);
    if (field) {
        field.focus();
        return true;
    }
    const control = card?.querySelector<HTMLElement>('.title button, [data-card-toggle]');
    if (!control) return false;
    control.click();
    return true;
}

/**
 * Prefer the shown view's marked body, and inside it a nested mark when the view scrolls its own
 * column (Transcript); otherwise use the first scrolling descendant in document order.
 */
export function scrollContainer(
    pane: ParentNode | null,
    overflowY: (element: HTMLElement) => string = (element) => getComputedStyle(element).overflowY
): HTMLElement | null {
    const body = shownView(pane);
    if (!body) return null;
    const marked = body.querySelector<HTMLElement>('[data-scroll]');
    if (marked) return marked.querySelector<HTMLElement>('[data-scroll]') ?? marked;
    return (
        [...body.querySelectorAll<HTMLElement>('*')].find((element) => {
            const overflow = overflowY(element);
            return overflow === 'auto' || overflow === 'scroll';
        }) ?? null
    );
}

/** Scroll an existing region smoothly; a pane with none leaves the key unclaimed. */
export function scrollRegion(
    scroller: Pick<HTMLElement, 'scrollHeight' | 'scrollTo'> | null,
    edge: 'top' | 'bottom'
): boolean {
    if (scroller === null) return false;
    scroller.scrollTo({ top: edge === 'top' ? 0 : scroller.scrollHeight, behavior: 'smooth' });
    return true;
}
