// Layer 2, server. The usage refresh POST accepts one Claude account label only after the same
// origin and ServerContext token checks as the HPC refresh route, then calls that context's refresher.

import { hasToken, sameOrigin } from '../auth.ts';

export type UsageRefreshTarget = {
    token: string;
    refresh: (label: string) => Promise<boolean>;
};

const json = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function handleUsageRefresh(
    request: Request,
    target: UsageRefreshTarget
): Promise<Response> {
    if (
        !sameOrigin(request, request.headers.get('host') ?? '') ||
        !hasToken(request, target.token)
    ) {
        return json(403, { error: 'forbidden' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'bad body' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json(400, { error: 'bad body' });
    }
    const label = (body as Record<string, unknown>).account;
    if (typeof label !== 'string' || label === '') return json(400, { error: 'bad account' });
    if (!(await target.refresh(label))) return json(404, { error: 'account not found' });
    return json(200, { status: 'ok' });
}
