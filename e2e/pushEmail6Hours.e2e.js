/* E2E: verifies the 6-hour push + email button schedules without runtime errors */

describe('Scheduler – Push + Email 6-hour button', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('schedules Push+Email 6-hour task successfully', async () => {
    await element(by.id('btnPushEmail6Hours')).tap();

    await waitFor(element(by.text('Event Invitation Scheduled')))
      .toBeVisible()
      .withTimeout(10000);
  });
});

