"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockOutValidationSchemas = exports.stockInValidationSchemas = exports.customerValidationSchemas = exports.categoryValidationSchemas = exports.supplierValidationSchemas = exports.purchaseValidationSchemas = exports.saleValidationSchemas = exports.stockValidationSchemas = exports.productValidationSchemas = exports.validate = exports.validators = void 0;
// VALIDATION COMPLETELY DISABLED
// Validation functions - all disabled to always return true
exports.validators = {
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
const validate = (schema) => {
    return (req, res, next) => {
        // Skip all validation and always call next()
        next();
    };
};
exports.validate = validate;
// VALIDATION SCHEMAS - ALL COMPLETELY DISABLED
// Simple empty schemas that will pass all validation
exports.productValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
exports.stockValidationSchemas = {
    update: { body: {}, params: {} },
    add: { body: {}, params: {} },
    remove: { body: {}, params: {} }
};
exports.saleValidationSchemas = {
    create: { body: {} }
};
exports.purchaseValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
exports.supplierValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
exports.categoryValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
exports.customerValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
exports.stockInValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
exports.stockOutValidationSchemas = {
    create: { body: {} },
    update: { body: {} }
};
