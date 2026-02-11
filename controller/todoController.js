const Todo = require("../models/todoModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 1. GET ALL TODOS
exports.getAllTodos = catchAsync(async (req, res, next) => {
  const todos = await Todo.find({ user: req.user.id });

  res.status(200).json({
    status: "success",
    results: todos.length,
    data: { todos },
  });
});

// 2. GET SINGLE TODO BY ID
exports.getTodo = catchAsync(async (req, res, next) => {
  // We check both the ID and that it belongs to the logged-in user
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });

  if (!todo) {
    return next(new AppError("No todo found with that ID belonging to you", 404));
  }

  res.status(200).json({
    status: "success",
    data: { todo },
  });
});

// 3. CREATE TODO
exports.createTodo = catchAsync(async (req, res, next) => {
  const newTodo = await Todo.create({
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    status: req.body.status,
    dueDate: req.body.dueDate,
    user: req.user.id,
  });

  res.status(201).json({
    status: "success",
    data: { todo: newTodo },
  });
});

// 4. UPDATE TODO
exports.updateTodo = catchAsync(async (req, res, next) => {
  const filteredBody = { ...req.body };
  delete filteredBody.user;

  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    filteredBody,
    { new: true, runValidators: true }
  );

  if (!todo) {
    return next(new AppError("No todo found with that ID belonging to you", 404));
  }

  res.status(200).json({ status: "success", data: { todo } });
});

// 5. DELETE TODO
exports.deleteTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!todo) {
    return next(new AppError("No todo found with that ID belonging to you", 404));
  }

  res.status(204).json({ status: "success", data: null });
});