/**
 * CRM Card Routes
 */

import { Router, Request, Response } from 'express';
import {
  generateContactGovernanceCard,
  generateDealGovernanceCard,
  generateEmptyCard,
} from '../crm-cards';
import { validateAllRules } from '../validation';
import { CRMCardRequest, Contact, Deal, ContactProperties } from '../types';
import { asyncHandler } from '../middleware';
import { logger } from '../utils';

const router = Router();

/**
 * Contact governance CRM card
 */
router.get(
  '/contact',
  asyncHandler(async (req: Request, res: Response) => {
    const portalId = parseInt(req.query.portalId as string, 10);
    const contactId = req.query.associatedObjectId as string;

    if (!portalId || !contactId) {
      res.json(generateEmptyCard('Missing required parameters'));
      return;
    }

    // In production, fetch actual contact data from HubSpot
    // For now, use query params to simulate
    const mockContact: Contact = {
      id: contactId,
      properties: {
        firstname: req.query.firstname as string | undefined,
        lastname: req.query.lastname as string | undefined,
        email: req.query.email as string | undefined,
        phone: req.query.phone as string | undefined,
        company: req.query.company as string | undefined,
        lifecyclestage: (req.query.lifecyclestage as string | undefined) as ContactProperties['lifecyclestage'],
        hubspot_owner_id: req.query.hubspot_owner_id as string | undefined,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    };

    const validationResult = validateAllRules('contact', mockContact.properties);

    const cardRequest: CRMCardRequest = {
      portalId,
      userId: parseInt(req.query.userId as string, 10) || 0,
      userEmail: (req.query.userEmail as string) || '',
      associatedObjectId: parseInt(contactId, 10),
      associatedObjectType: 'CONTACT',
      objectTypeId: '0-1',
    };

    const card = generateContactGovernanceCard(cardRequest, mockContact, validationResult);

    logger.info('Contact CRM card generated', { portalId, contactId });

    res.json(card);
  })
);

/**
 * Deal governance CRM card
 */
router.get(
  '/deal',
  asyncHandler(async (req: Request, res: Response) => {
    const portalId = parseInt(req.query.portalId as string, 10);
    const dealId = req.query.associatedObjectId as string;

    if (!portalId || !dealId) {
      res.json(generateEmptyCard('Missing required parameters'));
      return;
    }

    // In production, fetch actual deal data from HubSpot
    const mockDeal: Deal = {
      id: dealId,
      properties: {
        dealname: req.query.dealname as string,
        amount: req.query.amount as string,
        dealstage: req.query.dealstage as string,
        pipeline: req.query.pipeline as string,
        closedate: req.query.closedate as string,
        hubspot_owner_id: req.query.hubspot_owner_id as string,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    };

    const validationResult = validateAllRules('deal', mockDeal.properties);

    const cardRequest: CRMCardRequest = {
      portalId,
      userId: parseInt(req.query.userId as string, 10) || 0,
      userEmail: (req.query.userEmail as string) || '',
      associatedObjectId: parseInt(dealId, 10),
      associatedObjectType: 'DEAL',
      objectTypeId: '0-3',
    };

    const card = generateDealGovernanceCard(cardRequest, mockDeal, validationResult);

    logger.info('Deal CRM card generated', { portalId, dealId });

    res.json(card);
  })
);

/**
 * Contact details iframe endpoint
 */
router.get('/contact/:contactId/details', (req: Request, res: Response) => {
  const { contactId } = req.params;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Contact Governance Details</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f8fa;
          }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          h1 { color: #33475b; font-size: 20px; }
          .section { margin: 20px 0; }
          .label { color: #516f90; font-size: 12px; text-transform: uppercase; }
          .value { color: #33475b; font-size: 14px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Governance Details</h1>
          <p>Contact ID: ${contactId}</p>
          <div class="section">
            <div class="label">Stage Gate Status</div>
            <div class="value">Review the contact record for detailed validation status.</div>
          </div>
        </div>
      </body>
    </html>
  `);
});

/**
 * Deal details iframe endpoint
 */
router.get('/deal/:dealId/details', (req: Request, res: Response) => {
  const { dealId } = req.params;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Deal Governance Details</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f8fa;
          }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          h1 { color: #33475b; font-size: 20px; }
          .section { margin: 20px 0; }
          .label { color: #516f90; font-size: 12px; text-transform: uppercase; }
          .value { color: #33475b; font-size: 14px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Deal Governance Details</h1>
          <p>Deal ID: ${dealId}</p>
          <div class="section">
            <div class="label">Stage Gate Status</div>
            <div class="value">Review the deal record for detailed validation status.</div>
          </div>
        </div>
      </body>
    </html>
  `);
});

export default router;
