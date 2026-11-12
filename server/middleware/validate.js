import ApiError from '../utils/ApiError.js';

/**
 * Zod validation middleware factory.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Where to pull data from
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', errors));
    }

    // Replace the source data with parsed (and transformed) data
    req[source] = result.data;
    next();
  };
};

export default validate;
