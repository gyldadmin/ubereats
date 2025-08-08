describe('Scheduler Smoke Test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('opens HomeScreen', async () => {
    await waitFor(element(by.id('btnPushEmail3Min')))
      .toBeVisible()
      .whileElement(by.id('homeScroll')).scroll(300, 'down');
  });

  // This assumes your green button has testID="btnPushEmail3Min"
  it('schedules Push+Email 3-minute task without runtime error', async () => {
    const btn = element(by.id('btnPushEmail3Min'));
    await waitFor(btn)
      .toBeVisible()
      .whileElement(by.id('homeScroll')).scroll(300, 'down');
    await btn.tap();

    // Expect the iOS alert and press OK
    await waitFor(element(by.label('OK')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.label('OK')).tap();
  });
});
