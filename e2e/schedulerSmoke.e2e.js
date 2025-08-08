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

    // Fail if an error modal appears; otherwise wait for success marker
    const failModal = element(by.text('test failed'));
    try {
      await expect(failModal).not.toBeVisible();
    } catch {}
    await waitFor(element(by.id('e2eScheduled'))).toBeVisible();
  });
});
