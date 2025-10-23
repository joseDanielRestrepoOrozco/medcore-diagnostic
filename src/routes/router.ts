import express from 'express';
import diagnosticRoutes from './diagnostics.routes.js';
import documentsRoutes from './documents.routes.js';
const router = express.Router();

router.use('/diagnostics', diagnosticRoutes);
router.use('/documents', documentsRoutes);

export default router;
