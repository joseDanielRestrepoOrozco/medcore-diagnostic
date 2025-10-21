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

export default {
  createDiagnostic,
};
