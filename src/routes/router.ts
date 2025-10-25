import express from 'express';
import diagnosticRoutes from './diagnostics.routes.js';
const router = express.Router();

router.use('/diagnostics', diagnosticRoutes);

export default router;
