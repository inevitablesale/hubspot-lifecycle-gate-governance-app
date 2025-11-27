/**
 * Validation Routes
 */

import { Router, Request, Response } from 'express';
import { validateStageTransition, getValidationRules } from '../validation';
import { ValidationRequest } from '../types';
import { asyncHandler } from '../middleware';
import { logger } from '../utils';
import { recordStageTransition } from '../services/scorecard.service';
import { createAlertFromViolation } from '../alerts';

const router = Router();

/**
 * Validate a stage transition
 */
router.post(
  '/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      objectType,
      objectId,
      currentStage,
      targetStage,
      properties,
      userId,
      portalId,
    } = req.body;

    // Validate required fields
    if (!objectType || !objectId || !currentStage || !targetStage || !properties) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['objectType', 'objectId', 'currentStage', 'targetStage', 'properties'],
      });
      return;
    }

    // Validate object type
    if (objectType !== 'contact' && objectType !== 'deal') {
      res.status(400).json({
        error: 'Invalid object type',
        message: 'objectType must be "contact" or "deal"',
      });
      return;
    }

    const request: ValidationRequest = {
      objectType,
      objectId,
      currentStage,
      targetStage,
      properties,
      userId,
    };

    const result = validateStageTransition(request);

    // Record in scorecard if userId provided
    if (userId && portalId) {
      const userName = req.body.userName || userId;

      recordStageTransition(
        userId,
        userName,
        objectType,
        objectId,
        currentStage,
        targetStage,
        result.isValid,
        result.errors.map((e) => e.field).filter(Boolean) as string[],
        result.errors.length > 0 ? 'validation-error' : undefined,
        result.errors.length > 0 ? 'Validation Failed' : undefined
      );

      // Create alert for violations
      if (!result.isValid && result.errors.length > 0) {
        createAlertFromViolation(
          portalId,
          {
            id: `${Date.now()}`,
            timestamp: new Date(),
            objectType,
            objectId,
            violationType: 'missing_required_field',
            fromStage: currentStage,
            toStage: targetStage,
            missingFields: result.errors.map((e) => e.field).filter(Boolean) as string[],
            ruleId: 'validation',
            ruleName: 'Stage Transition Validation',
            severity: result.errors.length > 2 ? 'high' : 'medium',
            resolved: false,
          },
          userId
        );
      }
    }

    logger.info('Validation completed', {
      objectType,
      objectId,
      isValid: result.isValid,
      errorCount: result.errors.length,
    });

    res.json({
      success: true,
      result,
    });
  })
);

/**
 * Get validation rules for an object type
 */
router.get('/rules/:objectType', (req: Request, res: Response) => {
  const { objectType } = req.params;

  if (objectType !== 'contact' && objectType !== 'deal') {
    res.status(400).json({
      error: 'Invalid object type',
      message: 'objectType must be "contact" or "deal"',
    });
    return;
  }

  const rules = getValidationRules(objectType);

  res.json({
    objectType,
    rules,
    count: rules.length,
  });
});

/**
 * Batch validate multiple transitions
 */
router.post(
  '/validate/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const { requests } = req.body;

    if (!Array.isArray(requests)) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'requests must be an array',
      });
      return;
    }

    if (requests.length > 100) {
      res.status(400).json({
        error: 'Too many requests',
        message: 'Maximum 100 requests per batch',
      });
      return;
    }

    const results = requests.map((request: ValidationRequest) => ({
      objectId: request.objectId,
      result: validateStageTransition(request),
    }));

    const validCount = results.filter((r) => r.result.isValid).length;

    res.json({
      success: true,
      total: results.length,
      valid: validCount,
      invalid: results.length - validCount,
      results,
    });
  })
);

export default router;
