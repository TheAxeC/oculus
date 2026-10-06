// Layer 2, server (the desktop host). Which permissions a page may have. The server's own page is
// granted the three it uses: reading the clipboard (Paste in a terminal's menu), writing it
// sanitized, and full screen. Every other permission is denied, and every permission is denied to
// any other origin. A pure function, read by tests/server/desktop/window-guard.test.ts.

/** The permissions the server's page is granted. */
const GRANTED: readonly string[] = ['clipboard-read', 'clipboard-sanitized-write', 'fullscreen'];

/** Whether `permission`, asked for by a page of `origin`, is granted, given the server's origin. */
export function permissionGranted(
    permission: string,
    origin: string,
    serverOrigin: string
): boolean {
    return origin === serverOrigin && GRANTED.includes(permission);
}
