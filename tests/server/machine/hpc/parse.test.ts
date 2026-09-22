// Pure Live HPC parser coverage: each remote format, the batched section split, and empty optional sections.
import { describe, expect, it } from 'vitest';
import {
    parseQuota,
    parseSacct,
    parseSinfo,
    parseSqueue,
    SEC_RC,
    SEC_SACCT,
    SEC_SINFO,
    splitSections
} from '../../../../src/lib/server/machine/hpc/parse.ts';

describe('HPC parsers', () => {
    it('parses all thirteen squeue fields', () =>
        expect(
            parseSqueue(
                '42|train|gpu|RUNNING|01:00|02:00|1|8|gres/gpu:a100:2|64G|900|2026-09-11T12:30:00|node1'
            )[0]
        ).toMatchObject({ id: '42', gpus: '2', reason: 'node1' }));
    it('folds sacct step memory and CPU into a finished job', () =>
        expect(
            parseSacct(
                '42|train|COMPLETED|0:0|00:10|2026-09-11T12:00:00|2Gc|||2|1|10\n42.batch|batch|COMPLETED|0:0|00:10|2026-09-11T12:00:00||1G|00:20|2|1|10'
            )[0]
        ).toMatchObject({ memPct: 25, cpuPct: 100 }));
    it('parses sinfo rows', () =>
        expect(parseSinfo('gpu*|up|2|idle|gpu:a100:4')[0]).toEqual({
            partition: 'gpu',
            avail: 'up',
            nodes: 2,
            state: 'idle',
            gres: 'gpu:a100:4'
        }));
    it('prefers quota data and parses df as fallback', () => {
        expect(parseQuota('/home/user 10G 20G 40G')[0].pct).toBe(25);
        expect(parseQuota('/dev/x 100G 20G 80G 20% /home')[0].name).toBe('home');
    });
    it('splits a batch and permits failed sacct or sinfo sections to be empty', () => {
        const found = splitSections(`queue\n${SEC_RC}0@@\n${SEC_SACCT}\n${SEC_SINFO}`);
        expect(found).toEqual({ squeue: 'queue', sacct: '', sinfo: '', squeueCode: 0 });
    });
});
