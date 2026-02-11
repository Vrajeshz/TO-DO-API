const { ZodError } = require("zod");
const AppError = require("./appError");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.errors
        .map((i) => {
          const field = i.path[1] || i.path[0];
          return `${field}: ${i.message}`;
        })
        .join(", ");
      return next(new AppError(message, 400));
    }

    // If it's some other error, pass it to the global error handler
    next(err);
  }
};

module.exports = validate;