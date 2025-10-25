import { type Request, type Response } from 'express';
import { DiagnosticData } from '../schemas/DiagnosticData.js';
import diagnosticService from '../services/diagnostic.service.js';
import { verifyPatientExists } from '../services/patient.service.js';

const createDiagnostic = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const files = req.files as Express.Multer.File[];
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

    console.log(patientVerification);

    // Validar que el paciente esté activo
    if (patientVerification.patient!.status !== 'ACTIVE') {
      res.status(400).json({
        error: 'Paciente inactivo',
        message: 'No se puede crear un diagnóstico para un paciente inactivo',
      });
      return;
    }

    const diagnosticData = DiagnosticData.parse(req.body);

    const diagnostic = await diagnosticService.createDiagnostic(
      patientId,
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

export default {
  createDiagnostic,
  getPatientDocuments,
  downloadDocumentById,
  deleteDocumentById,
};
