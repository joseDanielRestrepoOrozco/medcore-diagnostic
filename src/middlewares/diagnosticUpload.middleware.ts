import multer from 'multer';
import path from 'path';
import {
  createUploader,
  createFileFilter,
  ensureDirectoryExists,
} from '../config/baseMulter.js';
import { type Request } from 'express';

const UPLOAD_PATH = path.join('uploads', 'patient', 'diagnostics');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDirectoryExists(UPLOAD_PATH);
    cb(null, UPLOAD_PATH);
  },
  filename: (req: Request, file, cb) => {
    const patientId = req.params.patientId || 'unknown';
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `diagnostic-${patientId}-${timestamp}-${randomString}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = createFileFilter({
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  errorMessage: 'Solo se permiten archivos PDF, JPG o PNG',
});

const uploader = createUploader({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter,
});

export const diagnosticUpload = {
  single: uploader.single('document'),
  multiple: uploader.array('documents', MAX_FILES),
};
