/**
 * Timeline Events Service
 * Manages HubSpot timeline events for stage transitions and violations
 */

import { Client } from '@hubspot/api-client';
import { TimelineEvent } from '../types';
import { getAccessToken } from '../services/oauth.service';
import { logger } from '../utils';

// Timeline event template IDs (configured in HubSpot app)
export const TIMELINE_EVENT_TEMPLATES = {
  STAGE_TRANSITION: 'stage_transition',
  VALIDATION_FAILED: 'validation_failed',
  VALIDATION_PASSED: 'validation_passed',
  COMPLIANCE_ALERT: 'compliance_alert',
} as const;

/**
 * Create a timeline event in HubSpot
 */
export async function createTimelineEvent(
  portalId: number,
  appId: number,
  eventTemplateId: string,
  event: Omit<TimelineEvent, 'eventTemplateId'>
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken(portalId);
    if (!accessToken) {
      logger.warn('Cannot create timeline event: No access token', { portalId });
      return false;
    }

    const client = new Client({ accessToken });

    await client.crm.timeline.eventsApi.create({
      eventTemplateId: `${appId}-${eventTemplateId}`,
      objectId: event.objectId,
      tokens: event.tokens,
      extraData: event.extraData,
    });

    logger.info('Timeline event created', {
      portalId,
      eventTemplateId,
      objectId: event.objectId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to create timeline event', {
      portalId,
      eventTemplateId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Record a stage transition event
 */
export async function recordStageTransition(
  portalId: number,
  appId: number,
  objectType: 'contact' | 'deal',
  objectId: string,
  fromStage: string,
  toStage: string,
  userId: string,
  validationPassed: boolean
): Promise<boolean> {
  const templateId = validationPassed
    ? TIMELINE_EVENT_TEMPLATES.VALIDATION_PASSED
    : TIMELINE_EVENT_TEMPLATES.VALIDATION_FAILED;

  return createTimelineEvent(portalId, appId, templateId, {
    objectId,
    tokens: {
      objectType,
      fromStage,
      toStage,
      userId,
      timestamp: new Date().toISOString(),
      status: validationPassed ? 'Passed' : 'Failed',
    },
    extraData: {
      validationPassed,
    },
  });
}

/**
 * Record a validation failure event
 */
export async function recordValidationFailure(
  portalId: number,
  appId: number,
  objectType: 'contact' | 'deal',
  objectId: string,
  errors: string[],
  userId: string
): Promise<boolean> {
  return createTimelineEvent(portalId, appId, TIMELINE_EVENT_TEMPLATES.VALIDATION_FAILED, {
    objectId,
    tokens: {
      objectType,
      errorCount: errors.length.toString(),
      errors: errors.slice(0, 5).join('; '), // Limit to first 5 errors
      userId,
      timestamp: new Date().toISOString(),
    },
    extraData: {
      allErrors: errors,
    },
  });
}

/**
 * Record a compliance alert event
 */
export async function recordComplianceAlert(
  portalId: number,
  appId: number,
  objectType: 'contact' | 'deal',
  objectId: string,
  alertType: string,
  alertMessage: string,
  userId: string
): Promise<boolean> {
  return createTimelineEvent(portalId, appId, TIMELINE_EVENT_TEMPLATES.COMPLIANCE_ALERT, {
    objectId,
    tokens: {
      objectType,
      alertType,
      alertMessage,
      userId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Build timeline event payload for API call
 */
export function buildTimelineEventPayload(
  appId: number,
  eventTemplateId: string,
  objectId: string,
  tokens: Record<string, string>,
  extraData?: Record<string, unknown>
): {
  eventTemplateId: string;
  objectId: string;
  tokens: Record<string, string>;
  extraData?: Record<string, unknown>;
} {
  return {
    eventTemplateId: `${appId}-${eventTemplateId}`,
    objectId,
    tokens,
    extraData,
  };
}
