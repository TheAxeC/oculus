# D20, the cases ruling (round 0)

The builder's first run found one case the brief's rules get wrong and five points that need a ruling. Each ruling stays inside the step's scope.

1. Case 62 is replaced by two rows, one on each side of the cut. (a) A title whose 73rd and 74th UTF-16 code units are one emoji puts the pair at the name's 79th and 80th units after "Task: ": the name is 80 code units and ends with the whole pair. (b) A title whose 74th and 75th units are one emoji puts the pair at the name's 80th and 81st units: the cut falls before the pair, and the name is 79 code units and holds no lone surrogate. Item 1.3's rule is unchanged.
2. The verify list runs from `tools/oculus` with the state file path `.scratch/migration/orchestrator-state.md`, as the brief's Verify section says: `sh ~/.claude-work/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`. The report quotes the lines it prints from there.
3. Item 7.1's classifier tests the codes first, in this order: `cancelled`, `timed-out`, `too-much-output`, `signal`; git's own text is read only when none of them applies, and a timed-out command's partial stderr is never shown as the reason. Case 47's rows and case 57's switch and worktree rows are judged by that order.
4. Item 1.1 reads the subtask's `do` from a new field on `TickerItem`, set where `subtaskLines` builds the line (`src/lib/state/boards/ticker.ts`). `tools/oculus/src/lib/state/boards/ticker.ts` joins "Paths this step writes"; splitting the label on ": " is not used, since a parent's name may hold a colon.
5. Case 36 uses the two fixtures the first run built (A: 10 turns with a tool turn first and last and three or more line feeds inside one assistant turn; B: 4 turns ending in a said turn with trailing spaces and line feeds), each compared with `cmp` against its reference.
6. Case 57's pull row uses a post-merge hook that sleeps past 60 s, so the row fails without the fix; the other rows stand as the first run gives them.
7. Case 26 says the words oculus's own check answers for a taken folder ("there is already something at <path>"); a folder git refuses for another reason is said in git's words.
