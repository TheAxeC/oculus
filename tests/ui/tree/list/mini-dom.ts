// Layer 4, test helper. The smallest document Svelte's client runtime and @tanstack/virtual-core
// need to mount ui/tree/list/VirtualRows.svelte in the client project, which has no DOM: nodes, a
// parser for the template markup the Svelte compiler emits, and a fixed layout in which an element
// marked `data-scroll` (the scroll box) is BOX px high and every other element ROW px high, all at
// the top of the page. A case hands `documentGlobals()` to `vi.stubGlobal` and unstubs them after.

export const ROW = 20;
export const BOX = 100;

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'wbr']);

class MiniNode {
    static ELEMENT_NODE = 1;
    static TEXT_NODE = 3;
    static COMMENT_NODE = 8;
    static DOCUMENT_FRAGMENT_NODE = 11;
    nodeType = 0;
    nodeName = '';
    parentNode: MiniNode | null = null;
    childNodes: MiniNode[] = [];
    get ownerDocument(): unknown {
        return doc;
    }
    get firstChild(): MiniNode | null {
        return this.childNodes[0] ?? null;
    }
    get lastChild(): MiniNode | null {
        return this.childNodes.at(-1) ?? null;
    }
    get nextSibling(): MiniNode | null {
        const parent = this.parentNode;
        if (parent === null) return null;
        return parent.childNodes[parent.childNodes.indexOf(this) + 1] ?? null;
    }
    get previousSibling(): MiniNode | null {
        const parent = this.parentNode;
        if (parent === null) return null;
        const at = parent.childNodes.indexOf(this);
        return at > 0 ? parent.childNodes[at - 1] : null;
    }
    get parentElement(): MiniElement | null {
        return this.parentNode instanceof MiniElement ? this.parentNode : null;
    }
    get isConnected(): boolean {
        return (this as MiniNode) === doc.body || (this.parentNode?.isConnected ?? false);
    }
    get textContent(): string {
        return this.childNodes.map((child) => child.textContent).join('');
    }
    set textContent(value: string) {
        for (const child of [...this.childNodes]) child.parentNode = null;
        this.childNodes = [];
        if (value !== '') this.appendChild(new MiniText(value));
    }
    insertBefore(node: MiniNode, ref: MiniNode | null): MiniNode {
        const moved = node.nodeType === 11 ? [...node.childNodes] : [node];
        for (const one of moved) {
            one.parentNode?.removeChild(one);
            const at = ref === null ? this.childNodes.length : this.childNodes.indexOf(ref);
            if (at < 0) throw new Error('insertBefore: the reference is not a child');
            this.childNodes.splice(at, 0, one);
            one.parentNode = this;
        }
        return node;
    }
    appendChild(node: MiniNode): MiniNode {
        return this.insertBefore(node, null);
    }
    removeChild(node: MiniNode): MiniNode {
        const at = this.childNodes.indexOf(node);
        if (at < 0) throw new Error('removeChild: not a child');
        this.childNodes.splice(at, 1);
        node.parentNode = null;
        return node;
    }
    remove(): void {
        this.parentNode?.removeChild(this);
    }
    before(...nodes: (MiniNode | string)[]): void {
        const parent = this.parentNode;
        if (parent === null) return;
        for (const node of nodes) parent.insertBefore(asNode(node), this);
    }
    after(...nodes: (MiniNode | string)[]): void {
        const parent = this.parentNode;
        if (parent === null) return;
        const next = this.nextSibling;
        for (const node of nodes) parent.insertBefore(asNode(node), next);
    }
    append(...nodes: (MiniNode | string)[]): void {
        for (const node of nodes) this.appendChild(asNode(node));
    }
    replaceWith(...nodes: (MiniNode | string)[]): void {
        this.before(...nodes);
        this.remove();
    }
    contains(node: MiniNode | null): boolean {
        for (let at = node; at !== null; at = at.parentNode) if (at === this) return true;
        return false;
    }
    cloneNode(deep = false): MiniNode {
        const copy = this.shallow();
        if (deep) for (const child of this.childNodes) copy.appendChild(child.cloneNode(true));
        return copy;
    }
    shallow(): MiniNode {
        return new MiniFragment();
    }
    addEventListener(): void {
        // No event reaches a node of this document.
    }
    removeEventListener(): void {
        // No event reaches a node of this document.
    }
    dispatchEvent(): boolean {
        return true;
    }
}

function asNode(node: MiniNode | string): MiniNode {
    return typeof node === 'string' ? new MiniText(node) : node;
}

