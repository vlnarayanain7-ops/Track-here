import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  renameSubject,
  updateSettings,
  changePassword,
  exportData,
  importData,
  deleteAccount,
  acceptTerms,
  updateProfileSchema,
  renameSubjectSchema,
  updateSettingsSchema,
  changePasswordSchema,
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import csrfProtection from '../middleware/csrf.js';

const router = Router();

router.use(auth);
router.use(csrfProtection);

router.post('/accept-terms', acceptTerms);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.post('/subjects/rename', validate(renameSubjectSchema), renameSubject);
router.put('/password', validate(changePasswordSchema), changePassword);
router.get('/settings', getProfile);
router.put('/settings', validate(updateSettingsSchema), updateSettings);

// Canonical Data & Account Lifecycle Routes (Strict single routes)
router.get('/me/export', exportData);
router.post('/me/restore', importData);
router.delete('/me', deleteAccount);

export default router;

