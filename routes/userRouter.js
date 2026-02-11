const express = require("express");
const authController = require("../controller/authController");
const validate = require('../utils/validate');
const { signupSchema, loginSchema } = require('../utils/schemas');

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);

router.get('/refresh', authController.refresh);
router.post('/logout', authController.protect, authController.logout);

module.exports = router;