class MiniCharacterData extends MiniNode {
    data: string;
    constructor(data: string) {
        super();
        this.data = data;
    }
    get nodeValue(): string {
        return this.data;
    }
    set nodeValue(value: string) {
        this.data = value;
    }
    override get textContent(): string {
        return this.data;
    }
    override set textContent(value: string) {
        this.data = value;
    }
}

class MiniText extends MiniCharacterData {
    override nodeType = 3;
    override nodeName = '#text';
    override shallow(): MiniNode {
        return new MiniText(this.data);
    }
}

class MiniComment extends MiniCharacterData {
    override nodeType = 8;
    override nodeName = '#comment';
    override shallow(): MiniNode {
        return new MiniComment(this.data);
    }
}

class MiniFragment extends MiniNode {
    override nodeType = 11;
    override nodeName = '#document-fragment';
}

class MiniStyle {
    props = new Map<string, string>();
    setProperty(name: string, value: string): void {
        this.props.set(name, value);
    }
    removeProperty(name: string): void {
        this.props.delete(name);
    }
    getPropertyValue(name: string): string {
        return this.props.get(name) ?? '';
    }
    get cssText(): string {
        return [...this.props].map(([name, value]) => `${name}: ${value};`).join(' ');
    }
    set cssText(value: string) {
        this.props.clear();
        for (const part of value.split(';')) {
            const [name, ...rest] = part.split(':');
            if (name.trim() !== '') this.props.set(name.trim(), rest.join(':').trim());
        }
    }
}

class MiniElement extends MiniNode {
    override nodeType = 1;
    localName: string;
    namespaceURI = 'http://www.w3.org/1999/xhtml';
    attributes = new Map<string, string>();
    style = new MiniStyle();
    scrollTop = 0;
    scrollLeft = 0;
    constructor(tag: string) {
        super();
        this.localName = tag.toLowerCase();
        this.nodeName = tag.toUpperCase();
    }
    get tagName(): string {
        return this.nodeName;
    }
    getAttribute(name: string): string | null {
        return this.attributes.get(name) ?? null;
    }
    setAttribute(name: string, value: string | number | boolean): void {
        this.attributes.set(name, String(value));
    }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
    }
    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }
    get className(): string {
        return this.getAttribute('class') ?? '';
    }
    set className(value: string) {
        this.setAttribute('class', value);
    }
    get classList(): {
        add: (n: string) => void;
        remove: (n: string) => void;
        toggle: (n: string, on?: boolean) => void;
        contains: (n: string) => boolean;
    } {
        const names = (): string[] => this.className.split(/\s+/).filter((n) => n !== '');
        const write = (list: string[]): void => this.setAttribute('class', list.join(' '));
        return {
            add: (n) => write([...new Set([...names(), n])]),
            remove: (n) => write(names().filter((one) => one !== n)),
            toggle: (n, on) =>
                (on ?? !names().includes(n))
                    ? write([...new Set([...names(), n])])
                    : write(names().filter((one) => one !== n)),
            contains: (n) => names().includes(n)
        };
    }
    get dataset(): Record<string, string> {
        return new Proxy(
            {},
            {
                get: (_, key: string) => this.getAttribute(`data-${key}`) ?? undefined,
                set: (_, key: string, value: string) => {
                    this.setAttribute(`data-${key}`, value);
                    return true;
                }
            }
        );
    }
    /** The element or its nearest ancestor matching `[name]` or a tag name. */
    closest(selector: string): MiniElement | null {
        const attribute = /^\[([\w-]+)\]$/.exec(selector)?.at(1);
        const matches =
            attribute === undefined ? this.localName === selector : this.hasAttribute(attribute);
        return matches ? this : (this.parentElement?.closest(selector) ?? null);
    }
    get offsetHeight(): number {
        return this.hasAttribute('data-scroll') ? BOX : ROW;
    }
    readonly offsetWidth = 200;
    getBoundingClientRect(): {
        top: number;
        left: number;
        bottom: number;
        right: number;
        width: number;
        height: number;
        x: number;
        y: number;
    } {
        const height = this.offsetHeight;
        return { top: 0, left: 0, bottom: height, right: 200, width: 200, height, x: 0, y: 0 };
    }
    focus(): void {
        // Focus moves nothing in this document.
    }
    override shallow(): MiniNode {
        const copy = make(this.localName);
        for (const [name, value] of this.attributes) copy.setAttribute(name, value);
        return copy;
    }
}

