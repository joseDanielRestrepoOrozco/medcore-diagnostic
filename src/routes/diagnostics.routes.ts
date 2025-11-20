import express from 'express';
import diagnosticsController from '../controllers/diagnostics.controller.js';
import { diagnosticUpload } from '../middlewares/diagnosticUpload.middleware.js';
import { requireRoles, authenticateUser } from '../middlewares/auth.js';
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
  diagnosticUpload.multiple,
  (req, _res, next) => { if (!(req as any).params) (req as any).params = {}; (req as any).params.patientId = String(((req as any).body || {}).patientId || ''); next(); },
  diagnosticsController.createDiagnostic
);

router.get(
  '/my-medical-history',
  authenticateUser,
  diagnosticsController.getMyMedicalHistory
);

router.get(
  '/documents/patient/:patientId',
  requireRoles(['MEDICO', 'ADMINISTRADOR', 'ENFERMERA']),
  diagnosticsController.getPatientDocuments
);

router.get(
  '/:id',
  requireRoles(['MEDICO', 'ADMINISTRADOR', 'ENFERMERA']),
  diagnosticsController.getDiagnosticById
);

router.put(
  '/:id',
  requireRoles(['MEDICO', 'ADMINISTRADOR']),
  diagnosticsController.updateDiagnostic
);

router.post(
  '/:id/documents',
  requireRoles(['MEDICO', 'ADMINISTRADOR']),
  diagnosticUpload.multiple,
  diagnosticsController.addDocumentsToDiagnostic
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
