// Pure Live HPC client state coverage checks walltime, tones, start labels, and the three partition segments.
import { describe, expect, it } from 'vitest';
import {
    efficiencyTone,
    partitionMeters,
    startLabel,
    stateTone,
    walltimeFraction
} from '../../src/lib/state/hpc.ts';
describe('HPC state', () => {
    it('derives queue presentation', () => {
        const job = {
            id: '1',
            name: 'x',
            partition: 'p',
            state: 'RUNNING',
            time: '01:00',
            limit: '02:00',
            nodes: '1',
            cpus: '1',
            gpus: '',
            mem: '',
            priority: '',
            start: '2026-09-11T12:30:00',
            reason: ''
        };
        expect(walltimeFraction(job)).toBe(0.5);
        expect(stateTone('PENDING')).toBe('amber');
        expect(efficiencyTone(10)).toBe('red');
        expect(startLabel(job.start)).toBe('09-11 12:30');
    });
    it('aggregates idle, mixed, and allocated partition rows', () =>
        expect(
            partitionMeters([
                { partition: 'gpu', avail: 'up', nodes: 2, state: 'idle', gres: 'gpu:a100' },
                { partition: 'gpu', avail: 'up', nodes: 1, state: 'mix', gres: '' },
                { partition: 'gpu', avail: 'up', nodes: 3, state: 'alloc', gres: '' }
            ])[0]
        ).toMatchObject({ idle: 2, mixed: 1, allocated: 3, total: 6, gpu: true }));
});
