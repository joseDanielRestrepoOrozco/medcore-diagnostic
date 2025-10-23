import express from 'express';
import cors from 'cors';
import path from 'path';
import unknownEndpoint from './middlewares/unknownEndpoint.js';
import errorHandler from './middlewares/errorHandler.js';
import router from './routes/router.js';

const app = express();

app.use(express.json());
app.use(cors());

// Safe DB target log
(() => {
  const raw = process.env.DATABASE_URL || '';
  let host = '(unknown)';
  let db = '(unknown)';
  try {
    const repl = raw.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const u = new URL(repl);
    host = u.host;
    db = (u.pathname || '').replace(/^\//, '') || '(none)';
  } catch {
    const m = raw.match(/@([^/]+)\/?([^?]*)/);
    if (m) {
      host = m[1];
      db = m[2] || '(none)';
    }
  }
  console.log('[DIAGNOSTIC] DB target', { host, db });
})();

// Safe full URL (enmascarada) para claridad
(() => {
  const raw = process.env.DATABASE_URL || '';
  try {
    const isSrv = raw.startsWith('mongodb+srv://');
    const normalized = raw.replace(/^mongodb(\+srv)?:\/\//, 'http://');
    const u = new URL(normalized);
    const user = u.username ? encodeURIComponent(u.username) : '';
    const pass = u.password ? '***' : '';
    const auth = user ? `${user}:${pass}@` : '';
    const db = (u.pathname || '').replace(/^\//, '');
    const protocol = isSrv ? 'mongodb+srv://' : 'mongodb://';
    const query = u.search || '';
    const safeUrl = `${protocol}${auth}${u.host}/${db}${query}`;
    console.log('[DIAGNOSTIC] DB ping target ->', safeUrl);
  } catch {
    // ignore
  }
})();

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/v1', router);

app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
