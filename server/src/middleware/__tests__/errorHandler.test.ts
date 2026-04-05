import { errorHandler } from '../errorHandler';
import { Request, Response, NextFunction } from 'express';

function mockReqRes(): { res: Response; statusMock: jest.Mock; jsonMock: jest.Mock } {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const res = { status: statusMock } as unknown as Response;
  return { res, statusMock, jsonMock };
}

const req = {} as Request;
const next = jest.fn() as unknown as NextFunction;

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('responds with 500 for a plain Error', () => {
    const { res, statusMock, jsonMock } = mockReqRes();
    errorHandler(new Error('something went wrong'), req, res, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'something went wrong' });
  });

  it('uses custom status code when present on the error', () => {
    const { res, statusMock } = mockReqRes();
    const err = Object.assign(new Error('Not found'), { status: 404 });
    errorHandler(err, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('falls back to "Internal Server Error" when message is empty', () => {
    const { res, jsonMock } = mockReqRes();
    errorHandler(new Error(''), req, res, next);

    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  it('calls console.error with the stack', () => {
    const { res } = mockReqRes();
    const err = new Error('oops');
    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith(err.stack);
  });
});
