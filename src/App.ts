import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initDB } from "./db";
import morgan from "morgan";
import AppRoot from "./routes"

dotenv.config();

const app = express();
const PORT = 5000;


initDB()
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

morgan.token("origin", (req: Request) => req.get("origin") || "unknown");
morgan.token("ip", (req: Request) => req.ip || "unknown");

const morganFormat = ':ip :method :url :status :res[content-length] - :response-time ms - :origin';

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use(morgan(morganFormat));
} else {
  app.use(morgan('combined'));
}


app.use(
  cors({
    origin: ["http://localhost:5174"],
    credentials: true,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    exposedHeaders: "Authorization",
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(compression());


app.use("/api/v1", AppRoot);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});