// Layer 4, test helper. The requests the /api/git route tests send: the host the route is reached
// on and a same-origin POST carrying the token.

/** The host of the route under test. */
const HOST = '127.0.0.1:8791';

/**
 * A same-origin POST to /api/git with the token, `headers` laid over the usual ones. A body that
 * is text is sent as it is, so a case can send what is no JSON; any other body is sent as JSON.
 */
export function gitPost(
    token: string,
    body: unknown,
    headers: Record<string, string> = {}
): Request {
    return new Request(`http://${HOST}/api/git`, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': token,
            ...headers
        },
        body: typeof body === 'string' ? body : JSON.stringify(body)
    });
}
