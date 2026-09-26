// Layer 2, server. The usage refresh POST accepts one Claude account label only after the same
// origin and ServerContext token checks as the HPC refresh route, then calls that context's
// refresher.

import { gatedBody } from '../../core/auth.ts';

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
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const label = body.account;
    if (typeof label !== 'string' || label === '') return json(400, { error: 'bad account' });
    if (!(await target.refresh(label))) return json(404, { error: 'account not found' });
    return json(200, { status: 'ok' });
}
