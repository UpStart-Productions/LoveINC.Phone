import { getNotificationRoute } from './notification-deeplink';

describe('notification destinations', () => {
  it('opens the microlearning theme list rather than treating its ID as a lesson', () => {
    expect(getNotificationRoute({ itemType: 'transformation_tool', itemId: 'theme-id' }))
      .toEqual(['/tabs/content-plan-theme', 'theme-id']);
  });

  it('keeps events and classes on their detail screens', () => {
    for (const itemType of ['event', 'class']) {
      expect(getNotificationRoute({ itemType, itemId: 'item-id' }))
        .toEqual(['/tabs/content-detail', itemType, 'item-id']);
    }
  });

  it('does not navigate without a destination ID', () => {
    expect(getNotificationRoute({ itemType: 'transformation_tool', itemId: '' })).toBeNull();
  });
});
