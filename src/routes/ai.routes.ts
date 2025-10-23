import { Router } from "express";
import { generateText } from "../controllers/Generator";

const routes = Router() ;

routes.post("/generate-text", generateText);

export default routes;