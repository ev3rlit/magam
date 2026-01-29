import { FileRepository } from './file.repository';
import * as fs from 'fs/promises';

describe('FileRepository', () => {
    const repo = new FileRepository();

    it('should save and load a canvas', async () => {
        const data = { id: 'test', nodes: [], edges: [] };
        await repo.saveCanvas('test', data);
        const result = await repo.loadCanvas('test');
        expect(result).toEqual(data);
        await fs.rm('./canvases', { recursive: true, force: true });
    });
});
