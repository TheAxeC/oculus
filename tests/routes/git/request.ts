// The requests the /api/git route tests send: the host the route is reached on and a same-origin
// POST carrying the token.

/** The host of the route under test. */
export const HOST = '127.0.0.1:8791';

/** A same-origin JSON POST to /api/git with the token, `headers` laid over the usual ones. */
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
        body: JSON.stringify(body)
    });
}
