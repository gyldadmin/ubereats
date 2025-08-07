describe('Scheduler Smoke Test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('opens HomeScreen', async () => {
    await expect(element(by.text('Home'))).toBeVisible();
  });

  // This assumes your green button has testID="btnPushEmail3Min"
  it('schedules Push+Email 3-minute task without runtime error', async () => {
    const btn = element(by.id('btnPushEmail3Min'));
    await btn.tap();

    // Expect toast / alert / success text
    await waitFor(element(by.text('Event Invitation Scheduled')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
