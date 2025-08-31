import { Router } from 'express';
import routesRouter from './routes.js';
import droneRouter from './drones.js';

const router = Router();

router.use('/routes', routesRouter);
router.use('/drones', droneRouter);


export default router;
