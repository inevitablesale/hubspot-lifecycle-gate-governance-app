/**
 * HubSpot API Service
 */

import { Client } from '@hubspot/api-client';
import { Contact, Deal, ContactProperties, DealProperties } from '../types';
import { logger } from '../utils';
import { getAccessToken } from './oauth.service';

/**
 * Get HubSpot API client for a portal
 */
export async function getHubSpotClient(portalId: number): Promise<Client | null> {
  const accessToken = await getAccessToken(portalId);

  if (!accessToken) {
    logger.warn('No access token available', { portalId });
    return null;
  }

  return new Client({ accessToken });
}

/**
 * Get contact by ID
 */
export async function getContact(
  portalId: number,
  contactId: string,
  properties?: string[]
): Promise<Contact | null> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return null;

    const response = await client.crm.contacts.basicApi.getById(
      contactId,
      properties || [
        'firstname',
        'lastname',
        'email',
        'phone',
        'company',
        'lifecyclestage',
        'hs_lead_status',
        'hubspot_owner_id',
      ]
    );

    return {
      id: response.id,
      properties: response.properties as ContactProperties,
      createdAt: response.createdAt.toISOString(),
      updatedAt: response.updatedAt.toISOString(),
      archived: response.archived || false,
    };
  } catch (error) {
    logger.error('Failed to get contact', {
      portalId,
      contactId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get deal by ID
 */
export async function getDeal(
  portalId: number,
  dealId: string,
  properties?: string[]
): Promise<Deal | null> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return null;

    const response = await client.crm.deals.basicApi.getById(
      dealId,
      properties || [
        'dealname',
        'amount',
        'dealstage',
        'pipeline',
        'closedate',
        'hubspot_owner_id',
        'hs_deal_stage_probability',
      ]
    );

    return {
      id: response.id,
      properties: response.properties as DealProperties,
      createdAt: response.createdAt.toISOString(),
      updatedAt: response.updatedAt.toISOString(),
      archived: response.archived || false,
    };
  } catch (error) {
    logger.error('Failed to get deal', {
      portalId,
      dealId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get contact associations (deals)
 */
export async function getContactDeals(portalId: number, contactId: string): Promise<string[]> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return [];

    const response = await client.crm.associations.batchApi.read('contacts', 'deals', {
      inputs: [{ id: contactId }],
    });

    return response.results.flatMap((r) => r.to.map((t) => t.id));
  } catch (error) {
    logger.error('Failed to get contact associations', {
      portalId,
      contactId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Get deal associations (contacts)
 */
export async function getDealContacts(portalId: number, dealId: string): Promise<string[]> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return [];

    const response = await client.crm.associations.batchApi.read('deals', 'contacts', {
      inputs: [{ id: dealId }],
    });

    return response.results.flatMap((r) => r.to.map((t) => t.id));
  } catch (error) {
    logger.error('Failed to get deal associations', {
      portalId,
      dealId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Update contact properties
 */
export async function updateContact(
  portalId: number,
  contactId: string,
  properties: Partial<ContactProperties>
): Promise<boolean> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return false;

    // Convert to string record, filtering out undefined values
    const stringProperties: Record<string, string> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        stringProperties[key] = value;
      }
    }

    await client.crm.contacts.basicApi.update(contactId, { properties: stringProperties });

    logger.info('Contact updated', { portalId, contactId, properties: Object.keys(properties) });

    return true;
  } catch (error) {
    logger.error('Failed to update contact', {
      portalId,
      contactId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Update deal properties
 */
export async function updateDeal(
  portalId: number,
  dealId: string,
  properties: Partial<DealProperties>
): Promise<boolean> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return false;

    // Convert to string record, filtering out undefined values
    const stringProperties: Record<string, string> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        stringProperties[key] = value;
      }
    }

    await client.crm.deals.basicApi.update(dealId, { properties: stringProperties });

    logger.info('Deal updated', { portalId, dealId, properties: Object.keys(properties) });

    return true;
  } catch (error) {
    logger.error('Failed to update deal', {
      portalId,
      dealId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get owner details
 */
export async function getOwner(
  portalId: number,
  ownerId: string
): Promise<{ name: string; email: string } | null> {
  try {
    const client = await getHubSpotClient(portalId);
    if (!client) return null;

    const response = await client.crm.owners.ownersApi.getById(parseInt(ownerId, 10));

    return {
      name: `${response.firstName || ''} ${response.lastName || ''}`.trim(),
      email: response.email || '',
    };
  } catch (error) {
    logger.error('Failed to get owner', {
      portalId,
      ownerId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
