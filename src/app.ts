import express from 'express';

const app = express();

app.use(express.json());

// Health
app.get('/', (_req, res) => {
  res.send('Diagnostic Service is running');
});

// Stubs solo si USE_STUBS=true
if (process.env.USE_STUBS === 'true') {
  app.get('/api/v1/diagnostics', (_req, res) => {
    res.json({ diagnostics: [], pagination: { page: 1, limit: 20, total: 0 } });
  });
}

export default app;
