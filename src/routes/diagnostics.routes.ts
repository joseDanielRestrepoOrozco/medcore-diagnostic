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

export default router;
