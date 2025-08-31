import { Router } from 'express';
import routesRouter from './routes.route.js';
import droneRouter from './drones.route.js';

const router = Router();

router.use('/routes', routesRouter);
router.use('/drones', droneRouter);


export default router;
