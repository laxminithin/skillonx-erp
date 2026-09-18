import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export function defaultQpRoot() {
    return path.resolve(__dirname, '../../../../../apps/web/public/Previous Years QPs');
}
export function defaultMasterPath() {
    return path.resolve(__dirname, '../../../../../apps/web/public/Previous_Year_Question_Paper_Master.xlsx');
}
const OFFICE = new Set(['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.tif', '.tiff']);
export async function discoverSourceFiles(root = defaultQpRoot()) {
    const out = [];
    async function walk(dir, folder) {
        let entries = [];
        try {
            entries = await readdir(dir);
        }
        catch {
            return;
        }
        for (const name of entries) {
            if (name.startsWith('.'))
                continue;
            const full = path.join(dir, name);
            const info = await stat(full);
            if (info.isDirectory()) {
                await walk(full, name);
                continue;
            }
            const ext = path.extname(name).toLowerCase();
            if (!OFFICE.has(ext))
                continue;
            const relativePath = path.relative(path.dirname(root), full).replaceAll('\\', '/');
            out.push({
                relativePath: relativePath.startsWith('Previous Years QPs')
                    ? relativePath
                    : `Previous Years QPs/${path.relative(root, full).replaceAll('\\', '/')}`,
                fileName: name,
                folder: folder || path.basename(path.dirname(full)),
                programHint: folder || null,
                sourceType: ext.replace('.', '').toUpperCase(),
                byteSize: info.size,
                pageCount: null,
                extractionStatus: ext === '.pdf' ? 'EXTRACTED' : 'NEEDS_REVIEW',
                paperCount: 0,
                ocrRequired: false,
                notes: ext === '.pdf' ? null : 'Non-PDF source; preview/download only until a dedicated parser exists',
            });
        }
    }
    await walk(root, path.basename(root));
    out.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return out;
}
export function publicUrlForSource(relativePath) {
    return `/${relativePath
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')}`;
}
