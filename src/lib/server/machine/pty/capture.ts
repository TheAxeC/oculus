// Layer 2, server. What a page that attaches to a terminal pane is given as the pane stands: the
// tmux calls that read the pane's text and the answer of one `display-message` that holds its
// cursor, its height, its alternate screen and its modes, and the readers that turn those into the
// bytes the page writes into its grid. The builders take the tmux session's name and read no state,
// so `sessions.ts`, which names sessions and starts them, and `channel.ts`, which sends the screen,
// both import this file and it imports neither.
//
// A pane is given in one of two shapes. In its normal screen it is the whole capture followed by a
// move to tmux's cursor and the modes the program set (`screenAt`, `modesAt`). With a program in
// its alternate screen it is the shell's text in the grid's normal buffer and the program's screen
// in the grid's alternate buffer (`alternateScreenAt`), so the program draws full screen and
// leaving it shows the shell's text again. `cursorArgs` asks every field either shape needs in one
// call, and each reader takes its fields by position.

/** The arguments that capture what the pane already shows, escape sequences and all. */
export function captureArgs(session: string, lines: number): string[] {
    return ['capture-pane', '-p', '-e', '-S', `-${lines}`, '-t', session];
}

/**
 * The arguments that capture the history of a pane in its alternate screen, the lines above the
 * screen the shell left. With no history tmux answers this range with the screen's top row, so it
 * is asked only when `#{history_size}` is above 0.
 */
export function historyArgs(session: string, lines: number): string[] {
    return ['capture-pane', '-p', '-e', '-S', `-${lines}`, '-E', '-1', '-t', session];
}

/**
 * The arguments that capture the normal screen a pane's program left when it entered the alternate
 * screen. Once the program has left, tmux answers one blank line (see `holdsSavedScreen`).
 */
export function savedScreenArgs(session: string): string[] {
    return ['capture-pane', '-p', '-e', '-q', '-a', '-t', session];
}

/** The arguments that capture the screen of a pane as it stands, here the alternate screen. */
export function alternateScreenArgs(session: string): string[] {
    return ['capture-pane', '-p', '-e', '-t', session];
}

/** The arguments that read whether the pane's program is in its alternate screen. */
export function alternateOnArgs(session: string): string[] {
    return ['display-message', '-p', '-t', session, '#{alternate_on}'];
}

/**
 * The modes a pane's program sets that the capture does not hold, as tmux names each one's flag,
 * the flag's value that differs from a grid just reset, and the sequence that sets that value in
 * the grid. The grid is reset before the capture is written into it, on a new grid and on a
 * reconnect alike, and a shell sets its modes only when it draws its prompt, so without these a
 * page that attaches to a waiting shell sends a paste without the bracketed-paste markers, and one
 * that attaches to an editor, in its normal or its alternate screen, sends the arrow keys and the
 * mouse in forms the editor did not ask for. Origin mode is left out: setting it moves the cursor
 * to the top of a scroll region the capture does not carry.
 */
const PANE_MODES: readonly (readonly [flag: string, value: '0' | '1', sequence: string])[] = [
    ['bracket_paste_flag', '1', '\u001b[?2004h'],
    ['keypad_cursor_flag', '1', '\u001b[?1h'],
    ['keypad_flag', '1', '\u001b='],
    ['mouse_standard_flag', '1', '\u001b[?1000h'],
    ['mouse_button_flag', '1', '\u001b[?1002h'],
    ['mouse_all_flag', '1', '\u001b[?1003h'],
    ['mouse_utf8_flag', '1', '\u001b[?1005h'],
    ['mouse_sgr_flag', '1', '\u001b[?1006h'],
    ['insert_flag', '1', '\u001b[4h'],
    ['wrap_flag', '0', '\u001b[?7l'],
    ['cursor_flag', '0', '\u001b[?25l']
];

/**
 * The arguments that read where tmux has a pane's cursor, how many rows the pane has, whether its
 * program is in the alternate screen with the cursor the shell left (column and row) and the lines
 * of history, and then the flag of each of PANE_MODES, in its order. The answer holds those fields
 * in that order and the readers below take each by its position.
 */
export function cursorArgs(session: string): string[] {
    const flags = PANE_MODES.map(([flag]) => `#{${flag}}`).join(' ');
    const alternate = '#{alternate_on} #{alternate_saved_x} #{alternate_saved_y} #{history_size}';
    return [
        'display-message',
        '-p',
        '-t',
        session,
        `#{cursor_x} #{cursor_y} #{pane_height} ${alternate} ${flags}`
    ];
}

/**
 * The fields of cursorArgs' answer before its flags: the three of the cursor and the four of the
 * alternate screen.
 */
const FIELDS_BEFORE_FLAGS = 7;

/** What tmux answers for a cursor the program saved with no position (an unsigned maximum). */
const NO_SAVED_CURSOR = 4294967295;

