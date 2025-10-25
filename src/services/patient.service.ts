import { USERS_SERVICE_URL } from '../libs/config.js';

interface PatientData {
  patient: {
    id: string;
    userId: string;
    documentNumber: string;
    gender: string;
    address?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface VerifyPatientResult {
  success: boolean;
  error?: {
    status: number;
    message: string;
  };
  patient?: PatientData['patient'];
}

/**
 * Verifica que un paciente exista en el servicio de patients
 */
export async function verifyPatientExists(
  patientId: string,
  authToken: string
): Promise<VerifyPatientResult> {
  try {
    const patientResponse = await fetch(
      `${USERS_SERVICE_URL}/api/v1/users/patients/${patientId}`,
      {
        method: 'GET',
        headers: {
          Authorization: authToken,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!patientResponse.ok) {
      if (patientResponse.status === 404) {
        return {
          success: false,
          error: {
            status: 404,
            message: 'El paciente no existe en el sistema',
          },
        };
      }

      return {
        success: false,
        error: {
          status: patientResponse.status,
          message: 'No se pudo verificar la existencia del paciente',
        },
      };
    }

    const patientData = (await patientResponse.json()) as PatientData;

    return {
      success: true,
      patient: patientData.patient,
    };
  } catch (error) {
    console.error('[verifyPatientExists] Error al verificar paciente:', error);
    return {
      success: false,
      error: {
        status: 503,
        message:
          'El servicio de pacientes no está disponible en este momento. Por favor, intenta más tarde.',
      },
    };
  }
}
