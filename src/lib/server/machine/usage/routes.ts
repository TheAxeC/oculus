// Layer 2, server. The usage refresh POST accepts one Claude account label only after the same
// ServerContext token check as the HPC refresh route, then calls that context's refresher.

import { json } from '@sveltejs/kit';
import { gatedBody } from '../../core/auth.ts';

export type UsageRefreshTarget = {
    token: string;
    refresh: (label: string) => Promise<boolean>;
};

export async function handleUsageRefresh(
    request: Request,
    target: UsageRefreshTarget
): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const label = body.account;
    if (typeof label !== 'string' || label === '')
        return json({ error: 'bad account' }, { status: 400 });
    if (!(await target.refresh(label)))
        return json({ error: 'account not found' }, { status: 404 });
    return json({ status: 'ok' });
}
