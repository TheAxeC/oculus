// Layer 2, server. The calendar endpoints: the one POST the page presses, and the callback the
// provider sends the reader's browser to.
//
// The POST carries the origin and token gates every other action carries. Connect, Add and Remove
// are the account actions both connectors answer alike, in connect/actions.ts; refresh and the
// control that opens one event are the calendar's own. The callback carries neither gate: the
// browser arrives there from the provider and not from the page, so what guards it is the `state`
// this process minted ten minutes earlier and holds in memory, which is taken once and never again.
//
// The page hands this module one URL, the published link an Add of a provider `ics` carries, which
// is written to the account's own file and never opened. Connect names an account and the consent
// URL is built from its client half; the link control names an event and the URL is read from the
// state the poller published, so the only addresses the operating system is ever given are the
// providers' own and the https `URL` a published calendar gives one of its events.
//
// No answer of this module carries a token, a secret, an authorization code or an event's contents.

import type { CalendarAccountConfig } from '../../../data/model/index.ts';
import { httpsLink } from '../connect/api.ts';
import { gatedBody } from '../../core/auth.ts';
import {
    accountAction,
    handleConnectCallback,
    json,
    type AccountTarget,
    type CallbackTarget
} from '../connect/actions.ts';

export type { CallbackWords } from '../connect/actions.ts';

export type CalendarTarget = AccountTarget & {
    token: string;
    accounts: CalendarAccountConfig[];
    refresh: () => Promise<void>;
    /**
     * The provider's page for one event of the state last published, or null when there is none.
     */
    linkFor: (id: string) => string | null;
};

export type CalendarCallbackTarget = CallbackTarget;

export async function handleCalendar(request: Request, target: CalendarTarget): Promise<Response> {
    const record = await gatedBody(request, target.token);
    if (record instanceof Response) return record;
    if (record.action === 'refresh') {
        await target.refresh();
        return json(200, { status: 'ok' });
    }
    const answered = accountAction('calendar', target, record);
    if (answered !== null) return answered;
    if (record.action === 'open') {
        const held = typeof record.event === 'string' ? target.linkFor(record.event) : null;
        // The scheme is checked again here, where the operating system is about to be called, and
        // not only where the provider's answer was read.
        const link = httpsLink(held ?? undefined);
        if (link === undefined) return json(400, { error: 'no such event' });
        await target.open(link);
        return json(200, { ok: true });
    }
    return json(400, { error: 'bad action' });
}

/**
 * The provider's redirect after a calendar consent: the code exchanged for the account's refresh
 * token, once, against the state this process minted.
 */
export function handleCalendarCallback(
    request: Request,
    target: CalendarCallbackTarget
): Promise<Response> {
    return handleConnectCallback('calendar', request, target);
}
