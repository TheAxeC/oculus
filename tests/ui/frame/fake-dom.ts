// Layer 4, test helper. A page's document with only what Svelte's client runtime reads to mount a
// component and to reconcile a keyed each block: nodes with children and siblings, the templates
// a component clones, attributes, text, comments and event listeners. Elements hold no layout and
// run no script, and `innerHTML` of a template reads the markup Svelte compiles, which is well
// formed (tags, quoted attributes, text and comments).
//
// `installDom()` puts the globals in place and returns the root element a component is mounted
// on; `removeDom()` takes them away. The cases that use it run in the client runtime
// (tests/ui/frame/client-runtime.ts), where `*.client.test.ts` files are transformed as the
// browser's.

import { vi } from 'vitest';

export const ELEMENT = 1;
export const TEXT = 3;
export const COMMENT = 8;
export const FRAGMENT = 11;

const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link']);

/** A method of the document the cases never need to do anything. */
const NOTHING = (): void => undefined;

export class FakeNode {
    parentNode: FakeNode | null = null;
    childNodes: FakeNode[] = [];
    nodeValue: string | null = null;
    readonly isConnected = true;
    readonly addEventListener = NOTHING;
    readonly removeEventListener = NOTHING;

    constructor(readonly nodeType: number = ELEMENT) {}

    get firstChild(): FakeNode | null {
        return this.childNodes[0] ?? null;
    }
    get lastChild(): FakeNode | null {
        return this.childNodes.at(-1) ?? null;
    }
    get nextSibling(): FakeNode | null {
        const own = this.parentNode?.childNodes;
        return own?.[own.indexOf(this) + 1] ?? null;
    }
    get previousSibling(): FakeNode | null {
        const own = this.parentNode?.childNodes;
        return own?.[own.indexOf(this) - 1] ?? null;
    }
    get textContent(): string {
        if (this.nodeType === TEXT) return this.nodeValue ?? '';
        return this.childNodes.map((one) => one.textContent).join('');
    }
    set textContent(value: string) {
        for (const one of this.childNodes) one.parentNode = null;
        this.childNodes = [];
        if (value !== '') this.appendChild(new FakeText(value));
    }

    insertBefore(node: FakeNode, before: FakeNode | null): FakeNode {
        if (node.nodeType === FRAGMENT) {
            for (const one of [...node.childNodes]) this.insertBefore(one, before);
            return node;
        }
        node.parentNode?.removeChild(node);
        const at = before === null ? this.childNodes.length : this.childNodes.indexOf(before);
        this.childNodes.splice(at, 0, node);
        node.parentNode = this;
        return node;
    }
    appendChild(node: FakeNode): FakeNode {
        return this.insertBefore(node, null);
    }
    append(...nodes: FakeNode[]): void {
        for (const one of nodes) this.appendChild(one);
    }
    removeChild(node: FakeNode): FakeNode {
        const at = this.childNodes.indexOf(node);
        if (at >= 0) this.childNodes.splice(at, 1);
        node.parentNode = null;
        return node;
    }
    remove(): void {
        this.parentNode?.removeChild(this);
    }
    before(...nodes: FakeNode[]): void {
        for (const one of nodes) this.parentNode?.insertBefore(one, this);
    }
    after(...nodes: FakeNode[]): void {
        const next = this.nextSibling;
        for (const one of nodes) this.parentNode?.insertBefore(one, next);
    }
    replaceWith(...nodes: FakeNode[]): void {
        this.before(...nodes);
        this.remove();
    }
    cloneNode(deep: boolean): FakeNode {
        const copy = this.copy();
        if (deep) for (const one of this.childNodes) copy.appendChild(one.cloneNode(true));
        return copy;
    }
    protected copy(): FakeNode {
        return new FakeNode(this.nodeType);
    }
}

export class FakeText extends FakeNode {
    constructor(value = '', type: number = TEXT) {
        super(type);
        this.nodeValue = value;
    }
    get data(): string {
        return this.nodeValue ?? '';
    }
    set data(value: string) {
        this.nodeValue = value;
    }
    protected copy(): FakeNode {
        return new FakeText(this.nodeValue ?? '', this.nodeType);
    }
}

export class FakeFragment extends FakeNode {
    constructor() {
        super(FRAGMENT);
    }
    protected copy(): FakeNode {
        return new FakeFragment();
    }
}

