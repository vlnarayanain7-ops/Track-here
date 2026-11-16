import { Router } from 'express';
import {
  getRewardsMe,
  submitProof,
  claimSurprise,
  updateCertificatePreferences,
} from '../controllers/rewardsController.js';
import auth from '../middleware/auth.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.get('/me', getRewardsMe);
router.post('/proof', submitProof);
router.post('/claim', claimSurprise);
router.patch('/certificate', updateCertificatePreferences);

export default router;