/** The fields of an answer of cursorArgs, an empty field kept in its place. */
function fieldsOf(answer: string): string[] {
    return answer.trimEnd().split(' ');
}

function isWhole(field: string | undefined): field is string {
    return field !== undefined && /^\d+$/.test(field);
}

/**
 * The sequences that set in a grid just reset the modes the pane's program has set, read from what
 * cursorArgs answered: empty when that answer does not hold a flag for each of PANE_MODES.
 */
export function modesAt(answer: string): string {
    const fields = fieldsOf(answer);
    const flags = fields.slice(FIELDS_BEFORE_FLAGS);
    if (!fields.slice(0, 3).every(isWhole)) return '';
    if (flags.length !== PANE_MODES.length || !flags.every((flag) => /^[01]$/.test(flag)))
        return '';
    return PANE_MODES.filter(([, value], at) => flags[at] === value)
        .map(([, , sequence]) => sequence)
        .join('');
}

/**
 * The screen an attaching page is given: the whole capture without its final newline, then the
 * cursor put where tmux has it. Written into a grid as high as the pane, the capture's last rows
 * are the pane's rows, so a new shell's prompt sits on its own row at the top rather than under
 * the capture's blank rows, and the rows under a prompt's cursor stay drawn. An answer whose first
 * three fields do not read as whole numbers, or whose row is outside the pane, leaves the capture
 * as it is; the fields after them are not read.
 */
export function screenAt(capture: string, answer: string): string {
    const [column, row, height] = fieldsOf(answer).slice(0, 3);
    if (![column, row, height].every(isWhole)) return capture;
    if (Number(row) >= Number(height)) return capture;
    const lines = capture.endsWith('\n') ? capture.slice(0, -1) : capture;
    return `${lines}\u001b[${Number(row) + 1};${Number(column) + 1}H`;
}

/** What an answer of cursorArgs says of a pane's program in its alternate screen. */
export type AlternateScreen = {
    /** How many rows the pane has, which is how many lines its saved normal screen holds. */
    height: number;
    /** How many lines of history the pane holds above the shell's screen. */
    history: number;
    /** Where the shell's cursor was when the program entered, null when tmux has none saved. */
    saved: { column: number; row: number } | null;
};

/**
 * Whether the pane's program is in its alternate screen, read from an answer of cursorArgs: null
 * when `#{alternate_on}` is not `1`, and when the height, the lines of history or the saved cursor
 * do not read as whole numbers, so the pane is then given as it stands in its normal screen.
 */
export function alternateAt(answer: string): AlternateScreen | null {
    const fields = fieldsOf(answer);
    const [on, column, row, history] = fields.slice(3, FIELDS_BEFORE_FLAGS);
    if (on !== '1' || ![fields[2], column, row, history].every(isWhole)) return null;
    const none = Number(column) === NO_SAVED_CURSOR || Number(row) === NO_SAVED_CURSOR;
    return {
        height: Number(fields[2]),
        history: Number(history),
        saved: none ? null : { column: Number(column), row: Number(row) }
    };
}

/** Whether the answer of `alternateOnArgs` says the program is in its alternate screen. */
export function inAlternateScreen(answer: string): boolean {
    return answer.trim() === '1';
}

/**
 * Whether a capture made with `savedScreenArgs` is the normal screen the program saved. tmux
 * answers one blank line once the program has left, and a saved screen holds a line for each row of
 * the pane, blank rows included, so a capture of fewer lines than the pane has rows is the answer
 * of a program that has left.
 */
export function holdsSavedScreen(saved: string, state: AlternateScreen): boolean {
    const lines = saved.split('\n').length - (saved.endsWith('\n') ? 1 : 0);
    return lines >= state.height;
}

/** The three captures of a pane in its alternate screen, as tmux printed them. */
export type AlternateCaptures = { history: string; saved: string; alternate: string };

/**
 * The screen an attaching page is given for a pane whose program is in its alternate screen. A
 * grid just reset writes the shell's history and normal screen into its normal buffer, with the
 * cursor put where the shell left it; the switch to the alternate buffer then saves that cursor
 * and clears the buffer the program's screen is written into, and the program's own switch back
 * restores both, so leaving the program shows the shell's text again. The switch leaves the cursor
 * where the shell had it, so a move to the top left comes before the program's screen, which
 * otherwise starts at the shell's column and wraps a full top row. The modes go last, as in
 * every screen.
 */
export function alternateScreenAt(
    state: AlternateScreen,
    captures: AlternateCaptures,
    answer: string
): string {
    const normal = captures.history + captures.saved;
    let shell = normal.endsWith('\n') ? normal.slice(0, -1) : normal;
    shell = shell.replace(/\r?\n/g, '\r\n');
    if (state.saved !== null) shell += `\u001b[${state.saved.row + 1};${state.saved.column + 1}H`;
    const program = screenAt(captures.alternate, answer).replace(/\r?\n/g, '\r\n');
    return `${shell}\u001b[?1049h\u001b[H${program}${modesAt(answer)}`;
}
