// Layer 2, client state. What a page tells the host of an app about a panel whose tab closed. The
// host's registry reads the panel under the field `view`, as it reads every view the page reports
// on, so the body is made here once for the page to post and the tests to post back.

/** The body of the `/api/app-host` post that tells a host its panel's tab is closed. */
export function panelDisposed(app: string, panel: string, page: string) {
    return { action: 'event', app, kind: 'dispose', params: { view: panel }, page } as const;
}
