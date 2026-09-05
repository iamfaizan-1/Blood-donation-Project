import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';

const router = Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

export default router;
