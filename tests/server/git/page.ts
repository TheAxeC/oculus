// Layer 4, test helper. A POST as this application's own page makes it: from its own origin, on
// the host the server listens on, with the process token, so the endpoint's gate lets it through
// and a case reaches the operation behind it.

/** One page POST of `body` as JSON to `url`, carrying `token`. */
export function pageRequest(url: string, token: string, body: unknown): Request {
    const { host, origin } = new URL(url);
    return new Request(url, {
        method: 'POST',
        headers: {
            host,
            origin,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}
