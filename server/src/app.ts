import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';
import usersRouter from './routes/users';
import categoriesRouter from './routes/categories';
import goalsRouter from './routes/goals';
import progressRouter from './routes/progress';
import dashboardRouter from './routes/dashboard';
import historyRouter from './routes/history';
import sandboxRouter from './routes/sandbox';
import dailyCompletionsRouter from './routes/dailyCompletions';
import pushRouter from './routes/push';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sandbox: config.sandbox, timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/history', historyRouter);
app.use('/api/sandbox', sandboxRouter);
app.use('/api/daily-completions', dailyCompletionsRouter);
app.use('/api/push', pushRouter);

app.use(errorHandler);
