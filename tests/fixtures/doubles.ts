// Layer 4, test helper. The inert callbacks a case hands to a component, a fixture or a double when
// it asserts nothing about the call, and the write request a page sends. They exist once here so a
// case says "nothing happens on this callback" in one word rather than writing an empty function
// at every prop, and every route test posts the same page request.

/** A callback whose call the case does not read. */
export const noop = (): void => undefined;

/** The same where the caller awaits what the callback returns. */
export const noopAsync = (): Promise<void> => Promise.resolve();

/** A POST as the page sends one: JSON, from the page's own origin, carrying the write token. */
export function pagePost(url: string, body: unknown, token: string): Request {
    return new Request(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}
