/**
 * HubSpot Lifecycle and Deal Stage Types
 */

// Lifecycle stages in HubSpot
export enum LifecycleStage {
  SUBSCRIBER = 'subscriber',
  LEAD = 'lead',
  MARKETING_QUALIFIED_LEAD = 'marketingqualifiedlead',
  SALES_QUALIFIED_LEAD = 'salesqualifiedlead',
  OPPORTUNITY = 'opportunity',
  CUSTOMER = 'customer',
  EVANGELIST = 'evangelist',
  OTHER = 'other',
}

// Deal stages (customizable per pipeline)
export enum DealStage {
  APPOINTMENT_SCHEDULED = 'appointmentscheduled',
  QUALIFIED_TO_BUY = 'qualifiedtobuy',
  PRESENTATION_SCHEDULED = 'presentationscheduled',
  DECISION_MAKER_BOUGHT_IN = 'decisionmakerboughtin',
  CONTRACT_SENT = 'contractsent',
  CLOSED_WON = 'closedwon',
  CLOSED_LOST = 'closedlost',
}

// Stage order for validation (lower = earlier in pipeline)
export const LIFECYCLE_STAGE_ORDER: Record<LifecycleStage, number> = {
  [LifecycleStage.SUBSCRIBER]: 0,
  [LifecycleStage.LEAD]: 1,
  [LifecycleStage.MARKETING_QUALIFIED_LEAD]: 2,
  [LifecycleStage.SALES_QUALIFIED_LEAD]: 3,
  [LifecycleStage.OPPORTUNITY]: 4,
  [LifecycleStage.CUSTOMER]: 5,
  [LifecycleStage.EVANGELIST]: 6,
  [LifecycleStage.OTHER]: 7,
};

export const DEAL_STAGE_ORDER: Record<DealStage, number> = {
  [DealStage.APPOINTMENT_SCHEDULED]: 0,
  [DealStage.QUALIFIED_TO_BUY]: 1,
  [DealStage.PRESENTATION_SCHEDULED]: 2,
  [DealStage.DECISION_MAKER_BOUGHT_IN]: 3,
  [DealStage.CONTRACT_SENT]: 4,
  [DealStage.CLOSED_WON]: 5,
  [DealStage.CLOSED_LOST]: 6,
};

// Contact properties
export interface ContactProperties {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  company?: string;
  lifecyclestage?: LifecycleStage;
  hs_lead_status?: string;
  hubspot_owner_id?: string;
  [key: string]: string | undefined;
}

// Deal properties
export interface DealProperties {
  dealname?: string;
  amount?: string;
  dealstage?: DealStage | string;
  pipeline?: string;
  closedate?: string;
  hubspot_owner_id?: string;
  hs_deal_stage_probability?: string;
  [key: string]: string | undefined;
}

// Generic HubSpot object
export interface HubSpotObject<T> {
  id: string;
  properties: T;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export type Contact = HubSpotObject<ContactProperties>;
export type Deal = HubSpotObject<DealProperties>;
