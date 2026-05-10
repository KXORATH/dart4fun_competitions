const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/dart4fun_competitions/');
  
  // Host Tournament
  await page.click('text="Create Tournament"');
  await page.click('button:has-text("Create Tournament")');
  
  // Add Players
  await page.fill('input[placeholder="Player Name"]', 'P1');
  await page.click('text="Add Player"');
  await page.fill('input[placeholder="Player Name"]', 'P2');
  await page.click('text="Add Player"');
  
  // Proceed to Settings
  await page.click('text="Proceed to Settings"');
  
  // Game Mode: 1v1
  await page.click('text="Quick 1v1 Match"');
  
  // Start
  await page.click('text="Start Match"');

  // Wait for Match Setup
  await page.waitForSelector('text="Who was closer to the bull?"');
  await page.click('text="P1"');

  // Enter scores
  const submitScore = async (score) => {
    const chars = score.toString().split('');
    for (const char of chars) {
      await page.locator(`button.numpad-btn:has-text("${char}")`).first().click();
    }
    await page.locator('button.submit-btn').click();
    await page.waitForTimeout(500);
  };

  await submitScore(180);
  await submitScore(0);
  await submitScore(180);
  await submitScore(0);
  
  console.log("Submitting 141 to trigger prompt...");
  const chars = '141'.split('');
  for (const char of chars) {
      await page.locator(`button.numpad-btn:has-text("${char}")`).first().click();
  }
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.locator('button.submit-btn').click();
  await page.waitForTimeout(1000);
  
  console.log("Clicking 3 Darts...");
  await page.click('button:has-text("3 Darts")');
  await page.waitForTimeout(1000);
  
  const debugMatch = await page.evaluate(() => window.DEBUG_MATCH);
  console.log("DEBUG_MATCH array:", debugMatch.join('\n'));
  
  const score = await page.evaluate(() => document.querySelector('.score-cell').innerText);
  console.log("P1 SCORE AFTER CLICKING 3 DARTS:", score);
  
  await browser.close();
})();
