describe('Scheduler Smoke Test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('opens HomeScreen', async () => {
    await waitFor(element(by.id('btnPushEmail3Min')))
      .toBeVisible()
      .whileElement(by.id('homeScroll')).scroll(300, 'down')
      .withTimeout(60000);
  });

  // This assumes your green button has testID="btnPushEmail3Min"
  it('schedules Push+Email 3-minute task without runtime error', async () => {
    const btn = element(by.id('btnPushEmail3Min'));
    await waitFor(btn)
      .toBeVisible()
      .whileElement(by.id('homeScroll')).scroll(300, 'down')
      .withTimeout(60000);
    await btn.tap();

    // Expect toast / alert / success text
    await waitFor(element(by.text('Event Invitation Scheduled')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
