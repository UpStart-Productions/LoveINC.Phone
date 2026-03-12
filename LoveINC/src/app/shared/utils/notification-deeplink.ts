import type { ContentType } from '../../organization-services/content-detail/content-detail.model';

export interface NotificationMeta {
  itemType: string;
  itemId: string;
  tenantSlug?: string;
  ctaType?: string;
}

/**
 * Maps notification meta (from push or in-app notification) to the content-detail route type.
 * Used for deep linking when user taps a notification.
 */
export function mapNotificationMetaToContentType(meta: NotificationMeta | null | undefined): ContentType | null {
  if (!meta?.itemType || !meta?.itemId) return null;

  const { itemType, ctaType } = meta;

  // Backend itemType: event, class, cta, service
  if (itemType === 'service') return 'gap-ministry';

  if (itemType === 'cta') {
    const ctaMapping: Record<string, ContentType> = {
      donation_drive: 'donation-drive',
      volunteer_call: 'volunteer',
      fundraiser: 'fundraiser',
      awareness: 'awareness',
    };
    const mapped = ctaType ? ctaMapping[ctaType] : null;
    return mapped ?? 'donation-drive';
  }

  const mapping: Record<string, ContentType> = {
    event: 'event',
    class: 'class',
    'impact-story': 'impact-story',
    impactStory: 'impact-story',
    'gap-ministry': 'gap-ministry',
    gapMinistry: 'gap-ministry',
    'donation-opportunity': 'donation-opportunity',
    donationOpportunity: 'donation-opportunity',
    volunteer: 'volunteer',
    'donation-drive': 'donation-drive',
    donationDrive: 'donation-drive',
    'church-partner': 'church-partner',
    churchPartner: 'church-partner',
    fundraiser: 'fundraiser',
    awareness: 'awareness',
  };

  return mapping[itemType] ?? 'event';
}
