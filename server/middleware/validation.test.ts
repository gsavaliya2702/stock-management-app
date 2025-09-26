import { validate, validators } from './validation';
import { Request, Response, NextFunction } from 'express';

// Mock Express request, response, and next function
const mockRequest = (body: any = {}, params: any = {}, query: any = {}) => {
  return {
    body,
    params,
    query
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validators', () => {
    describe('isString', () => {
      it('returns true for valid strings', () => {
        expect(validators.isString('test')).toBe(true);
        expect(validators.isString('  test  ')).toBe(true);
      });

      it('returns error message for empty strings', () => {
        expect(validators.isString('')).toBe('Field must be a non-empty string');
        expect(validators.isString('   ')).toBe('Field must be a non-empty string');
      });

      it('returns error message for non-strings', () => {
        expect(validators.isString(123)).toBe('Field must be a non-empty string');
        expect(validators.isString(null)).toBe('Field must be a non-empty string');
        expect(validators.isString(undefined)).toBe('Field must be a non-empty string');
        expect(validators.isString({})).toBe('Field must be a non-empty string');
      });
    });

    describe('isNumber', () => {
      it('returns true for valid numbers', () => {
        expect(validators.isNumber(123)).toBe(true);
        expect(validators.isNumber(0)).toBe(true);
        expect(validators.isNumber(-123)).toBe(true);
        expect(validators.isNumber(3.14)).toBe(true);
      });

      it('returns error message for non-numbers', () => {
        expect(validators.isNumber('123')).toBe('Field must be a valid number');
        expect(validators.isNumber(null)).toBe('Field must be a valid number');
        expect(validators.isNumber(undefined)).toBe('Field must be a valid number');
        expect(validators.isNumber({})).toBe('Field must be a valid number');
      });

      it('returns error message for NaN', () => {
        expect(validators.isNumber(NaN)).toBe('Field must be a valid number');
      });
    });

    describe('isPositiveNumber', () => {
      it('returns true for positive numbers', () => {
        expect(validators.isPositiveNumber(123)).toBe(true);
        expect(validators.isPositiveNumber(0.01)).toBe(true);
      });

      it('returns error message for negative numbers', () => {
        expect(validators.isPositiveNumber(-123)).toBe('Field must be a positive number');
      });

      it('returns error message for zero', () => {
        expect(validators.isPositiveNumber(0)).toBe('Field must be a positive number');
      });

      it('returns error message for non-numbers', () => {
        expect(validators.isPositiveNumber('123')).toBe('Field must be a positive number');
      });
    });

    describe('isInteger', () => {
      it('returns true for valid integers', () => {
        expect(validators.isInteger(123)).toBe(true);
        expect(validators.isInteger(0)).toBe(true);
        expect(validators.isInteger(-123)).toBe(true);
      });

      it('returns error message for non-integers', () => {
        expect(validators.isInteger(123.45)).toBe('Field must be an integer');
        expect(validators.isInteger('123')).toBe('Field must be an integer');
      });
    });

    describe('isPositiveInteger', () => {
      it('returns true for positive integers', () => {
        expect(validators.isPositiveInteger(123)).toBe(true);
        expect(validators.isPositiveInteger(1)).toBe(true);
      });

      it('returns error message for negative integers', () => {
        expect(validators.isPositiveInteger(-123)).toBe('Field must be a positive integer');
      });

      it('returns error message for zero', () => {
        expect(validators.isPositiveInteger(0)).toBe('Field must be a positive integer');
      });

      it('returns error message for non-integers', () => {
        expect(validators.isPositiveInteger(123.45)).toBe('Field must be a positive integer');
      });
    });

    describe('isValidDate', () => {
      it('returns true for valid dates', () => {
        expect(validators.isValidDate(new Date())).toBe(true);
        expect(validators.isValidDate('2023-01-01')).toBe(true);
        expect(validators.isValidDate('01/01/2023')).toBe(true);
      });

      it('returns error message for invalid dates', () => {
        expect(validators.isValidDate('invalid-date')).toBe('Field must be a valid date');
        expect(validators.isValidDate(123)).toBe('Field must be a valid date');
        expect(validators.isValidDate(null)).toBe('Field must be a valid date');
      });
    });

    describe('isValidObjectId', () => {
      it('returns true for valid ObjectIds', () => {
        expect(validators.isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      });

      it('returns error message for invalid ObjectIds', () => {
        expect(validators.isValidObjectId('invalid-id')).toBe('Field must be a valid MongoDB ObjectId');
        expect(validators.isValidObjectId('507f1f77bcf86cd79943901')).toBe('Field must be a valid MongoDB ObjectId');
        expect(validators.isValidObjectId(123)).toBe('Field must be a valid MongoDB ObjectId');
      });
    });

    describe('isIn', () => {
      const allowedValues = ['option1', 'option2', 'option3'];
      
      it('returns true for allowed values', () => {
        expect(validators.isIn(allowedValues)('option1')).toBe(true);
        expect(validators.isIn(allowedValues)('option2')).toBe(true);
        expect(validators.isIn(allowedValues)('option3')).toBe(true);
      });

      it('returns error message for disallowed values', () => {
        expect(validators.isIn(allowedValues)('option4')).toBe('Field must be one of: option1, option2, option3');
        expect(validators.isIn(allowedValues)('')).toBe('Field must be one of: option1, option2, option3');
      });
    });

    describe('isArray', () => {
      it('returns true for arrays', () => {
        expect(validators.isArray([])).toBe(true);
        expect(validators.isArray([1, 2, 3])).toBe(true);
      });

      it('returns error message for non-arrays', () => {
        expect(validators.isArray('not-an-array')).toBe('Field must be an array');
        expect(validators.isArray(123)).toBe('Field must be an array');
        expect(validators.isArray({})).toBe('Field must be an array');
      });
    });

    describe('isEmail', () => {
      it('returns true for valid emails', () => {
        expect(validators.isEmail('test@example.com')).toBe(true);
        expect(validators.isEmail('user.name+tag@domain.co.uk')).toBe(true);
      });

      it('returns error message for invalid emails', () => {
        expect(validators.isEmail('invalid-email')).toBe('Field must be a valid email address');
        expect(validators.isEmail('test@')).toBe('Field must be a valid email address');
        expect(validators.isEmail('@example.com')).toBe('Field must be a valid email address');
      });
    });

    describe('minLength', () => {
      it('returns true for strings meeting minimum length', () => {
        expect(validators.minLength(5)('hello')).toBe(true);
        expect(validators.minLength(5)('helloworld')).toBe(true);
      });

      it('returns error message for strings shorter than minimum', () => {
        expect(validators.minLength(5)('hi')).toBe('Field must be at least 5 characters long');
        expect(validators.minLength(5)('')).toBe('Field must be at least 5 characters long');
      });
    });

    describe('maxLength', () => {
      it('returns true for strings within maximum length', () => {
        expect(validators.maxLength(5)('hello')).toBe(true);
        expect(validators.maxLength(5)('hi')).toBe(true);
      });

      it('returns error message for strings longer than maximum', () => {
        expect(validators.maxLength(5)('helloworld')).toBe('Field must be at most 5 characters long');
      });
    });
  });

  describe('Validate Middleware', () => {
    it('calls next() when validation passes', () => {
      const schema = {
        body: {
          name: validators.isString,
          age: validators.isNumber
        }
      };

      const req = mockRequest({ name: 'John', age: 30 });
      const res = mockResponse();

      validate(schema)(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 with errors when validation fails', () => {
      const schema = {
        body: {
          name: validators.isString,
          age: validators.isPositiveNumber
        }
      };

      const req = mockRequest({ name: '', age: -5 });
      const res = mockResponse();

      validate(schema)(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'Field must be a non-empty string' },
          { field: 'age', message: 'Field must be a positive number' }
        ]
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('validates params when schema includes params', () => {
      const schema = {
        params: {
          id: validators.isValidObjectId
        }
      };

      const req = mockRequest({}, { id: 'invalid-id' });
      const res = mockResponse();

      validate(schema)(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'id', message: 'Field must be a valid MongoDB ObjectId' }
        ]
      });
    });

    it('validates query when schema includes query', () => {
      const schema = {
        query: {
          limit: validators.isPositiveInteger
        }
      };

      const req = mockRequest({}, {}, { limit: 'not-a-number' });
      const res = mockResponse();

      validate(schema)(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [
          { field: 'limit', message: 'Field must be a valid number' }
        ]
      });
    });
  });
});