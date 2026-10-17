// Layer 2, server. What a page that attaches to a terminal pane is given as the pane stands: the
// tmux calls that read the pane's text and the answer of one `display-message` that holds its
// cursor, its height, its alternate screen and its modes, and the readers that turn those into the
// bytes the page writes into its grid. The builders take the tmux session's name and read no state,
// so `sessions.ts`, which names sessions and starts them, and `channel.ts`, which sends the screen,
// both import this file and it imports neither. `paneScreen` makes the reads through the function
// its caller passes, which is how the channels read a pane through its own control client.
//
// A pane is given in one of two shapes. In its normal screen it is the whole capture followed by a
// move to tmux's cursor and the modes the program set (`screenAt`, `modesAt`). With a program in
// its alternate screen it is the shell's text in the grid's normal buffer and the program's screen
// in the grid's alternate buffer (`alternateScreenAt`), so the program draws full screen and
// leaving it shows the shell's text again. `cursorArgs` asks every field either shape needs in one
// call, and each reader takes its fields by position.

/**
 * The arguments that capture what the pane already shows, escape sequences and all, a line the pane
 * wrapped joined again (`-J`). Written into the page's grid at the pane's width, a joined line
 * wraps onto the rows tmux wraps it onto and is marked as wrapped there, so a later resize reflows
 * it in the grid as tmux reflows it in the pane. Sent as the rows tmux drew, a wrapped line would
 * be two lines in the grid, which a narrower grid wraps again, and a shell's redraw of its prompt
 * on the resize, which moves up by the rows the prompt takes at the new width, would start below
 * the prompt's first row and leave that row drawn twice.
 */
export function captureArgs(session: string, lines: number): string[] {
    return ['capture-pane', '-p', '-e', '-J', '-S', `-${lines}`, '-t', session];
}

/**
 * The arguments that capture the history of a pane in its alternate screen, the lines above the
 * screen the shell left, a wrapped line joined as `captureArgs` joins it. With no history tmux
 * answers this range with the screen's top row, so it is asked only when `#{history_size}` is
 * above 0.
 */
function historyArgs(session: string, lines: number): string[] {
    return ['capture-pane', '-p', '-e', '-J', '-S', `-${lines}`, '-E', '-1', '-t', session];
}

/**
 * The arguments that capture the normal screen a pane's program left when it entered the alternate
 * screen. Once the program has left, tmux answers one blank line (see `holdsSavedScreen`), which
 * counts the capture's lines against the pane's rows, so its wrapped lines are not joined.
 */
function savedScreenArgs(session: string): string[] {
    return ['capture-pane', '-p', '-e', '-q', '-a', '-t', session];
}

/** The arguments that capture the screen of a pane as it stands, here the alternate screen. */
function alternateScreenArgs(session: string): string[] {
    return ['capture-pane', '-p', '-e', '-t', session];
}

