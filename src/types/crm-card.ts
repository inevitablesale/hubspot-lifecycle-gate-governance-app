/**
 * CRM Card Types for HubSpot UI Extensions
 */

export interface CRMCardResponse {
  results: CRMCardSection[];
  primaryAction?: CRMCardAction;
  secondaryActions?: CRMCardAction[];
}

export interface CRMCardSection {
  objectId: number;
  title: string;
  link?: string;
  linkLabel?: string;
  properties: CRMCardProperty[];
  actions?: CRMCardAction[];
}

export interface CRMCardProperty {
  label: string;
  dataType: 'STRING' | 'NUMBER' | 'DATE' | 'DATETIME' | 'EMAIL' | 'PHONE' | 'CURRENCY' | 'STATUS' | 'LINK';
  value: string | number;
}

export interface CRMCardAction {
  type: 'IFRAME' | 'ACTION_HOOK' | 'CONFIRMATION_ACTION_HOOK';
  width?: number;
  height?: number;
  uri: string;
  label: string;
  associatedObjectProperties?: string[];
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  confirmationMessage?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

// CRM Card request context
export interface CRMCardRequest {
  portalId: number;
  userId: number;
  userEmail: string;
  associatedObjectId: number;
  associatedObjectType: string;
  objectTypeId: string;
}
