// Layer 2, client state. The one way a store posts a JSON body with the write token: a 403 renews
// the token and posts once more, so a token that ran out is not a refusal the reader sees.

/** The write token of the page, and the call that renews it (WritesStore). */
export type TokenSource = { writeToken: () => string; renewToken: () => Promise<void> };

/**
 * Post a JSON body to an endpoint with the write token. A 403 renews the token and posts once more;
 * the answer is the response of the last post, and a failed request throws. `keepalive` lets the
 * request outlive the page, as a write sent while the page goes away needs.
 */
export async function postWithToken(
    url: string,
    body: unknown,
    writes: TokenSource,
    keepalive = false
): Promise<Response> {
    const send = (): Promise<Response> =>
        fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writes.writeToken() },
            body: JSON.stringify(body),
            ...(keepalive ? { keepalive } : {})
        });
    const response = await send();
    if (response.status !== 403) return response;
    await writes.renewToken();
    return send();
}
