/**
 * Stage Gate Rules Configuration
 * Defines the validation rules for lifecycle and deal stage transitions
 */

import { StageGateRule } from '../types';
import { LifecycleStage, DealStage } from '../types/hubspot';

/**
 * Lifecycle stage transition rules
 */
export const lifecycleStageRules: StageGateRule[] = [
  {
    id: 'lifecycle-lead-to-mql',
    name: 'Lead to MQL Transition',
    description: 'Requirements for promoting a lead to Marketing Qualified Lead',
    fromStage: LifecycleStage.LEAD,
    toStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
    requiredFields: [
      { field: 'email', label: 'Email', type: 'email', errorMessage: 'Valid email is required' },
      { field: 'firstname', label: 'First Name', type: 'non_empty', errorMessage: 'First name is required' },
      { field: 'lastname', label: 'Last Name', type: 'non_empty', errorMessage: 'Last name is required' },
      { field: 'company', label: 'Company', type: 'non_empty', errorMessage: 'Company name is required' },
    ],
    active: true,
  },
  {
    id: 'lifecycle-mql-to-sql',
    name: 'MQL to SQL Transition',
    description: 'Requirements for promoting an MQL to Sales Qualified Lead',
    fromStage: LifecycleStage.MARKETING_QUALIFIED_LEAD,
    toStage: LifecycleStage.SALES_QUALIFIED_LEAD,
    requiredFields: [
      { field: 'phone', label: 'Phone', type: 'phone', errorMessage: 'Valid phone number is required' },
      { field: 'hubspot_owner_id', label: 'Contact Owner', type: 'required', errorMessage: 'Contact owner must be assigned' },
    ],
    conditions: [
      {
        field: 'hs_lead_status',
        operator: 'exists',
        errorMessage: 'Lead status must be set before SQL promotion',
      },
    ],
    active: true,
  },
  {
    id: 'lifecycle-sql-to-opportunity',
    name: 'SQL to Opportunity Transition',
    description: 'Requirements for promoting an SQL to Opportunity',
    fromStage: LifecycleStage.SALES_QUALIFIED_LEAD,
    toStage: LifecycleStage.OPPORTUNITY,
    requiredFields: [
      { field: 'hubspot_owner_id', label: 'Contact Owner', type: 'required', errorMessage: 'Contact owner must be assigned' },
    ],
    dependencies: [
      {
        type: 'association',
        target: 'deal',
        condition: 'exists',
        errorMessage: 'Contact must be associated with at least one deal',
      },
    ],
    active: true,
  },
  {
    id: 'lifecycle-opportunity-to-customer',
    name: 'Opportunity to Customer Transition',
    description: 'Requirements for converting an Opportunity to Customer',
    fromStage: LifecycleStage.OPPORTUNITY,
    toStage: LifecycleStage.CUSTOMER,
    requiredFields: [],
    dependencies: [
      {
        type: 'association',
        target: 'deal',
        condition: 'closed_won',
        errorMessage: 'Contact must have at least one closed-won deal',
      },
    ],
    active: true,
  },
];

/**
 * Deal stage transition rules
 */
export const dealStageRules: StageGateRule[] = [
  {
    id: 'deal-appointment-to-qualified',
    name: 'Appointment to Qualified Transition',
    description: 'Requirements for moving from Appointment Scheduled to Qualified to Buy',
    fromStage: DealStage.APPOINTMENT_SCHEDULED,
    toStage: DealStage.QUALIFIED_TO_BUY,
    requiredFields: [
      { field: 'dealname', label: 'Deal Name', type: 'non_empty', errorMessage: 'Deal name is required' },
      { field: 'amount', label: 'Deal Amount', type: 'required', errorMessage: 'Deal amount must be set' },
      { field: 'hubspot_owner_id', label: 'Deal Owner', type: 'required', errorMessage: 'Deal owner must be assigned' },
    ],
    active: true,
  },
  {
    id: 'deal-qualified-to-presentation',
    name: 'Qualified to Presentation Transition',
    description: 'Requirements for moving from Qualified to Buy to Presentation Scheduled',
    fromStage: DealStage.QUALIFIED_TO_BUY,
    toStage: DealStage.PRESENTATION_SCHEDULED,
    requiredFields: [
      { field: 'closedate', label: 'Close Date', type: 'required', errorMessage: 'Expected close date must be set' },
    ],
    dependencies: [
      {
        type: 'association',
        target: 'contact',
        condition: 'exists',
        errorMessage: 'Deal must be associated with at least one contact',
      },
    ],
    active: true,
  },
  {
    id: 'deal-presentation-to-decision',
    name: 'Presentation to Decision Maker Transition',
    description: 'Requirements for moving from Presentation Scheduled to Decision Maker Bought In',
    fromStage: DealStage.PRESENTATION_SCHEDULED,
    toStage: DealStage.DECISION_MAKER_BOUGHT_IN,
    requiredFields: [],
    conditions: [
      {
        field: 'amount',
        operator: 'greater_than',
        value: 0,
        errorMessage: 'Deal amount must be greater than zero',
      },
    ],
    active: true,
  },
  {
    id: 'deal-decision-to-contract',
    name: 'Decision Maker to Contract Sent Transition',
    description: 'Requirements for moving from Decision Maker Bought In to Contract Sent',
    fromStage: DealStage.DECISION_MAKER_BOUGHT_IN,
    toStage: DealStage.CONTRACT_SENT,
    requiredFields: [],
    active: true,
  },
  {
    id: 'deal-contract-to-won',
    name: 'Contract Sent to Closed Won Transition',
    description: 'Requirements for closing a deal as won',
    fromStage: DealStage.CONTRACT_SENT,
    toStage: DealStage.CLOSED_WON,
    requiredFields: [
      { field: 'amount', label: 'Deal Amount', type: 'required', errorMessage: 'Final deal amount must be set' },
      { field: 'closedate', label: 'Close Date', type: 'required', errorMessage: 'Close date must be set' },
    ],
    active: true,
  },
];

/**
 * Get all active rules for a specific object type
 */
export function getRulesForObjectType(objectType: 'contact' | 'deal'): StageGateRule[] {
  const rules = objectType === 'contact' ? lifecycleStageRules : dealStageRules;
  return rules.filter((rule) => rule.active);
}

/**
 * Get specific rule by from and to stages
 */
export function getRuleForTransition(
  objectType: 'contact' | 'deal',
  fromStage: string,
  toStage: string
): StageGateRule | undefined {
  const rules = getRulesForObjectType(objectType);
  return rules.find((rule) => rule.fromStage === fromStage && rule.toStage === toStage);
}
