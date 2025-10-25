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

export default router;
