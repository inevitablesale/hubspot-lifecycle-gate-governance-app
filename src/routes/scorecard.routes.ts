/**
 * Scorecard Routes
 */

import { Router, Request, Response } from 'express';
import {
  getScorecard,
  getAllScorecards,
  getUserViolations,
  resolveViolation,
  getOrCreateScorecard,
} from '../services/scorecard.service';
import { generateScorecardCard } from '../crm-cards';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * Get scorecard for a user
 */
router.get('/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  const scorecard = getScorecard(userId);

  if (!scorecard) {
    res.status(404).json({
      error: 'Scorecard not found',
      message: 'No scorecard found for this user',
    });
    return;
  }

  res.json({
    success: true,
    scorecard,
  });
});

/**
 * Get scorecard CRM card format
 */
router.get('/:userId/card', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userName = (req.query.userName as string) || userId;

  const scorecard = getOrCreateScorecard(userId, userName);
  const card = generateScorecardCard(scorecard);

  res.json(card);
});

/**
 * Get all scorecards (admin)
 */
router.get('/', (_req: Request, res: Response) => {
  const scorecards = getAllScorecards();

  res.json({
    success: true,
    count: scorecards.length,
    scorecards,
  });
});

/**
 * Get user violations
 */
router.get(
  '/:userId/violations',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined;
    const objectType = req.query.objectType as 'contact' | 'deal' | undefined;
    const limit = parseInt(req.query.limit as string, 10) || undefined;

    const violations = getUserViolations(userId, {
      resolved,
      objectType,
      limit,
    });

    res.json({
      success: true,
      count: violations.length,
      violations,
    });
  })
);

/**
 * Resolve a violation
 */
router.post('/:userId/violations/:violationId/resolve', (req: Request, res: Response) => {
  const { userId, violationId } = req.params;

  const success = resolveViolation(userId, violationId);

  if (!success) {
    res.status(404).json({
      error: 'Violation not found',
      message: 'Could not find the specified violation',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Violation resolved',
  });
});

/**
 * Get leaderboard (top performers)
 */
router.get('/leaderboard/top', (_req: Request, res: Response) => {
  const scorecards = getAllScorecards();

  const leaderboard = scorecards
    .sort((a, b) => b.complianceScore - a.complianceScore)
    .slice(0, 10)
    .map((s, index) => ({
      rank: index + 1,
      userId: s.userId,
      userName: s.userName,
      complianceScore: Math.round(s.complianceScore),
      validTransitions: s.metrics.validTransitions,
      trend: s.trend,
    }));

  res.json({
    success: true,
    leaderboard,
  });
});

export default router;
