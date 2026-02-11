const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Todo_User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const createSendToken = async (user, statusCode, res) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (process.env.JWT_REFRESH_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // Crucial: Prevents Cross-Site Scripting (XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  };

  // Send Refresh Token via Cookie
  res.cookie("jwt", refreshToken, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    status: "success",
    accessToken, // Send Access Token in response body
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await Todo_User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await Todo_User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  await createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new AppError("You are not logged in!", 401));
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await Todo_User.findById(decoded.id).select(
    "+refreshToken",
  );

  if (!currentUser) return next(new AppError("User no longer exists.", 401));

  if (!currentUser.refreshToken) {
    return next(
      new AppError("User recently logged out. Please log in again.", 401),
    );
  }
  req.user = currentUser;
  next();
});

// Restrict to specific roles (e.g., admin)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

exports.refresh = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.jwt;

  if (!refreshToken) {
    return next(
      new AppError("You are not logged in! Please login to get access.", 401),
    );
  }

  const decoded = await promisify(jwt.verify)(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
  );

  const currentUser = await Todo_User.findById(decoded.id).select(
    "+refreshToken",
  );

  if (!currentUser || currentUser.refreshToken !== refreshToken) {
    return next(
      new AppError("The token is no longer valid or has been revoked.", 401),
    );
  }

  const accessToken = jwt.sign(
    { id: currentUser._id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

  res.status(200).json({
    status: "success",
    accessToken,
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  // Use $unset to physically remove the field from the document
  await Todo_User.findByIdAndUpdate(req.user.id, {
    $unset: { refreshToken: 1 },
  });

  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res
    .status(200)
    .json({ status: "success", message: "User logged out successfully" });
});
