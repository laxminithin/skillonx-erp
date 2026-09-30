import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import * as svc from './service.js';
export const documentEngineRouter = Router();
documentEngineRouter.use(requireAuth);
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    };
}
documentEngineRouter.get('/', asyncHandler(async (req, res) => {
    const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : '';
    const entityId = Number(req.query.entityId);
    if (!entityType || !Number.isFinite(entityId)) {
        res.status(400).json({ error: 'entityType and entityId are required' });
        return;
    }
    res.json(await svc.listDocumentsForEntity(actor(req), entityType, entityId));
}));
documentEngineRouter.post('/', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.uploadDocument(actor(req), validate(svc.uploadSchema, req.body)));
}));
documentEngineRouter.get('/:id', asyncHandler(async (req, res) => {
    res.json(await svc.getDocumentMetadata(actor(req), Number(req.params.id)));
}));
documentEngineRouter.get('/:id/content', asyncHandler(async (req, res) => {
    const { metadata, buffer } = await svc.downloadDocument(actor(req), Number(req.params.id));
    res.setHeader('Content-Type', String(metadata.mimeType));
    res.setHeader('Content-Length', String(buffer.length));
    res.send(buffer);
}));
documentEngineRouter.post('/:id/versions', asyncHandler(async (req, res) => {
    res.status(201).json(await svc.uploadNewVersion(actor(req), Number(req.params.id), validate(svc.uploadSchema, req.body)));
}));
documentEngineRouter.post('/:id/archive', asyncHandler(async (req, res) => {
    res.json(await svc.archiveDocument(actor(req), Number(req.params.id)));
}));
