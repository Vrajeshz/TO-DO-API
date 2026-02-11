const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A todo must have a task description"],
      trim: true,
      maxlength: [
        100,
        "A task name must have less or equal than 100 characters",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "Todo_User",
      required: [true, "A todo must belong to a user"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexing for faster searches by user
todoSchema.index({ user: 1 });

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
