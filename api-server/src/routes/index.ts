import { Router, type IRouter } from "express";
import healthRouter from "./health";
import expensesRouter from "./expenses";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(expensesRouter);
router.use(settingsRouter);

export default router;
