import { validate } from '../validate';
import { z } from 'zod';
import { Request, Response } from 'express';

function mockReqRes(body: unknown): {
  req: Request;
  res: Response;
  next: jest.Mock<void, []>;
  statusMock: jest.Mock;
  jsonMock: jest.Mock;
} {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const req = { body } as Request;
  const res = { status: statusMock } as unknown as Response;
  const next = jest.fn() as jest.Mock;
  return { req, res, next, statusMock, jsonMock };
}

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    count: z.number().positive(),
  });

  it('calls next() and mutates req.body when body is valid', () => {
    const { req, res, next } = mockReqRes({ name: 'Alice', count: 3 });
    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith(); // called with no args
    expect(req.body).toEqual({ name: 'Alice', count: 3 });
  });

  it('responds 400 with error array when Zod validation fails', () => {
    const { req, res, next, statusMock, jsonMock } = mockReqRes({ name: '', count: -1 });
    validate(schema)(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: expect.any(Array) });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 400 when required field is missing', () => {
    const { req, res, next, statusMock } = mockReqRes({ name: 'Alice' });
    validate(schema)(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards non-Zod errors to next(err)', () => {
    const throwingSchema = z.object({}).transform(() => {
      throw new Error('unexpected failure');
    });
    const { req, res, next } = mockReqRes({});
    validate(throwingSchema)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('strips unknown fields (Zod default behaviour)', () => {
    const { req, res, next } = mockReqRes({ name: 'Bob', count: 2, extra: 'ignored' });
    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).not.toHaveProperty('extra');
  });
});
