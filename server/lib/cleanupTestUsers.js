import mongoose from 'mongoose';
import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Revision from '../models/Revision.js';
import Problem from '../models/Problem.js';
import ProblemAttempt from '../models/ProblemAttempt.js';
import DailyPlan from '../models/DailyPlan.js';
import DailyReview from '../models/DailyReview.js';
import MockTest from '../models/MockTest.js';
import TimetableSlot from '../models/TimetableSlot.js';
import RefreshSession from '../models/RefreshSession.js';
import PushSubscription from '../models/PushSubscription.js';
import Feedback from '../models/Feedback.js';
import { DailyTotal, Certificate, Proof, ProofHash, Claim, DailyReport } from '../models/rewards.js';

/**
 * Patterns matching fake/test accounts created during testing
 */
export const TEST_EMAIL_REGEX = /(@trackhere\.test|@trackhere\.dev|@example\.com|ravi@nmtl\.gov\.in|@test\.com|test_|_test_|usera_|userb_|prod_a_|prod_b_|no_csrf_|hacker@|teen_|adult_|u13_|kolkata_|la_|wanderer_)/i;

/**
 * Deletes all fake / test users and all their associated records from the database immediately.
 * @param {Array<string>} [specificUserIds] Optional list of user IDs to clean up explicitly.
 * @returns {Promise<{ deletedUsersCount: number }>}
 */
export async function cleanupTestUsers(specificUserIds = null) {
  let query = {};

  if (Array.isArray(specificUserIds) && specificUserIds.length > 0) {
    query = { _id: { $in: specificUserIds } };
  } else {
    query = { email: { $regex: TEST_EMAIL_REGEX } };
  }

  const testUsers = await User.find(query).select('_id email').lean();
  if (testUsers.length === 0) {
    return { deletedUsersCount: 0 };
  }

  const ids = testUsers.map((u) => u._id);

  await Promise.allSettled([
    User.deleteMany({ _id: { $in: ids } }),
    StudySession.deleteMany({ user: { $in: ids } }),
    Task.deleteMany({ user: { $in: ids } }),
    Note.deleteMany({ user: { $in: ids } }),
    Revision.deleteMany({ user: { $in: ids } }),
    Problem.deleteMany({ user: { $in: ids } }),
    ProblemAttempt.deleteMany({ user: { $in: ids } }),
    DailyPlan.deleteMany({ user: { $in: ids } }),
    DailyReview.deleteMany({ user: { $in: ids } }),
    MockTest.deleteMany({ user: { $in: ids } }),
    TimetableSlot.deleteMany({ user: { $in: ids } }),
    RefreshSession.deleteMany({ user: { $in: ids } }),
    PushSubscription.deleteMany({ user: { $in: ids } }),
    Feedback.deleteMany({ user: { $in: ids } }),
    DailyTotal.deleteMany({ user: { $in: ids } }),
    Certificate.deleteMany({ user: { $in: ids } }),
    Proof.deleteMany({ user: { $in: ids } }),
    Claim.deleteMany({ user: { $in: ids } }),
    DailyReport.deleteMany({ user: { $in: ids } }),
  ]);

  return { deletedUsersCount: testUsers.length };
}

export default cleanupTestUsers;
