const express = require("express");
const todoController = require("../controller/todoController");
const authController = require("../controller/authController");

const { createTodoSchema, updateTodoSchema } = require("../utils/schemas");
const validate = require("../utils/validate");

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router
  .route("/")
  .get(todoController.getAllTodos)
  .post(validate(createTodoSchema), todoController.createTodo); // Use Create Schema

router
  .route("/:id")
  .get(todoController.getTodo)
  .patch(validate(updateTodoSchema), todoController.updateTodo) // Use Update Schema
  .delete(todoController.deleteTodo);

module.exports = router;
