/**
 * Quota constants and utilities
 */

export const FREE_PLAN_QUOTAS = {
  storageLimitMB: 100, // 100 MB
  downloadsLimit: 50, // 50 downloads
  leadMagnetsLimit: 1, // 1 lead magnet
};

export const PRO_PLAN_QUOTAS = {
  storageLimitMB: Infinity, // Unlimited
  downloadsLimit: Infinity, // Unlimited
  leadMagnetsLimit: Infinity, // Unlimited
};

export type PlanType = 'free' | 'pro';

export interface UserQuota {
  user_id: string;
  plan_type: PlanType;
  storage_limit_mb: number;
  downloads_limit: number;
  lead_magnets_limit: number;
  storage_used_mb: number;
  downloads_used: number;
  lead_magnets_used: number;
}

export interface QuotaUsage {
  storageUsedMB: number;
  storageLimitMB: number;
  storageRemainingMB: number;
  storageUsagePercent: number;
  downloadsUsed: number;
  downloadsLimit: number;
  downloadsRemaining: number;
  downloadsUsagePercent: number;
  leadMagnetsUsed: number;
  leadMagnetsLimit: number;
  leadMagnetsRemaining: number;
  leadMagnetsUsagePercent: number;
  planType: PlanType;
}

/**
 * Calculate quota usage from user quota and actual usage
 */
export function calculateQuotaUsage(
  quota: UserQuota,
  actualStorageMB: number,
  actualDownloads: number,
  actualLeadMagnets: number
): QuotaUsage {
  const storageUsedMB = actualStorageMB;
  const storageLimitMB = quota.storage_limit_mb;
  const storageRemainingMB = Math.max(0, storageLimitMB - storageUsedMB);
  const storageUsagePercent = storageLimitMB > 0 ? (storageUsedMB / storageLimitMB) * 100 : 0;

  const downloadsUsed = actualDownloads;
  const downloadsLimit = quota.downloads_limit;
  const downloadsRemaining = Math.max(0, downloadsLimit - downloadsUsed);
  const downloadsUsagePercent = downloadsLimit > 0 ? (downloadsUsed / downloadsLimit) * 100 : 0;

  const leadMagnetsUsed = actualLeadMagnets;
  const leadMagnetsLimit = quota.lead_magnets_limit;
  const leadMagnetsRemaining = Math.max(0, leadMagnetsLimit - leadMagnetsUsed);
  const leadMagnetsUsagePercent = leadMagnetsLimit > 0 ? (leadMagnetsUsed / leadMagnetsLimit) * 100 : 0;

  return {
    storageUsedMB,
    storageLimitMB,
    storageRemainingMB,
    storageUsagePercent,
    downloadsUsed,
    downloadsLimit,
    downloadsRemaining,
    downloadsUsagePercent,
    leadMagnetsUsed,
    leadMagnetsLimit,
    leadMagnetsRemaining,
    leadMagnetsUsagePercent,
    planType: quota.plan_type,
  };
}

/**
 * Check if user can create a new lead magnet
 */
export function canCreateLeadMagnet(usage: QuotaUsage): boolean {
  return usage.leadMagnetsRemaining > 0;
}

/**
 * Check if user can upload a file of given size
 */
export function canUploadFile(usage: QuotaUsage, fileSizeMB: number): boolean {
  return usage.storageRemainingMB >= fileSizeMB;
}

/**
 * Check if user can accept more downloads
 */
export function canAcceptDownloads(usage: QuotaUsage): boolean {
  return usage.downloadsRemaining > 0;
}

