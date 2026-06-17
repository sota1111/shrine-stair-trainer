import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import recordsRouter from './routes/records.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();

app.use(express.json());

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.use('/api/records', recordsRouter);

// Not Found handler for API and healthz
app.use(notFound);

// Static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

export default app;
