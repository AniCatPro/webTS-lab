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
const rawOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const allowLocalhost = [
    /^http:\/\/localhost(?::\d+)?$/,
    /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
];

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/anicatpro.json', (_req, res) => res.json(swaggerSpec));
app.use(cors({
    origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (rawOrigins.includes(origin)) return cb(null, true);
        if (allowLocalhost.some(re => re.test(origin))) return cb(null, true);

        return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

app.use('/api/auth', authRouter);
app.use('/api/files', filesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));