export class FakeElement extends FakeNode {
    readonly attributes = new Map<string, string>();
    readonly style: Record<string, unknown> = { setProperty: NOTHING };
    readonly content = new FakeFragment();
    readonly namespaceURI = 'http://www.w3.org/1999/xhtml';
    readonly focus = NOTHING;

    constructor(readonly tagName: string) {
        super(ELEMENT);
    }
    get nodeName(): string {
        return this.tagName;
    }
    setAttribute(name: string, value: string): void {
        this.attributes.set(name, value);
    }
    getAttribute(name: string): string | null {
        return this.attributes.get(name) ?? null;
    }
    hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
    }
    get className(): string {
        return this.attributes.get('class') ?? '';
    }
    set className(value: string) {
        this.attributes.set('class', value);
    }
    set innerHTML(html: string) {
        const target = this.tagName === 'TEMPLATE' ? this.content : this;
        target.textContent = '';
        parse(html, target);
    }
    protected copy(): FakeNode {
        const copy = new FakeElement(this.tagName);
        for (const [name, value] of this.attributes) copy.attributes.set(name, value);
        return copy;
    }
    /** The elements below this one that carry the attribute, in document order. */
    all(attribute: string): FakeElement[] {
        const found: FakeElement[] = [];
        const walk = (node: FakeNode): void => {
            for (const one of node.childNodes) {
                if (one instanceof FakeElement && one.attributes.has(attribute)) found.push(one);
                walk(one);
            }
        };
        walk(this);
        return found;
    }
}

const TAG =
    /<!--([\s\S]*?)-->|<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)((?:\s+[^\s=>/]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/y;
const ATTRIBUTE = /([^\s=>/]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

/** Read well-formed markup into `into`. */
function parse(html: string, into: FakeNode): void {
    const open: FakeNode[] = [into];
    const here = (): FakeNode => open.at(-1) ?? into;
    let at = 0;
    while (at < html.length) {
        if (html[at] !== '<') {
            const next = html.indexOf('<', at);
            const end = next < 0 ? html.length : next;
            here().appendChild(new FakeText(html.slice(at, end)));
            at = end;
            continue;
        }
        TAG.lastIndex = at;
        const match = TAG.exec(html);
        if (match === null) {
            throw new Error(`fake DOM cannot read markup at ${html.slice(at, at + 30)}`);
        }
        at = TAG.lastIndex;
        const [, comment, close, name, attributes, selfClosing] = match as (string | undefined)[];
        if (comment !== undefined) here().appendChild(new FakeText(comment, COMMENT));
        else if (close !== undefined) open.pop();
        else if (name !== undefined) {
            const element = new FakeElement(name.toUpperCase());
            for (const one of (attributes ?? '').matchAll(ATTRIBUTE)) {
                const [, key, double, single, bare] = one as (string | undefined)[];
                element.setAttribute(key ?? '', double ?? single ?? bare ?? '');
            }
            here().appendChild(element);
            if (selfClosing !== '/' && !VOID.has(name)) open.push(element);
        }
    }
}

/** Put the globals Svelte's client runtime reads in place; the root element is returned. */
export function installDom(): FakeElement {
    const root = new FakeElement('DIV');
    const document = {
        createElement: (name: string) => new FakeElement(name.toUpperCase()),
        createTextNode: (value: string) => new FakeText(value),
        createComment: (value: string) => new FakeText(value, COMMENT),
        createDocumentFragment: () => new FakeFragment(),
        importNode: (node: FakeNode, deep: boolean) => node.cloneNode(deep),
        addEventListener: NOTHING,
        removeEventListener: NOTHING,
        body: root,
        activeElement: null,
        head: new FakeElement('HEAD')
    };
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', {
        document,
        addEventListener: NOTHING,
        removeEventListener: NOTHING
    });
    vi.stubGlobal('navigator', { userAgent: 'fake' });
    vi.stubGlobal('Node', FakeNode);
    vi.stubGlobal('Element', FakeElement);
    vi.stubGlobal('Text', FakeText);
    vi.stubGlobal('Comment', FakeText);
    vi.stubGlobal('HTMLElement', FakeElement);
    return root;
}

/** Take the globals away. */
export function removeDom(): void {
    vi.unstubAllGlobals();
}