class MiniHTMLElement extends MiniElement {}

class MiniTemplate extends MiniHTMLElement {
    content: MiniNode = new MiniFragment();
    set innerHTML(html: string) {
        this.content = parse(html);
    }
    override shallow(): MiniNode {
        const copy = new MiniTemplate('template');
        copy.content = this.content.cloneNode(true);
        return copy;
    }
}

function make(tag: string): MiniElement {
    return tag.toLowerCase() === 'template' ? new MiniTemplate(tag) : new MiniHTMLElement(tag);
}

function decode(text: string): string {
    return text
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&');
}

/** Parse the markup the Svelte compiler emits for a template: elements, text and comments. */
function parse(html: string): MiniFragment {
    const root = new MiniFragment();
    const open: MiniNode[] = [root];
    let at = 0;
    while (at < html.length) {
        const top = open[open.length - 1];
        if (html.startsWith('<!--', at)) {
            const end = html.indexOf('-->', at + 4);
            top.appendChild(new MiniComment(html.slice(at + 4, end)));
            at = end + 3;
        } else if (html.startsWith('</', at)) {
            at = html.indexOf('>', at) + 1;
            open.pop();
        } else if (html[at] === '<') {
            const tag = /^<([a-zA-Z][\w-]*)/.exec(html.slice(at))?.at(1);
            if (tag === undefined) throw new Error(`no tag at ${String(at)} of ${html}`);
            at += tag.length + 1;
            const element = make(tag);
            for (;;) {
                const rest = html.slice(at);
                const close = /^\s*(\/?)>/.exec(rest);
                if (close !== null) {
                    at += close[0].length;
                    top.appendChild(element);
                    if (close[1] !== '/' && !VOID.has(tag.toLowerCase())) open.push(element);
                    break;
                }
                const attribute = /^\s*([^\s=/>]+)(?:="([^"]*)")?/.exec(rest);
                if (attribute === null) throw new Error(`no attribute at ${String(at)} of ${html}`);
                element.setAttribute(attribute[1], decode(attribute.at(2) ?? ''));
                at += attribute[0].length;
            }
        } else {
            const end = html.indexOf('<', at);
            const text = html.slice(at, end < 0 ? html.length : end);
            top.appendChild(new MiniText(decode(text)));
            at += text.length;
        }
    }
    return root;
}

/** An observer that never reports, since nothing in this document changes size. */
class MiniResizeObserver {
    observe(): void {
        // Nothing is resized.
    }
    unobserve(): void {
        // Nothing is resized.
    }
    disconnect(): void {
        // Nothing is resized.
    }
}

const doc = {
    body: new MiniHTMLElement('body'),
    activeElement: null as MiniElement | null,
    defaultView: undefined as unknown,
    createElement: (tag: string) => make(tag),
    createElementNS: (_: string, tag: string) => make(tag),
    createTextNode: (value: string) => new MiniText(value),
    createComment: (value: string) => new MiniComment(value),
    createDocumentFragment: () => new MiniFragment(),
    importNode: (node: MiniNode, deep?: boolean) => node.cloneNode(deep),
    addEventListener: () => undefined,
    removeEventListener: () => undefined
};

const win = {
    document: doc,
    ResizeObserver: MiniResizeObserver,
    onscrollend: null,
    setTimeout: (run: () => void, ms?: number) => setTimeout(run, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    requestAnimationFrame: (run: () => void) => setTimeout(run, 0),
    cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    getComputedStyle: () => ({ direction: 'ltr', getPropertyValue: () => '' }),
    addEventListener: () => undefined,
    removeEventListener: () => undefined
};
doc.defaultView = win;

/** The globals Svelte and the virtualizer read, and the body a case mounts into. */
export function documentGlobals(): { globals: Record<string, unknown>; body: HTMLElement } {
    doc.body.textContent = '';
    return {
        body: doc.body as unknown as HTMLElement,
        globals: {
            window: win,
            document: doc,
            navigator: { userAgent: 'mini-dom' },
            Node: MiniNode,
            Element: MiniElement,
            HTMLElement: MiniHTMLElement,
            HTMLTemplateElement: MiniTemplate,
            Text: MiniText,
            Comment: MiniComment,
            DocumentFragment: MiniFragment,
            ResizeObserver: MiniResizeObserver,
            requestAnimationFrame: win.requestAnimationFrame,
            cancelAnimationFrame: win.cancelAnimationFrame,
            getComputedStyle: win.getComputedStyle
        }
    };
}
