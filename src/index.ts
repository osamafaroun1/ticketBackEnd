import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/authRoutes.js';
import { metaRouter } from './routes/metaRoutes.js';
import { ticketRouter } from './routes/ticketRoutes.js';

dotenv.config(); // ✅ ممتاز

const app = express();

// ✅ انقل console.log هنا بعد db.js
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ✅ أو هنا بعد الـ health check
app.get('/api/health', async (_req, res) => {
  try {
    const { pool } = await import('./db.js');
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'reachable' });
  } catch (err: any) {
    res.status(500).json({ ok: false, db: 'error', message: err.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/meta', metaRouter);
app.use('/api', ticketRouter);

const port = Number(process.env.PORT || 4000);

// ✅ هذا الكود صحيح تماماً
(async function verifyDb() {
  try {
    const { pool } = await import('./db.js');
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');
  } catch (err: any) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
})();

app.listen(port, () => {
  console.log(`🚀 API listening on http://localhost:${port}`);
});
