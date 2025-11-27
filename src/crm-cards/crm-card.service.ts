/**
 * CRM Card Service
 * Generates CRM card responses for HubSpot UI Extensions
 */

import {
  CRMCardResponse,
  CRMCardSection,
  CRMCardProperty,
  CRMCardRequest,
  ValidationResult,
  Contact,
  Deal,
  RepScorecard,
} from '../types';
import config from '../config';

/**
 * Generate contact governance card
 */
export function generateContactGovernanceCard(
  request: CRMCardRequest,
  contact: Contact,
  validationResult: ValidationResult
): CRMCardResponse {
  const properties: CRMCardProperty[] = [];

  // Current lifecycle stage
  properties.push({
    label: 'Lifecycle Stage',
    dataType: 'STATUS',
    value: contact.properties.lifecyclestage || 'Not Set',
  });

  // Compliance status
  const complianceStatus =
    validationResult.errors.length === 0 ? 'Compliant' : `${validationResult.errors.length} Issues`;
  properties.push({
    label: 'Compliance Status',
    dataType: 'STATUS',
    value: complianceStatus,
  });

  // Missing fields count
  const missingFieldsCount = validationResult.warnings.length;
  properties.push({
    label: 'Potential Issues',
    dataType: 'NUMBER',
    value: missingFieldsCount,
  });

  // Owner
  if (contact.properties.hubspot_owner_id) {
    properties.push({
      label: 'Owner Assigned',
      dataType: 'STATUS',
      value: 'Yes',
    });
  }

  const sections: CRMCardSection[] = [
    {
      objectId: parseInt(contact.id, 10),
      title: 'Governance Status',
      properties,
      actions: [
        {
          type: 'IFRAME',
          width: 600,
          height: 400,
          uri: `${config.baseUrl}/crm-cards/contact/${contact.id}/details`,
          label: 'View Details',
        },
      ],
    },
  ];

  // Add warnings section if there are issues
  if (validationResult.warnings.length > 0) {
    const warningProperties: CRMCardProperty[] = validationResult.warnings
      .slice(0, 5)
      .map((warning, index) => ({
        label: `Issue ${index + 1}`,
        dataType: 'STRING' as const,
        value: warning.message,
      }));

    sections.push({
      objectId: parseInt(contact.id, 10) + 1,
      title: 'Stage Gate Warnings',
      properties: warningProperties,
    });
  }

  return {
    results: sections,
    primaryAction: {
      type: 'IFRAME',
      width: 800,
      height: 600,
      uri: `${config.baseUrl}/crm-cards/contact/${contact.id}/validate`,
      label: 'Validate Stage Progression',
    },
  };
}

/**
 * Generate deal governance card
 */
export function generateDealGovernanceCard(
  request: CRMCardRequest,
  deal: Deal,
  validationResult: ValidationResult
): CRMCardResponse {
  const properties: CRMCardProperty[] = [];

  // Current deal stage
  properties.push({
    label: 'Deal Stage',
    dataType: 'STATUS',
    value: deal.properties.dealstage || 'Not Set',
  });

  // Deal amount
  if (deal.properties.amount) {
    properties.push({
      label: 'Amount',
      dataType: 'CURRENCY',
      value: deal.properties.amount,
    });
  }

  // Compliance status
  const complianceStatus =
    validationResult.errors.length === 0 ? 'Compliant' : `${validationResult.errors.length} Issues`;
  properties.push({
    label: 'Compliance Status',
    dataType: 'STATUS',
    value: complianceStatus,
  });

  // Close date
  if (deal.properties.closedate) {
    properties.push({
      label: 'Close Date',
      dataType: 'DATE',
      value: deal.properties.closedate,
    });
  }

  const sections: CRMCardSection[] = [
    {
      objectId: parseInt(deal.id, 10),
      title: 'Deal Governance',
      properties,
      actions: [
        {
          type: 'IFRAME',
          width: 600,
          height: 400,
          uri: `${config.baseUrl}/crm-cards/deal/${deal.id}/details`,
          label: 'View Details',
        },
      ],
    },
  ];

  // Add validation issues section
  if (validationResult.warnings.length > 0) {
    const warningProperties: CRMCardProperty[] = validationResult.warnings
      .slice(0, 5)
      .map((warning, index) => ({
        label: `Issue ${index + 1}`,
        dataType: 'STRING' as const,
        value: warning.message,
      }));

    sections.push({
      objectId: parseInt(deal.id, 10) + 1,
      title: 'Stage Gate Warnings',
      properties: warningProperties,
    });
  }

  return {
    results: sections,
    primaryAction: {
      type: 'IFRAME',
      width: 800,
      height: 600,
      uri: `${config.baseUrl}/crm-cards/deal/${deal.id}/validate`,
      label: 'Validate Stage Progression',
    },
  };
}

/**
 * Generate rep scorecard card
 */
export function generateScorecardCard(scorecard: RepScorecard): CRMCardResponse {
  const properties: CRMCardProperty[] = [
    {
      label: 'Compliance Score',
      dataType: 'NUMBER',
      value: `${Math.round(scorecard.complianceScore)}%`,
    },
    {
      label: 'Valid Transitions',
      dataType: 'NUMBER',
      value: scorecard.metrics.validTransitions,
    },
    {
      label: 'Invalid Attempts',
      dataType: 'NUMBER',
      value: scorecard.metrics.invalidAttempts,
    },
    {
      label: 'Field Compliance',
      dataType: 'NUMBER',
      value: `${Math.round(scorecard.metrics.requiredFieldsCompliance)}%`,
    },
    {
      label: 'Trend',
      dataType: 'STATUS',
      value: scorecard.trend.charAt(0).toUpperCase() + scorecard.trend.slice(1),
    },
  ];

  return {
    results: [
      {
        objectId: 1,
        title: `${scorecard.userName}'s Scorecard`,
        properties,
        link: `${config.baseUrl}/scorecards/${scorecard.userId}`,
        linkLabel: 'View Full Scorecard',
      },
    ],
  };
}

/**
 * Generate empty/error card
 */
export function generateEmptyCard(message: string): CRMCardResponse {
  return {
    results: [
      {
        objectId: 1,
        title: 'Governance',
        properties: [
          {
            label: 'Status',
            dataType: 'STRING',
            value: message,
          },
        ],
      },
    ],
  };
}
