# Diagnostic Service API Documentation

**Version:** 1.0.0  
**Base URL:** `/diagnostics`  
**Service:** Diagnostic Management System

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Create Diagnostic](#1-create-diagnostic)
   - [Get Patient Documents](#2-get-patient-documents)
   - [Download Document By ID](#3-download-document-by-id)
   - [Delete Document By ID](#4-delete-document-by-id)
4. [Common Error Responses](#common-error-responses)
5. [Data Models](#data-models)
6. [Routes Summary](#routes-summary)
7. [Notes](#notes)

---

## Overview

The Diagnostic Service manages medical diagnostics, patient diagnoses, treatments, and associated medical documents. This service allows doctors to create comprehensive diagnostic records with attached files (images, PDFs, etc.) and provides secure access to authorized medical staff.

**Key Features:**

- Create diagnostic records with multiple file attachments
- Retrieve all diagnostics for a specific patient
- Download individual diagnostic documents
- Delete diagnostic documents
- Verify patient existence and status before creating diagnostics
- Role-based access control (MEDICO, ENFERMERA, ADMINISTRADOR)

---

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

**Required Roles:**

- `MEDICO` - Doctor (can create diagnostics)
- `ENFERMERA` - Nurse (read-only access)
- `ADMINISTRADOR` - Administrator (full access)

---

# Endpoints

## 1. Create Diagnostic

Creates a new diagnostic record for a patient with optional file attachments.

**Endpoint:** `POST /diagnostics/:patientId`

**Auth Required:** `MEDICO`

**Content-Type:** `multipart/form-data`

**URL Parameters:**

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| patientId | string | Yes      | Patient MongoDB ObjectId |

**Form Data:**

| Field           | Type     | Required | Description                         |
| --------------- | -------- | -------- | ----------------------------------- |
| title           | string   | Yes      | Title of the diagnostic             |
| description     | string   | Yes      | Detailed description                |
| symptoms        | string   | Yes      | Patient symptoms                    |
| diagnosis       | string   | Yes      | Medical diagnosis                   |
| treatment       | string   | Yes      | Prescribed treatment                |
| observations    | string   | No       | Additional observations             |
| nextAppointment | datetime | No       | Date/time of next appointment       |
| documents       | File[]   | No       | Multiple files (images, PDFs, etc.) |

**File Upload Specifications:**

- **Maximum files:** 10 per diagnostic
- **Maximum file size:** 50MB per file
- **Allowed types:** PDF, images (JPEG, PNG, GIF, WebP), Word documents (DOC, DOCX)
- **Storage location:** `uploads/patient/diagnostics/{patientId}/{storedFilename}`

**Example Request:**

```bash
curl -X POST http://localhost:3000/diagnostics/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <jwt_token>" \
  -F "title=Consulta General - Control" \
  -F "description=Paciente presenta mejoría significativa" \
  -F "symptoms=Tos leve, sin fiebre" \
  -F "diagnosis=Infección respiratoria en remisión" \
  -F "treatment=Continuar antibiótico por 3 días más" \
  -F "observations=Control en 7 días" \
  -F "nextAppointment=2025-10-28T10:00:00Z" \
  -F "documents=@radiografia.jpg" \
  -F "documents=@resultados_lab.pdf"
```

**Success Response (201):**

```json
{
  "message": "Diagnóstico creado exitosamente",
  "data": {
    "id": "671a2b3c4d5e6f7890123456",
    "patientId": "507f1f77bcf86cd799439011",
    "doctorId": "507f1f77bcf86cd799439022",
    "title": "Consulta General - Control",
    "description": "Paciente presenta mejoría significativa",
    "symptoms": "Tos leve, sin fiebre",
    "diagnosis": "Infección respiratoria en remisión",
    "treatment": "Continuar antibiótico por 3 días más",
    "observations": "Control en 7 días",
    "diagnosticDate": "2025-10-21T15:30:00.000Z",
    "nextAppointment": "2025-10-28T10:00:00.000Z",
    "state": "ACTIVE",
    "createdAt": "2025-10-21T15:30:00.000Z",
    "updatedAt": "2025-10-21T15:30:00.000Z",
    "documents": [
      {
        "id": "671a2b3c4d5e6f7890123457",
        "diagnosticId": "671a2b3c4d5e6f7890123456",
        "filename": "radiografia.jpg",
        "storedFilename": "1729523400000-radiografia.jpg",
        "filePath": "/uploads/patient/diagnostics/507f1f77bcf86cd799439011/1729523400000-radiografia.jpg",
        "fileType": "image",
        "mimeType": "image/jpeg",
        "fileSize": 2048576,
        "description": null,
        "uploadedBy": "507f1f77bcf86cd799439022",
        "createdAt": "2025-10-21T15:30:00.000Z"
      },
      {
        "id": "671a2b3c4d5e6f7890123458",
        "diagnosticId": "671a2b3c4d5e6f7890123456",
        "filename": "resultados_lab.pdf",
        "storedFilename": "1729523400001-resultados_lab.pdf",
        "filePath": "/uploads/patient/diagnostics/507f1f77bcf86cd799439011/1729523400001-resultados_lab.pdf",
        "fileType": "document",
        "mimeType": "application/pdf",
        "fileSize": 512000,
        "description": null,
        "uploadedBy": "507f1f77bcf86cd799439022",
        "createdAt": "2025-10-21T15:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**

**400 - Patient ID Required:**

```json
{
  "error": "ID de paciente requerido",
  "message": "Debe proporcionar un ID de paciente válido"
}
```

**400 - Patient Inactive:**

```json
{
  "error": "Paciente inactivo",
  "message": "No se puede crear un diagnóstico para un paciente inactivo"
}
```

**404 - Patient Not Found:**

```json
{
  "error": "Paciente no encontrado",
  "message": "No se encontró un paciente con el ID proporcionado"
}
```

**400 - Validation Error:**

```json
{
  "message": "Invalid input data",
  "error": "ZodError details..."
}
```

---

## 2. Get Patient Documents

Retrieves all diagnostic records for a specific patient.

**Endpoint:** `GET /diagnostics/documents/patient/:patientId`

**Auth Required:** `MEDICO`, `ENFERMERA`, `ADMINISTRADOR`

**URL Parameters:**

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| patientId | string | Yes      | Patient MongoDB ObjectId |

**Example Request:**

```bash
curl -X GET http://localhost:3000/diagnostics/documents/patient/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <jwt_token>"
```

**Success Response (200):**

```json
{
  "message": "Documentos del paciente obtenidos exitosamente",
  "data": [
    {
      "id": "671a2b3c4d5e6f7890123456",
      "patientId": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439022",
      "title": "Consulta General - Control",
      "description": "Paciente presenta mejoría significativa",
      "symptoms": "Tos leve, sin fiebre",
      "diagnosis": "Infección respiratoria en remisión",
      "treatment": "Continuar antibiótico por 3 días más",
      "observations": "Control en 7 días",
      "diagnosticDate": "2025-10-21T15:30:00.000Z",
      "nextAppointment": "2025-10-28T10:00:00.000Z",
      "state": "ACTIVE",
      "createdAt": "2025-10-21T15:30:00.000Z",
      "updatedAt": "2025-10-21T15:30:00.000Z",
      "documents": [
        {
          "id": "671a2b3c4d5e6f7890123457",
          "diagnosticId": "671a2b3c4d5e6f7890123456",
          "filename": "radiografia.jpg",
          "storedFilename": "1729523400000-radiografia.jpg",
          "filePath": "/uploads/patient/diagnostics/507f1f77bcf86cd799439011/1729523400000-radiografia.jpg",
          "fileType": "image",
          "mimeType": "image/jpeg",
          "fileSize": 2048576,
          "description": null,
          "uploadedBy": "507f1f77bcf86cd799439022",
          "createdAt": "2025-10-21T15:30:00.000Z"
        }
      ]
    },
    {
      "id": "671a2b3c4d5e6f7890123459",
      "patientId": "507f1f77bcf86cd799439011",
      "doctorId": "507f1f77bcf86cd799439023",
      "title": "Consulta Inicial",
      "description": "Primera consulta del paciente",
      "symptoms": "Fiebre, dolor de garganta, malestar general",
      "diagnosis": "Infección respiratoria aguda",
      "treatment": "Antibiótico + reposo",
      "observations": "Paciente con síntomas desde hace 3 días",
      "diagnosticDate": "2025-10-14T10:00:00.000Z",
      "nextAppointment": "2025-10-21T10:00:00.000Z",
      "state": "ACTIVE",
      "createdAt": "2025-10-14T10:00:00.000Z",
      "updatedAt": "2025-10-14T10:00:00.000Z",
      "documents": []
    }
  ]
}
```

**Error Responses:**

**400 - Patient ID Required:**

```json
{
  "error": "ID de paciente requerido",
  "message": "Debe proporcionar un ID de paciente válido"
}
```

**500 - Server Error:**

```json
{
  "message": "Error al obtener documentos del paciente"
}
```

---

## 3. Download Document By ID

Downloads a specific diagnostic document file.

**Endpoint:** `GET /diagnostics/documents/:id`

**Auth Required:** `MEDICO`, `ENFERMERA`, `ADMINISTRADOR`

**URL Parameters:**

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| id        | string | Yes      | Document MongoDB ObjectId |

**Example Request:**

```bash
curl -X GET http://localhost:3000/diagnostics/documents/671a2b3c4d5e6f7890123457 \
  -H "Authorization: Bearer <jwt_token>" \
  -O
```

**Success Response (200):**

- **Content-Type:** Based on file type (e.g., `image/jpeg`, `application/pdf`)
- **Content-Disposition:** `attachment; filename="<original_filename>"`
- **Body:** File binary data

The file will be downloaded with its original filename.

**Error Responses:**

**400 - Document ID Required:**

```json
{
  "error": "ID de documento requerido",
  "message": "Debe proporcionar un ID de documento válido"
}
```

**404 - Document Not Found:**

```json
{
  "error": "Documento no encontrado",
  "message": "No se encontró un documento con el ID proporcionado"
}
```

**500 - Server Error:**

```json
{
  "message": "Error al descargar documento"
}
```

---

## 4. Delete Document By ID

Deletes a specific diagnostic document from the system.

**Endpoint:** `DELETE /diagnostics/documents/:id`

**Auth Required:** `MEDICO`, `ADMINISTRADOR`

**URL Parameters:**

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| id        | string | Yes      | Document MongoDB ObjectId |

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/diagnostics/documents/671a2b3c4d5e6f7890123457 \
  -H "Authorization: Bearer <jwt_token>"
```

**Success Response (200):**

```json
{
  "message": "Documento eliminado exitosamente"
}
```

**Error Responses:**

**400 - Document ID Required:**

```json
{
  "error": "ID de documento requerido",
  "message": "Debe proporcionar un ID de documento válido"
}
```

**500 - Server Error:**

```json
{
  "message": "Error al eliminar documento"
}
```

---

# Common Error Responses

## Validation Errors (400)

```json
{
  "error": "Validation failed",
  "message": "Invalid input data"
}
```

## Authentication Error (401)

```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

## Authorization Error (403)

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

## Not Found Error (404)

```json
{
  "error": "Resource not found",
  "message": "The requested resource was not found"
}
```

## Server Error (500)

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

# Data Models

## Diagnostic State

- `ACTIVE` - Active diagnostic record
- `ARCHIVED` - Archived record (historical)
- `DELETED` - Soft-deleted record

## Diagnostic Fields

```typescript
{
  id: string;                    // MongoDB ObjectId
  patientId: string;             // MongoDB ObjectId (reference to patient)
  doctorId: string;              // MongoDB ObjectId (reference to doctor)
  title: string;                 // Diagnostic title
  description: string;           // Detailed description
  symptoms: string;              // Patient symptoms
  diagnosis: string;             // Medical diagnosis
  treatment: string;             // Prescribed treatment
  observations?: string;         // Optional additional notes
  diagnosticDate: Date;          // Date of diagnosis (auto-generated)
  nextAppointment?: Date;        // Optional next appointment date
  state: "ACTIVE" | "ARCHIVED" | "DELETED";
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  documents: DiagnosticDocument[]; // Array of attached documents
}
```

## DiagnosticDocument Fields

```typescript
{
  id: string;                    // MongoDB ObjectId
  diagnosticId: string;          // MongoDB ObjectId (reference to diagnostic)
  filename: string;              // Original filename
  storedFilename: string;        // Stored filename with timestamp
  filePath: string;              // Full path to stored file
  fileType: string;              // Type: "image", "document", etc.
  mimeType: string;              // MIME type (e.g., "image/jpeg")
  fileSize: number;              // File size in bytes
  description?: string;          // Optional file description
  uploadedBy: string;            // MongoDB ObjectId (reference to user who uploaded)
  createdAt: Date;               // Upload timestamp
}
```

## File Upload Schema

```typescript
{
  title: string;                 // Required: Diagnostic title
  description: string;           // Required: Detailed description
  symptoms: string;              // Required: Patient symptoms
  diagnosis: string;             // Required: Medical diagnosis
  treatment: string;             // Required: Prescribed treatment
  observations?: string;         // Optional: Additional notes
  nextAppointment?: Date;        // Optional: Next appointment date
}
```

**Supported File Types:**

| Extension   | MIME Type                                                               | Category |
| ----------- | ----------------------------------------------------------------------- | -------- |
| .pdf        | application/pdf                                                         | document |
| .jpg, .jpeg | image/jpeg                                                              | image    |
| .png        | image/png                                                               | image    |
| .gif        | image/gif                                                               | image    |
| .webp       | image/webp                                                              | image    |
| .doc        | application/msword                                                      | document |
| .docx       | application/vnd.openxmlformats-officedocument.wordprocessingml.document | document |

---

# Routes Summary

## Diagnostics Routes (`/diagnostics`)

| Method | Endpoint                                    | Auth                     | Description                  |
| ------ | ------------------------------------------- | ------------------------ | ---------------------------- |
| POST   | `/diagnostics/:patientId`                   | MEDICO                   | Create diagnostic with files |
| GET    | `/diagnostics/documents/patient/:patientId` | ADMIN, MEDICO, ENFERMERA | Get all patient diagnostics  |
| GET    | `/diagnostics/documents/:id`                | ADMIN, MEDICO, ENFERMERA | Download specific document   |
| DELETE | `/diagnostics/documents/:id`                | ADMIN, MEDICO            | Delete specific document     |

---

# Notes

1. **Patient Verification:**

   - Before creating a diagnostic, the service verifies that the patient exists in the Users service
   - Only ACTIVE patients can have new diagnostics created
   - Patient verification is done via inter-service communication

2. **File Storage:**

   - Files are stored in the filesystem at `uploads/patient/diagnostics/{patientId}/`
   - Filenames are prefixed with timestamps to avoid collisions
   - Original filenames are preserved in the database

3. **File Upload Limits:**

   - Maximum 10 files per diagnostic
   - Maximum 50MB per file
   - Total upload size limited by server configuration

4. **Security:**

   - All endpoints require JWT authentication
   - File downloads verify user authorization
   - File paths are validated to prevent directory traversal attacks

5. **Role-Based Access:**

   - **MEDICO** (Doctors): Full access - create, read, delete
   - **ENFERMERA** (Nurses): Read-only access
   - **ADMINISTRADOR** (Administrators): Full access

6. **Cascading Deletes:**

   - When a diagnostic is deleted, all associated documents are also deleted (cascade)
   - Physical files are removed from the filesystem

7. **Soft Deletes:**

   - Diagnostics support soft deletion via the `state` field
   - State can be: ACTIVE, ARCHIVED, or DELETED

8. **Date Handling:**

   - All dates are stored in ISO 8601 format
   - `diagnosticDate` is automatically set to current date/time on creation
   - `nextAppointment` is optional and can be set to future dates

9. **Inter-Service Communication:**

   - The diagnostic service communicates with the Users service to verify patient existence
   - Authorization token is forwarded for patient verification

10. **Document Retrieval:**

    - Documents are returned with complete metadata
    - File sizes are returned in bytes
    - MIME types are preserved for proper content handling

11. **Error Handling:**
    - All errors are logged on the server
    - Client receives sanitized error messages
    - File upload errors are handled gracefully

---

## Example Use Cases

### Use Case 1: Create a Complete Diagnostic with Images

A doctor creates a diagnostic after a patient consultation and uploads X-ray images:

```bash
POST /diagnostics/507f1f77bcf86cd799439011
Content-Type: multipart/form-data

title: "Fractura de Radio - Seguimiento"
description: "Paciente acude a control post-fractura"
symptoms: "Dolor moderado en antebrazo derecho, movilidad limitada"
diagnosis: "Fractura de radio en proceso de consolidación"
treatment: "Continuar inmovilización por 2 semanas, analgésicos PRN"
observations: "Evolución favorable, consolidación visible en radiografía"
nextAppointment: "2025-11-04T09:00:00Z"
documents: [xray-inicial.jpg, xray-control.jpg]
```

### Use Case 2: Review Patient History

A nurse reviews all diagnostics for a patient before an appointment:

```bash
GET /diagnostics/documents/patient/507f1f77bcf86cd799439011
Authorization: Bearer <nurse_token>
```

### Use Case 3: Download Medical Document

A doctor downloads a specific lab report for review:

```bash
GET /diagnostics/documents/671a2b3c4d5e6f7890123457
Authorization: Bearer <doctor_token>
```

### Use Case 4: Remove Outdated Document

An administrator removes an incorrectly uploaded document:

```bash
DELETE /diagnostics/documents/671a2b3c4d5e6f7890123457
Authorization: Bearer <admin_token>
```

---

## Best Practices

1. **File Organization:**

   - Use descriptive filenames for uploaded documents
   - Group related documents in a single diagnostic
   - Use the `description` field in future versions to label documents

2. **Data Quality:**

   - Provide comprehensive symptom descriptions
   - Include detailed treatment plans
   - Set next appointments when follow-up is needed

3. **Security:**

   - Always use HTTPS in production
   - Rotate JWT tokens regularly
   - Validate file types on both client and server

4. **Performance:**

   - Compress large images before uploading
   - Use pagination for large document lists (future enhancement)
   - Cache frequently accessed diagnostics

5. **Error Handling:**
   - Implement retry logic for failed uploads
   - Handle network timeouts gracefully
   - Provide user-friendly error messages

---

**Document Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Maintained By:** MedCore Development Team
