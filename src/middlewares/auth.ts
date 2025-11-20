import { type NextFunction, type Request, type Response } from 'express';
import { AUTH_SERVICE_URL } from '../libs/config.js';
import { userSchema } from '../types/User.js';

export const requireRoles = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let authHeader = req.headers.authorization;
      // Permitir token vía query (para descargas/visor en <object>/<iframe>)
      if (!authHeader && typeof req.query.token === 'string' && req.query.token) {
        authHeader = `Bearer ${req.query.token}`;
      }

      if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      // Llamar al servicio AUTH para verificar el token
      const response = await fetch(
        `${AUTH_SERVICE_URL}/api/v1/auth/verify-token?allowedRoles=${allowedRoles.join(
          ','
        )}`,
        {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        res.status(response.status).json(errorData);
        return;
      }

      const data = await response.json();

      const parsed = userSchema.safeParse(data.user);
      if (!parsed.success) {
        res.status(401).json({
          error: 'Invalid response from auth service',
          message: 'The authentication service returned invalid data format',
        });
        return;
      }

      req.user = parsed.data;

      next();
    } catch (error) {
      console.error(
        '[requireRoles] Error al conectar con el servicio de autenticación:',
        error
      );
      res.status(503).json({
        error: 'Servicio no disponible',
        message:
          'El servicio de autenticación no está disponible en este momento. Por favor, intenta más tarde.',
      });
    }
  };
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Llamar al servicio AUTH para autenticar sin validar roles
    const response = await fetch(
      `${AUTH_SERVICE_URL}/api/v1/auth/authenticate`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      res.status(response.status).json(errorData);
      return;
    }

    const data = await response.json();

    const parsed = userSchema.safeParse(data.user);
    if (!parsed.success) {
      res.status(401).json({
        error: 'Invalid response from auth service',
        message: 'The authentication service returned invalid data format',
      });
      return;
    }

    req.user = parsed.data;

    next();
  } catch (error) {
    console.error(
      '[authenticateUser] Error al conectar con el servicio de autenticación:',
      error
    );
    res.status(503).json({
      error: 'Servicio no disponible',
      message:
        'El servicio de autenticación no está disponible en este momento. Por favor, intenta más tarde.',
    });
  }
};
