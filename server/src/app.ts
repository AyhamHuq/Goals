import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import usersRouter from './routes/users';
import categoriesRouter from './routes/categories';
import goalsRouter from './routes/goals';
import progressRouter from './routes/progress';
import dashboardRouter from './routes/dashboard';
import historyRouter from './routes/history';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/history', historyRouter);

app.use(errorHandler);
