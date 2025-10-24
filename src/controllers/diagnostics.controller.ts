import { type Request, type Response } from 'express';
import { DiagnosticData } from '../schemas/DiagnosticData.js';
import diagnosticService from '../services/diagnostic.service.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { verifyPatientExists } from '../services/patient.service.js';

const createDiagnostic = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const patientId = (req.params as Record<string, string | undefined>).patientId || (req.body as Record<string, unknown> | undefined)?.patientId?.toString();
    const user = req.user;
    const authHeader = req.headers.authorization;

    if (!patientId) {
      res.status(400).json({
        error: 'ID de paciente requerido',
        message: 'Debe proporcionar un ID de paciente válido',
      });
      return;
    }

    // Verificar que el paciente exista en el servicio de patients
    const patientVerification = await verifyPatientExists(
      patientId,
      authHeader!
    );

    if (!patientVerification.success) {
      res.status(patientVerification.error!.status).json({
        error:
          patientVerification.error!.status === 404
            ? 'Paciente no encontrado'
            : 'Error al verificar paciente',
        message: patientVerification.error!.message,
      });
      return;
    }

    // Validar que el paciente esté activo
    if (patientVerification.patient!.state !== 'ACTIVE') {
      res.status(400).json({
        error: 'Paciente inactivo',
        message: 'No se puede crear un diagnóstico para un paciente inactivo',
      });
      return;
    }

    const diagnosticData = DiagnosticData.parse(req.body);

    const diagnostic = await diagnosticService.createDiagnostic(
      String(patientId),
      user!.id,
      diagnosticData,
      files
    );

    res.status(201).json({
      message: 'Diagnóstico creado exitosamente',
      data: diagnostic,
    });
    return;
  } catch (error) {
    console.error('Error creando diagnóstico:', error);
    if (error instanceof Error) {
      res
        .status(400)
        .json({ message: error.message || 'Error al crear diagnostico' });
    }
  }
};

const getPatientDocuments = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({
        error: 'ID de paciente requerido',
        message: 'Debe proporcionar un ID de paciente válido',
      });
      return;
    }

    const documents = await diagnosticService.getDiagnosticsByPatientId(
      patientId
    );

    res.status(200).json({
      message: 'Documentos del paciente obtenidos exitosamente',
      data: documents,
    });
  } catch (error) {
    console.error('Error obteniendo documentos del paciente:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener documentos del paciente' });
  }
};

const downloadDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'ID de documento requerido',
        message: 'Debe proporcionar un ID de documento válido',
      });
      return;
    }

    const document = await diagnosticService.getFileById(id);

    if (!document) {
      res.status(404).json({
        error: 'Documento no encontrado',
        message: 'No se encontró un documento con el ID proporcionado',
      });
      return;
    }

    res.download(document.filePath, document.filename);
  } catch (error) {
    console.error('Error descargando documento:', error);
    res.status(500).json({ message: 'Error al descargar documento' });
  }
};

const deleteDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'ID de documento requerido',
        message: 'Debe proporcionar un ID de documento válido',
      });
      return;
    }

    await diagnosticService.deleteDocumentById(id);

    res.status(200).json({
      message: 'Documento eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ message: 'Error al eliminar documento' });
  }
};

// Subida de documentos (permite enviar solo archivos + patientId, con campos opcionales)
const uploadDocuments = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const patientId = (req.params as Record<string, string | undefined>).patientId || (req.body as Record<string, unknown> | undefined)?.patientId?.toString();
    const user = req.user;
    const authHeader = req.headers.authorization;

    if (!patientId) {
      res.status(400).json({ error: 'ID de paciente requerido', message: 'Debe proporcionar un ID de paciente válido' });
      return;
    }
    // Verificar paciente activo
    const patientVerification = await verifyPatientExists(String(patientId), authHeader!);
    if (!patientVerification.success) {
      res.status(patientVerification.error!.status).json({ error: patientVerification.error!.status === 404 ? 'Paciente no encontrado' : 'Error al verificar paciente', message: patientVerification.error!.message });
      return;
    }
    if (patientVerification.patient!.state !== 'ACTIVE') {
      res.status(400).json({ error: 'Paciente inactivo', message: 'No se puede crear un diagnóstico para un paciente inactivo' });
      return;
    }
    const body = (req.body || {}) as Record<string, string>;
    const diagnosticData = DiagnosticData.parse({
      title: body.title || 'Adjunto',
      description: body.description || '',
      symptoms: body.symptoms || '',
      diagnosis: body.diagnosis || '',
      treatment: body.treatment || '',
      observations: body.observations,
      nextAppointment: body.nextAppointment ? new Date(body.nextAppointment) : undefined,
    });
    const diagnostic = await diagnosticService.createDiagnostic(String(patientId), user!.id, diagnosticData, files);
    res.status(201).json({ message: 'Documentos subidos', data: diagnostic });
  } catch (error) {
    console.error('Error subiendo documentos:', error);
    if (error instanceof Error) res.status(400).json({ message: error.message || 'Error al subir documentos' });
  }
};

export default {
  createDiagnostic,
  getPatientDocuments,
  downloadDocumentById,
  deleteDocumentById,
  async search(req, res) {
    try {
      const { patientId, diagnostic, dateFrom, dateTo } = req.query as Record<string, string | undefined>;
      const where: any = {};
      if (patientId) where.patientId = patientId;
      if (diagnostic) where.diagnosis = { contains: diagnostic, mode: 'insensitive' };
      if (dateFrom || dateTo) {
        where.diagnosticDate = {};
        if (dateFrom) where.diagnosticDate.gte = new Date(dateFrom);
        if (dateTo) where.diagnosticDate.lte = new Date(dateTo);
      }
      const list = await prisma.diagnostic.findMany({ where, orderBy: { diagnosticDate: 'desc' } });
      res.json({ diagnostics: list });
    } catch (e) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  uploadDocuments,
};
