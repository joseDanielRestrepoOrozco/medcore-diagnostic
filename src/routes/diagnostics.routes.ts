import express from 'express';
import diagnosticsController from '../controllers/diagnostics.controller.js';
import { diagnosticUpload } from '../middlewares/diagnosticUpload.middleware.js';
import { requireRoles } from '../middlewares/auth.js';
const router = express.Router();

router.post(
  '/:patientId',
  requireRoles(['MEDICO']),
  diagnosticUpload.multiple,
  diagnosticsController.createDiagnostic
);

// Permitir POST /api/v1/diagnostics con patientId en body (compat alias)
router.post(
  '/',
  requireRoles(['MEDICO']),
  (req, _res, next) => { if (!req.params) (req as any).params = {}; (req as any).params.patientId = String((req.body || {}).patientId || ''); next(); },
  diagnosticUpload.multiple,
  diagnosticsController.createDiagnostic
);

router.get(
  '/documents/patient/:patientId',
  requireRoles(['MEDICO', 'ADMINISTRADOR', 'ENFERMERA']),
  diagnosticsController.getPatientDocuments
);

router.get(
  '/documents/:id',
  requireRoles(['MEDICO', 'ADMINISTRADOR', 'ENFERMERA']),
  diagnosticsController.downloadDocumentById
);

router.delete(
  '/documents/:id',
  requireRoles(['MEDICO', 'ADMINISTRADOR']),
  diagnosticsController.deleteDocumentById
);

// GET /api/v1/diagnostics/search?patientId=&diagnostic=&dateFrom=&dateTo=
router.get('/search', requireRoles(['MEDICO','ADMINISTRADOR','ENFERMERA']), diagnosticsController.search);

export default router;
