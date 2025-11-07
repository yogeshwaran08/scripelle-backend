import { Router } from "express";
import { pingPong } from "../controllers/tester";
import authRoutes from "./auth.routes";
import { generateText } from "../controllers/Generator";
import AIRoutes from "./ai.routes";
import documentRoutes from "./document.routes";
import autocompletionRoutes from "./autocompletion.routes";

const AppRoot = Router();

AppRoot.get("/ping", pingPong);

AppRoot.use("/auth", authRoutes);
AppRoot.use("/ai/", AIRoutes);
AppRoot.use("/documents", documentRoutes);
AppRoot.use("/autocompletion", autocompletionRoutes);


export default AppRoot;