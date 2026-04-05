import request from 'supertest';

jest.mock('../../config', () => ({
  config: { sandbox: true, port: 3001, databaseUrl: 'test', nodeEnv: 'test' },
}));

jest.mock('../../db/pool', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

jest.mock('../../db/migrate', () => ({
  runMigrations: jest.fn(),
}));

jest.mock('../../services/seedService', () => ({
  seedDatabase: jest.fn(),
}));

import { app } from '../../app';
import { pool } from '../../db/pool';
import { runMigrations } from '../../db/migrate';
import { seedDatabase } from '../../services/seedService';

const mockConnect = pool.connect as jest.Mock;
const mockRunMigrations = runMigrations as jest.Mock;
const mockSeedDatabase = seedDatabase as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRunMigrations.mockResolvedValue(undefined);
  mockSeedDatabase.mockResolvedValue(undefined);
});

describe('POST /api/sandbox/reset', () => {
  it('truncates all tables, re-migrates, and re-seeds', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
    const mockRelease = jest.fn();
    mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });

    const res = await request(app).post('/api/sandbox/reset');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE'));
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('schema_migrations'));
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(mockRunMigrations).toHaveBeenCalledTimes(1);
    expect(mockSeedDatabase).toHaveBeenCalledTimes(1);
  });

  it('releases connection and forwards error when DB truncate fails', async () => {
    const mockRelease = jest.fn();
    const mockQuery = jest.fn().mockRejectedValue(new Error('DB error'));
    mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });

    const res = await request(app).post('/api/sandbox/reset');

    expect(res.status).toBe(500);
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(mockRunMigrations).not.toHaveBeenCalled();
  });

  it('forwards error when re-seed fails', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
    const mockRelease = jest.fn();
    mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });
    mockSeedDatabase.mockRejectedValue(new Error('seed error'));

    const res = await request(app).post('/api/sandbox/reset');

    expect(res.status).toBe(500);
  });
});
