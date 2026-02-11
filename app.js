const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const globalErrorHandler = require("./controller/errorController");
const AppError = require("./utils/appError");
const todoRouter = require("./routes/todoRouter");
const userRouter = require("./routes/userRouter");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// 1) Set security HTTP headers
app.use(helmet());

// 2) Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 3) Limit requests from same IP
const limiter = rateLimit({
  max: 50,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// 4) Body parser, reading data into req.body
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/todos", todoRouter);

app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
