// Layer 2, server. The programs the host started for the app (a language server or a debug
// adapter given as an executable). The runner ends them with SIGKILL when it exits for any reason,
// so a host that stops, fails or is told to stop leaves none of them running. The tools make one
// of these at their start and hand it to every part that starts a program.

/**
 * The programs one host started and have not exited.
 * @returns {{ track: (child: import('node:child_process').ChildProcess) => void }}
 */
export function createChildren() {
    const held = new Set();
    let hooked = false;
    return {
        /** Hold a started program until it exits. */
        track(child) {
            held.add(child);
            child.once('exit', () => held.delete(child));
            if (hooked) return;
            hooked = true;
            process.once('exit', () => {
                for (const one of held) {
                    try {
                        one.kill('SIGKILL');
                    } catch {
                        // The program is already gone.
                    }
                }
            });
        }
    };
}
