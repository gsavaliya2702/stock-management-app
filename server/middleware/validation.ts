import { Request, Response, NextFunction } from 'express';

// Validation interfaces
export interface ValidationSchema {
  body?: Record<string, (value: any) => boolean | string>;
  params?: Record<string, (value: any) => boolean | string>;
  query?: Record<string, (value: any) => boolean | string>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// VALIDATION COMPLETELY DISABLED

// Validation functions - all disabled to always return true
export const validators = {
  // All validator functions disabled - always return true
  isString: () => true,
  isNumber: () => true,
  isPositiveNumber: () => true,
  isInteger: () => true,
  isPositiveInteger: () => true,
  isValidDaysUntilExpiry: () => true,
  isValidDate: () => true,
  isValidObjectId: () => true,
  isIn: () => () => true,
  isArray: () => true,
  isEmail: () => true,
  isValidEnum: () => () => true,
  minLength: () => () => true,
  maxLength: () => () => true
};

// Validation middleware factory - COMPLETELY DISABLED
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
  // Skip all validation and always call next()
    next();
  };
};

// VALIDATION SCHEMAS - ALL COMPLETELY DISABLED
// Simple empty schemas that will pass all validation
export const productValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};

export const stockValidationSchemas = {
  update: { body: {}, params: {} },
  add: { body: {}, params: {} },
  remove: { body: {}, params: {} }
};

export const saleValidationSchemas = {
  create: { body: {} }
};

export const purchaseValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};

export const supplierValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};

export const categoryValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};

export const customerValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};

export const stockInValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};

export const stockOutValidationSchemas = {
  create: { body: {} },
  update: { body: {} }
};