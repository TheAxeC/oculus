// Layer 1, data. The locale a terminal oculus starts carries, as the `NAME=value` pairs of its
// environment: oculus's own where that is UTF-8, else the platform's default one. A tmux session
// takes none from the client that starts it, and in a pane with no UTF-8 locale zsh counts the
// bytes of its prompt and draws a completed line wrong. Server side only: it is what a process
// starts with.
//
// The environment and the platform are parameters, so each branch runs on any machine.

/** The variables that set the locale of a process's characters, in the C library's order. */
const LOCALE_NAMES = ['LC_ALL', 'LC_CTYPE', 'LANG'] as const;

/**
 * Whether the value of a locale variable names UTF-8, in either case: as its codeset
 * (`en_US.UTF-8`) or as the whole value (macOS's `LC_CTYPE=UTF-8`). macOS has no locale named
 * without the hyphen, and other platforms read `utf8` as `UTF-8`.
 */
function namesUtf8(value: string, platform: NodeJS.Platform): boolean {
    const name = platform === 'darwin' ? /(?:^|\.)utf-8(?:@|$)/i : /(?:^|\.)utf-?8(?:@|$)/i;
    return name.test(value);
}

/**
 * The pairs of a terminal's UTF-8 locale. A process whose locale is UTF-8 hands on each of the
 * three variables it sets. Any other process gives the platform's default as `LANG`, with an empty
 * value, which the C library reads as unset, for each of `LC_ALL` and `LC_CTYPE` it sets: the tmux
 * server it started holds the same value, which would win over that `LANG`.
 */
export function localeEnv(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string[] {
    const set = LOCALE_NAMES.flatMap((name) => {
        const value = env[name] ?? '';
        return value === '' ? [] : [{ name, value }];
    });
    if (set.length > 0 && namesUtf8(set[0].value, platform)) {
        return set.map(({ name, value }) => `${name}=${value}`);
    }
    return [
        `LANG=${platform === 'darwin' ? 'en_US.UTF-8' : 'C.UTF-8'}`,
        ...set.filter(({ name }) => name !== 'LANG').map(({ name }) => `${name}=`)
    ];
}
