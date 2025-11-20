import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import {
  type DiagnosticDataType,
  type DiagnosticDataUpdateType,
} from '../schemas/DiagnosticData.js';

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

  async getDiagnosticsByPatientId(
    patientId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const [diagnostics, total] = await Promise.all([
      prisma.diagnostic.findMany({
        where: { patientId },
        include: { documents: true },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.diagnostic.count({
        where: { patientId },
      }),
    ]);

    return {
      diagnostics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async getDiagnosticById(diagnosticId: string) {
    return await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      include: { documents: true },
    });
  }

  async updateDiagnostic(diagnosticId: string, data: DiagnosticDataUpdateType) {
    return await prisma.diagnostic.update({
      where: { id: diagnosticId },
      data,
      include: {
        documents: true,
      },
    });
  }

  async addDocumentsToDiagnostic(
    diagnosticId: string,
    doctorId: string,
    files: Express.Multer.File[]
  ) {
    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Verificar que el diagnóstico exista
        const diagnostic = await tx.diagnostic.findUnique({
          where: { id: diagnosticId },
        });

        if (!diagnostic) {
          throw new Error('Diagnóstico no encontrado');
        }

        // Crear registros de documentos
        const documentRecords = files.map(file => ({
          diagnosticId,
          filename: file.originalname,
          storedFilename: file.filename,
          filePath: file.path,
          fileType: file.originalname.split('.').pop()?.toLowerCase() as string,
          mimeType: file.mimetype,
          fileSize: file.size,
          description: null,
          uploadedBy: doctorId,
        }));

        await tx.diagnosticDocument.createMany({
          data: documentRecords,
        });

        // Retornar el diagnóstico actualizado con todos sus documentos
        return await tx.diagnostic.findUnique({
          where: { id: diagnosticId },
          include: {
            documents: true,
          },
        });
      });
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

  async getDiagnosticDocumentsByPatientId(
    patientId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    const [diagnosticDocuments, total] = await Promise.all([
      prisma.diagnosticDocument.findMany({
        where: {
          diagnostic: {
            patientId,
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.diagnosticDocument.count({
        where: {
          diagnostic: { patientId },
        },
      }),
    ]);

    return {
      diagnosticDocuments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFileById(fileId: string) {
    return await prisma.diagnosticDocument.findUnique({
      where: { id: fileId },
    });
  }

  async deleteDocumentById(documentId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const document = await tx.diagnosticDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      try {
        await fs.promises.unlink(document.filePath);
      } catch (e) {
        console.error(`Error al eliminar el archivo ${document.filePath}:`, e);
      }

      await tx.diagnosticDocument.delete({
        where: { id: documentId },
      });

      return document;
    });
  }
}

export default new DiagnosticService();
