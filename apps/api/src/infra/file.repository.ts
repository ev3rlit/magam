import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileRepository {
    private storagePath = './canvases';

    private getFilePath(id: string) {
        return path.join(this.storagePath, `${id}.json`);
    }

    async saveCanvas(id: string, data: any): Promise<void> {
        await fs.mkdir(this.storagePath, { recursive: true });
        await fs.writeFile(this.getFilePath(id), JSON.stringify(data, null, 2));
    }

    async loadCanvas(id: string): Promise<any> {
        try {
            const data = await fs.readFile(this.getFilePath(id), 'utf-8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
}
