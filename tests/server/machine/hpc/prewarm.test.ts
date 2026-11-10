// Live HPC prewarm tests: the batched listing reads the folders of `slurm.log_dirs` in their order,
// and a job's path is picked rung by rung as the on-demand search would pick it.
import { describe, expect, it } from 'vitest';
import { logRungs } from '../../../../src/lib/server/machine/hpc/actions.ts';
import {
    listingCommand,
    parseListing,
    pickFromListing
} from '../../../../src/lib/server/machine/hpc/prewarm.ts';

describe('HPC log prewarm', () => {
    it('lists the folders of slurm.log_dirs in their order and picks by the first that holds the job (G13)', () => {
        const rungs = logRungs(['runs', '.']);
        const command = listingCommand(['/w'], rungs);
        const runs = command.indexOf('/runs/*');
        const own = command.indexOf('/slurm-*.out');
        expect(runs).toBeGreaterThan(-1);
        expect(own).toBeGreaterThan(runs);
        expect(command.indexOf('/*.out')).toBeGreaterThan(own);
        const listed = parseListing(
            [
                '@@oculus:wd=/w@@',
                '@@oculus:rung@@',
                '/w/runs/train-7.log',
                '@@oculus:rung@@',
                '/w/slurm-7.out',
                '/w/slurm-8.out',
                '@@oculus:rung@@',
                '/w/slurm-7.out',
                '/w/slurm-8.out'
            ].join('\n')
        ).get('/w');
        expect(listed).toBeDefined();
        expect(pickFromListing('7', listed ?? [], rungs)).toBe('/w/runs/train-7.log');
        expect(pickFromListing('8', listed ?? [], rungs)).toBe('/w/slurm-8.out');
        expect(pickFromListing('8', listed ?? [], logRungs(['runs']))).toBe('');
    });
});
