import { type Request, type Response } from 'express';
import {
  DiagnosticData,
  DiagnosticDataUpdate,
} from '../schemas/DiagnosticData.js';
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!patientId) {
      res.status(400).json({
        error: 'ID de paciente requerido',
        message: 'Debe proporcionar un ID de paciente válido',
      });
      return;
    }

    // Validar que page y limit sean números positivos
    if (page < 1 || limit < 1) {
      res.status(400).json({
        error: 'Parámetros de paginación inválidos',
        message: 'Los parámetros page y limit deben ser números positivos',
      });
      return;
    }

    // Limitar el límite máximo a 100 para evitar sobrecarga
    const validatedLimit = Math.min(limit, 100);

    const result = await diagnosticService.getDiagnosticsByPatientId(
      patientId,
      page,
      validatedLimit
    );

    res.status(200).json({
      message: 'Documentos del paciente obtenidos exitosamente',
      data: result.diagnostics,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error obteniendo documentos del paciente:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener documentos del paciente' });
  }
};

const getDiagnosticById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'ID de diagnóstico requerido',
        message: 'Debe proporcionar un ID de diagnóstico válido',
      });
      return;
    }

    const diagnostic = await diagnosticService.getDiagnosticById(id);

    if (!diagnostic) {
      res.status(404).json({
        error: 'Diagnóstico no encontrado',
        message: 'No se encontró un diagnóstico con el ID proporcionado',
      });
      return;
    }

    res.status(200).json({
      message: 'Diagnóstico obtenido exitosamente',
      data: diagnostic,
    });
  } catch (error) {
    console.error('Error obteniendo diagnóstico:', error);
    res.status(500).json({ message: 'Error al obtener diagnóstico' });
  }
};

const updateDiagnostic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'ID de diagnóstico requerido',
        message: 'Debe proporcionar un ID de diagnóstico válido',
      });
      return;
    }

    // Verificar que el diagnóstico exista
    const existingDiagnostic = await diagnosticService.getDiagnosticById(id);

    if (!existingDiagnostic) {
      res.status(404).json({
        error: 'Diagnóstico no encontrado',
        message: 'No se encontró un diagnóstico con el ID proporcionado',
      });
      return;
    }

    // Validar los datos del diagnóstico
    const diagnosticData = DiagnosticDataUpdate.parse(req.body);

    // Actualizar el diagnóstico
    const updatedDiagnostic = await diagnosticService.updateDiagnostic(
      id,
      diagnosticData
    );

    res.status(200).json({
      message: 'Diagnóstico actualizado exitosamente',
      data: updatedDiagnostic,
    });
  } catch (error) {
    console.error('Error actualizando diagnóstico:', error);
    if (error instanceof Error) {
      res.status(400).json({
        message: error.message || 'Error al actualizar diagnóstico',
      });
    } else {
      res.status(500).json({ message: 'Error al actualizar diagnóstico' });
    }
  }
};

const addDocumentsToDiagnostic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const user = req.user;

    if (!id) {
      res.status(400).json({
        error: 'ID de diagnóstico requerido',
        message: 'Debe proporcionar un ID de diagnóstico válido',
      });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({
        error: 'Archivos requeridos',
        message: 'Debe proporcionar al menos un archivo',
      });
      return;
    }

    // Verificar que el diagnóstico exista
    const existingDiagnostic = await diagnosticService.getDiagnosticById(id);

    if (!existingDiagnostic) {
      res.status(404).json({
        error: 'Diagnóstico no encontrado',
        message: 'No se encontró un diagnóstico con el ID proporcionado',
      });
      return;
    }

    // Agregar los documentos
    const updatedDiagnostic = await diagnosticService.addDocumentsToDiagnostic(
      id,
      user!.id,
      files
    );

    res.status(200).json({
      message: 'Documentos agregados exitosamente',
      data: updatedDiagnostic,
    });
  } catch (error) {
    console.error('Error agregando documentos:', error);
    if (error instanceof Error) {
      res.status(400).json({
        message: error.message || 'Error al agregar documentos',
      });
    } else {
      res.status(500).json({ message: 'Error al agregar documentos' });
    }
  }
};

const getMyMedicalHistory = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!user) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'No se pudo obtener información del usuario',
      });
      return;
    }

    // Verificar que el usuario sea un paciente
    if (user.role !== 'PACIENTE') {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo los pacientes pueden acceder a su historia clínica',
      });
      return;
    }

    // Validar que page y limit sean números positivos
    if (page < 1 || limit < 1) {
      res.status(400).json({
        error: 'Parámetros de paginación inválidos',
        message: 'Los parámetros page y limit deben ser números positivos',
      });
      return;
    }

    // Limitar el límite máximo a 100 para evitar sobrecarga
    const validatedLimit = Math.min(limit, 100);

    // Obtener el ID del paciente desde el usuario autenticado
    const patientId = user.id;

    const result = await diagnosticService.getDiagnosticsByPatientId(
      patientId,
      page,
      validatedLimit
    );

    res.status(200).json({
      message: 'Historia clínica obtenida exitosamente',
      data: result.diagnostics,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error obteniendo historia clínica:', error);
    res.status(500).json({ message: 'Error al obtener historia clínica' });
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
  getDiagnosticById,
  updateDiagnostic,
  addDocumentsToDiagnostic,
  getMyMedicalHistory,
  downloadDocumentById,
  deleteDocumentById,
};
