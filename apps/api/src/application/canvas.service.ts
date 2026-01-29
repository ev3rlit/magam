import { Injectable } from '@nestjs/common';
import { FileRepository } from '../infra/file.repository';
import { Canvas } from '../domain/canvas.entity';

@Injectable()
export class CanvasService {
    constructor(private readonly fileRepo: FileRepository) { }

    async getCanvas(id: string): Promise<Canvas> {
        const data = await this.fileRepo.loadCanvas(id);
        if (!data) return new Canvas(id);
        // Explicitly reconstruct the Canvas object to ensure methods are available
        return new Canvas(id, data.nodes, data.edges);
    }

    async saveCanvas(canvas: Canvas): Promise<void> {
        await this.fileRepo.saveCanvas(canvas.id, canvas);
    }
}
