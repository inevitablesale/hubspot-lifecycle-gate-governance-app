/**
 * Alert Routes
 */

import { Router, Request, Response } from 'express';
import {
  getPortalAlerts,
  getUserAlerts,
  getAlert,
  acknowledgeAlert,
  getUnacknowledgedAlertCount,
} from '../alerts';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * Get alerts for a portal
 */
router.get(
  '/portal/:portalId',
  asyncHandler(async (req: Request, res: Response) => {
    const portalId = parseInt(req.params.portalId, 10);

    if (isNaN(portalId)) {
      res.status(400).json({ error: 'Invalid portal ID' });
      return;
    }

    const acknowledged =
      req.query.acknowledged === 'true'
        ? true
        : req.query.acknowledged === 'false'
        ? false
        : undefined;
    const severity = req.query.severity as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || undefined;

    const alerts = getPortalAlerts(portalId, {
      acknowledged,
      severity,
      limit,
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  })
);

/**
 * Get alerts for a user
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const acknowledged =
      req.query.acknowledged === 'true'
        ? true
        : req.query.acknowledged === 'false'
        ? false
        : undefined;
    const limit = parseInt(req.query.limit as string, 10) || undefined;

    const alerts = getUserAlerts(userId, {
      acknowledged,
      limit,
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  })
);

/**
 * Get unacknowledged alert count for a user
 */
router.get('/user/:userId/count', (req: Request, res: Response) => {
  const { userId } = req.params;
  const count = getUnacknowledgedAlertCount(userId);

  res.json({
    success: true,
    count,
  });
});

/**
 * Get a specific alert
 */
router.get('/:alertId', (req: Request, res: Response) => {
  const { alertId } = req.params;
  const alert = getAlert(alertId);

  if (!alert) {
    res.status(404).json({
      error: 'Alert not found',
    });
    return;
  }

  res.json({
    success: true,
    alert,
  });
});

/**
 * Acknowledge an alert
 */
router.post('/:alertId/acknowledge', (req: Request, res: Response) => {
  const { alertId } = req.params;
  const { acknowledgedBy } = req.body;

  if (!acknowledgedBy) {
    res.status(400).json({
      error: 'acknowledgedBy is required',
    });
    return;
  }

  const success = acknowledgeAlert(alertId, acknowledgedBy);

  if (!success) {
    res.status(404).json({
      error: 'Alert not found',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Alert acknowledged',
  });
});

export default router;
