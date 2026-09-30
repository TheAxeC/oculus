// Layer 2, client state. Whether the code runs where a fetch is the page's own.

/**
 * Whether this runs where a fetch is the page's own. A server rendering has a global fetch in Node
 * but no page to resolve a relative address against, so a store that asks only in the browser
 * asks for nothing there and every answer stays pending until the browser's first render.
 */
export function inBrowser(): boolean {
    return typeof window !== 'undefined' && typeof fetch === 'function';
}