/** The arguments that read whether the pane's program is in its alternate screen. */
function alternateOnArgs(session: string): string[] {
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
function cursorArgs(session: string): string[] {
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
function modesAt(answer: string): string {
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
function screenAt(capture: string, answer: string): string {
    const [column, row, height] = fieldsOf(answer).slice(0, 3);
    if (![column, row, height].every(isWhole)) return capture;
    if (Number(row) >= Number(height)) return capture;
    const lines = capture.endsWith('\n') ? capture.slice(0, -1) : capture;
    return `${lines}\u001b[${Number(row) + 1};${Number(column) + 1}H`;
}

/** What an answer of cursorArgs says of a pane's program in its alternate screen. */
type AlternateScreen = {
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
function alternateAt(answer: string): AlternateScreen | null {
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
function inAlternateScreen(answer: string): boolean {
    return answer.trim() === '1';
}

/**
 * Whether a capture made with `savedScreenArgs` is the normal screen the program saved. tmux
 * answers one blank line once the program has left, and a saved screen holds a line for each row of
 * the pane, blank rows included, so a capture of fewer lines than the pane has rows is the answer
 * of a program that has left.
 */
function holdsSavedScreen(saved: string, state: AlternateScreen): boolean {
    const lines = saved.split('\n').length - (saved.endsWith('\n') ? 1 : 0);
    return lines >= state.height;
}

/** The three captures of a pane in its alternate screen, as tmux printed them. */
type AlternateCaptures = { history: string; saved: string; alternate: string };

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
function alternateScreenAt(
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

/** What reading the alternate screen gives when the program left while it was read. */
const LEFT = 'left';

/** One tmux read of the pane, its argument list built by the functions above. */
type Read = (args: string[]) => Promise<string>;

/**
 * The screen a page's grid is written for a pane, read through `read`. A pane whose program is in
 * its alternate screen is sent as the shell's text in the grid's normal buffer and the program's
 * screen in its alternate buffer (alternateScreenAt). Every other pane is sent as the whole
 * capture; so is a pane whose reads for the alternate screen failed, and a pane whose program left
 * while they ran is read again and sent as it stands. capture-pane writes one line per row with a
 * bare newline between them; a terminal moves down without returning to the left on a bare
 * newline, so the rows would step across the grid (seen in Chrome as a staircase), and every line
 * break goes out as CR LF. The modes go after the screen, since the page resets its grid before
 * writing it.
 */
export async function paneScreen(session: string, lines: number, read: Read): Promise<string> {
    let { text, cursor } = await readPane(session, lines, read);
    let alternate = alternateAt(cursor);
    let captured: AlternateCaptures | null = null;
    if (alternate !== null) {
        const captures = await alternateCaptures(session, lines, alternate, read);
        if (captures === LEFT) {
            ({ text, cursor } = await readPane(session, lines, read));
            alternate = null;
        } else captured = captures;
    }
    const placed = screenAt(text, cursor);
    if (placed === text && cursor !== '') {
        console.error(`pty: the cursor of ${session} did not read, the whole capture is sent`);
    }
    return alternate !== null && captured !== null
        ? alternateScreenAt(alternate, captured, cursor)
        : placed.replace(/\r?\n/g, '\r\n') + modesAt(cursor);
}

/**
 * What the pane shows now and where tmux has its cursor and modes. Both reads are asked at once,
 * the cursor after the capture, so a control client hands them to tmux together and tmux runs them
 * with no output between (tmux.ts, `control`); read one tmux process each, output that lands
 * between the two moves the cursor down over rows the capture already holds rather than past rows
 * it lacks. A read that fails gives an empty text or cursor, which sends the capture as it is.
 */
async function readPane(
    session: string,
    lines: number,
    read: Read
): Promise<{ text: string; cursor: string }> {
    const [text, cursor] = await Promise.all([
        read(captureArgs(session, lines)).catch((error: unknown) => {
            console.error(`pty: no scrollback for ${session}: ${reason(error)}`);
            return '';
        }),
        read(cursorArgs(session)).catch((error: unknown) => {
            console.error(
                `pty: no cursor for ${session}, the whole capture is sent: ${reason(error)}`
            );
            return '';
        })
    ]);
    return { text, cursor };
}

/**
 * The history, the saved normal screen and the screen of a pane whose program is in its alternate
 * screen, asked at once after the `display-message` answer that says the program is in it. The
 * history is read only when the pane holds some, since with none tmux answers that range with the
 * screen's top row. `LEFT` when the program left while these were read: the saved normal screen is
 * then a single blank line (holdsSavedScreen), or `#{alternate_on}` read after the screen is no
 * longer 1. Null when a read fails.
 */
async function alternateCaptures(
    session: string,
    lines: number,
    state: AlternateScreen,
    read: Read
): Promise<AlternateCaptures | typeof LEFT | null> {
    try {
        const [history, saved, alternate, on] = await Promise.all([
            state.history > 0 ? read(historyArgs(session, lines)) : Promise.resolve(''),
            read(savedScreenArgs(session)),
            read(alternateScreenArgs(session)),
            read(alternateOnArgs(session))
        ]);
        if (!holdsSavedScreen(saved, state) || !inAlternateScreen(on)) return LEFT;
        return { history, saved, alternate };
    } catch (error) {
        console.error(
            `pty: no alternate screen for ${session}, the whole capture is sent: ${reason(error)}`
        );
        return null;
    }
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
