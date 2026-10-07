// Layer 2, client state. The sentences the catalog holds for the words POST /api/terminal refuses
// with (data/model/model-processes.ts TERMINAL_REFUSALS). The server answers a word and the names
// its sentence is about, so no text of tmux, of a validator or of the server's English reaches the
// reader; answers.ts says these after the file and LaTeX words.

import { TERMINAL_REFUSALS, type TerminalRefusal } from '../../../data/model/index.ts';
import { t as catalogText } from '../words/text.ts';

/** The terminal refusal word a value is, or null for any other value. */
export function terminalWord(value: unknown): TerminalRefusal | null {
    return TERMINAL_REFUSALS.find((one) => one === value) ?? null;
}

/** The sentence for one terminal refusal word, with the names the server sent for it. */
export function terminalSentence(word: TerminalRefusal, names: readonly string[] = []): string {
    const [first = '', second = '', third = ''] = names;
    switch (word) {
        case 'not-ours':
            return catalogText('sessions.refused_not_ours');
        case 'not-a-session':
            return catalogText('sessions.refused_not_a_session');
        case 'session-unknown':
            return catalogText('sessions.resume_unknown');
        case 'session-live':
            return catalogText('sessions.resume_live');
        case 'bad-terminal':
            return catalogText('sessions.refused_bad_terminal');
        case 'terminal-ended':
            return catalogText('sessions.refused_terminal_ended');
        case 'terminal-failed':
            return catalogText('sessions.refused_terminal_failed');
        case 'terminal-not-started':
            return catalogText('sessions.refused_terminal_not_started');
        case 'not-a-task':
            return catalogText('sessions.refused_not_a_task');
        case 'still-running':
            return catalogText('sessions.refused_still_running');
        case 'bad-repo':
            return catalogText('sessions.refused_bad_repo');
        case 'command-unknown':
            return catalogText('sessions.refused_command_unknown', first);
        case 'dependency-unknown':
            return catalogText('sessions.refused_dependency_unknown', first, second);
        case 'dependency-self':
            return catalogText('sessions.refused_dependency_self', first);
        case 'dependency-cycle':
            return catalogText('sessions.refused_dependency_cycle', first);
        case 'no-file':
            return catalogText('sessions.refused_no_file', first);
        case 'no-selection':
            return catalogText('sessions.refused_no_selection', first);
        case 'nul-value':
            return catalogText('sessions.refused_nul_value', first);
        case 'task-unknown':
            return catalogText('sessions.refused_task_unknown');
        case 'task-changed':
            return catalogText('sessions.refused_task_changed');
        case 'task-too-long':
            return catalogText('sessions.refused_task_too_long');
        case 'task-needs-agent':
            return catalogText('sessions.refused_task_needs_agent');
        case 'needs-confirm':
            return catalogText('sessions.refused_needs_confirm', first);
        case 'approvals-unwritable':
            return catalogText('sessions.refused_approvals_unwritable', first);
        case 'latex-program':
            return second === 'texlive'
                ? catalogText('latex.refused_program_texlive', first, third)
                : second === 'brew'
                  ? catalogText('latex.refused_program_brew', first, third)
                  : catalogText('latex.refused_program', first);
        case 'latex-recipe':
            return catalogText('latex.refused_recipe', first);
        case 'latex-no-recipe':
            return catalogText('latex.refused_no_recipe');
        case 'latex-folder':
            return catalogText('latex.refused_folder', first);
        case 'latex-building':
            return catalogText('latex.refused_building', first);
        case 'latex-idle':
            return catalogText('latex.refused_idle', first);
    }
}
