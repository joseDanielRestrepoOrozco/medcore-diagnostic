import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import { type DiagnosticDataType } from '../schemas/DiagnosticData.js';

const prisma = new PrismaClient();

class DiagnosticService {
  async createDiagnostic(
    patientId: string,
    doctorId: string,
    diagnosticData: DiagnosticDataType,
    files?: Express.Multer.File[]
  ) {
    try {
      const diagnostic = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const newDiagnostic = await tx.diagnostic.create({
            data: {
              patientId,
              doctorId,
              title: diagnosticData.title,
              description: diagnosticData.description,
              symptoms: diagnosticData.symptoms,
              diagnosis: diagnosticData.diagnosis,
              treatment: diagnosticData.treatment,
              observations: diagnosticData.observations || null,
              nextAppointment: diagnosticData.nextAppointment
                ? new Date(diagnosticData.nextAppointment)
                : null,
            },
          });

          if (files && files.length > 0) {
            const documentRecords = files.map(file => ({
              diagnosticId: newDiagnostic.id,
              filename: file.originalname,
              storedFilename: file.filename,
              filePath: file.path,
              fileType: file.originalname
                .split('.')
                .pop()
                ?.toLowerCase() as string,
              mimeType: file.mimetype,
              fileSize: file.size,
              description: null,
              uploadedBy: doctorId,
            }));

            await tx.diagnosticDocument.createMany({
              data: documentRecords,
            });
          }

          return await tx.diagnostic.findUnique({
            where: { id: newDiagnostic.id },
            include: {
              documents: true,
            },
          });
        }
      );

      return diagnostic;
    } catch (error) {
      // Si hay error, eliminar los archivos subidos
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            await fs.promises.unlink(file.path);
          } catch (unlinkError) {
            console.error(
              `Error al eliminar el archivo ${file.path}:`,
              unlinkError
            );
          }
        }
      }

      throw error;
    }
  }
}

export default new DiagnosticService();
