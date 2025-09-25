import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { filesRouter } from './routes/files.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/error.js';
import { swaggerUi, swaggerSpec } from './swagger.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// статические файлы для примеров (pdf/png), опционально
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
