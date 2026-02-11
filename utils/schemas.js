const { z } = require("zod");

// Base schema for todo fields
const todoBodySchema = z.object({
  title: z.string().min(3, "Task name must be at least 3 characters").trim(),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
});

// CREATE → task required
const createTodoSchema = z.object({
  body: todoBodySchema,
});

// UPDATE → everything optional
const updateTodoSchema = z.object({
  body: todoBodySchema.partial(),
});

module.exports = {
  signupSchema: z.object({
    body: z.object({
      name: z.string().min(2, "Name is too short").trim(),
      email: z.string().email("Invalid email address").trim(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      passwordConfirm: z.string(),
    }).refine((data) => data.password === data.passwordConfirm, {
      message: "Passwords don't match",
      path: ["passwordConfirm"],
    }),
  }),

  loginSchema: z.object({
    body: z.object({
      email: z.string().email("Invalid email address").trim(),
      password: z.string().min(1, "Password is required"),
    }),
  }),

  createTodoSchema,
  updateTodoSchema,
};
