import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import unknownEndpoint from './middlewares/unknownEndpoint.js';
import errorHandler from './middlewares/errorHandler.js';
import router from './routes/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/v1', router);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
