import express from 'express';
import diagnosticsController from '../controllers/diagnostics.controller.js';
import { diagnosticUpload } from '../middlewares/diagnosticUpload.middleware.js';
import { requireRoles } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/v1/documents/upload → reutiliza creación de diagnóstico con documentos
// Requiere patientId para asociar documento
router.post(
  '/upload/:patientId',
  requireRoles(['MEDICO','ADMINISTRADOR']),
  diagnosticUpload.multiple,
  diagnosticsController.uploadDocuments
);

// Alias: POST /api/v1/documents/upload con patientId en el body
router.post(
  '/upload',
  requireRoles(['MEDICO','ADMINISTRADOR']),
  diagnosticUpload.multiple,
  (req, _res, next) => { if (!(req as any).params) (req as any).params = {}; (req as any).params.patientId = String((req.body || {}).patientId || ''); next(); },
  diagnosticsController.uploadDocuments
);

// GET /api/v1/documents/patient/:patientId → documentos por paciente
router.get(
  '/patient/:patientId',
  requireRoles(['MEDICO','ADMINISTRADOR','ENFERMERA']),
  diagnosticsController.getPatientDocuments
);

// GET /api/v1/documents/:id → descarga documento
router.get('/:id', requireRoles(['MEDICO','ADMINISTRADOR','ENFERMERA']), diagnosticsController.downloadDocumentById);

// DELETE /api/v1/documents/:id → elimina documento
router.delete('/:id', requireRoles(['MEDICO','ADMINISTRADOR']), diagnosticsController.deleteDocumentById);

export default router;
