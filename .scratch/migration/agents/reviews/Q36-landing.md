## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
Nothing is waiting on a ruling.

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

## Result

DONE: Q36 makes the SSH kill-grace proof measure the loaded machine, rejects measurements too wide to prove the grace, retries spoiled measurements, and clears the probe pid file before every measurement. The landing closes the review's stale-pid finding.

## Verification

- `npx vitest run tests/server/hpc/ssh.test.ts --reporter=dot`: 1 file and 13 tests passed.
- `npx vitest run --reporter=dot --maxWorkers=1`: 259 files and 4,377 tests passed.
- `node bin/revert-check.mjs tests/server/hpc/ssh.test.ts`: 10 red, 0 unproven, and 3 unchanged cases unchecked.
- `npm run check`: 0 errors and 0 warnings.
- `npm run build`, `npm run format:check`, `npm run lint`, and `bash bin/size-check.sh`: passed.
- `LC_ALL=C grep -rna '[^ -~]' src tests`: no output.

## Look

Q36 changes only the SSH server test, so the configured TEST-page look does not apply.

## Next

Q53 and Q56 remain in flight. No later step is dispatched. The plan pauses after they land.
