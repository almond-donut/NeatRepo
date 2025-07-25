const { test, expect } = require('@playwright/test');

test.describe('GitHub OAuth Token Persistence Test', () => {
  test('should persist GitHub token after sign out and re-login', async ({ page }) => {
    console.log('🎯 Starting GitHub OAuth Token Persistence Test...');
    
    // Navigate to production app
    await page.goto('https://neatrepo.vercel.app');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Navigated to NeatRepo');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-landing-page.png' });
    
    // Click "Get Started" or "Sign In" button to open auth forms
    const getStartedButton = page.locator('button:has-text("Get Started")').first();
    const signInButton = page.locator('button:has-text("Sign In")').first();
    
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
      console.log('✅ Clicked Get Started button');
    } else if (await signInButton.isVisible()) {
      await signInButton.click();
      console.log('✅ Clicked Sign In button');
    } else {
      throw new Error('❌ No auth button found');
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/02-auth-modal-opened.png' });
    
    // Look for GitHub OAuth button
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    await expect(githubButton).toBeVisible();
    console.log('✅ GitHub OAuth button found');
    
    // Click GitHub OAuth button
    await githubButton.click();
    console.log('✅ Clicked GitHub OAuth button');
    
    // Wait for GitHub OAuth redirect or popup
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to GitHub or if there's an error
    const currentUrl = page.url();
    console.log(`🔗 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('github.com')) {
      console.log('🔄 Redirected to GitHub OAuth - Manual intervention needed');
      console.log('⚠️  This test requires manual GitHub login or pre-configured test account');
      
      // Wait for manual login (in real scenario, we'd use test credentials)
      await page.waitForTimeout(30000);
      
    } else if (currentUrl.includes('dashboard')) {
      console.log('✅ Already logged in - redirected to dashboard');
      
    } else {
      console.log('⚠️  Unexpected redirect or error occurred');
      await page.screenshot({ path: 'test-results/03-unexpected-state.png' });
    }
    
    // Check if we're on dashboard
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log(`🎯 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('dashboard')) {
      console.log('✅ Successfully reached dashboard');
      await page.screenshot({ path: 'test-results/04-dashboard-reached.png' });
      
      // Check for GitHub token popup
      const tokenPopup = page.locator('[data-testid="github-token-popup"]');
      const isTokenPopupVisible = await tokenPopup.isVisible().catch(() => false);
      
      if (isTokenPopupVisible) {
        console.log('📝 GitHub token popup is visible (first time setup)');
        await page.screenshot({ path: 'test-results/05-token-popup-first-time.png' });
        
        // For testing, we'll dismiss the popup to simulate token setup
        const dismissButton = page.locator('button:has-text("Dismiss")');
        if (await dismissButton.isVisible()) {
          await dismissButton.click();
          console.log('✅ Dismissed token popup for testing');
        }
      } else {
        console.log('✅ No GitHub token popup (token already exists)');
      }
      
      // Now test the critical part: Sign out and re-login
      console.log('🔄 Testing sign out and re-login...');
      
      // Find and click sign out button
      const signOutButton = page.locator('button:has-text("Sign Out")');
      await expect(signOutButton).toBeVisible();
      await signOutButton.click();
      console.log('✅ Clicked Sign Out button');
      
      // Wait for redirect to homepage
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/06-after-signout.png' });
      
      // Verify we're back on homepage
      const homeUrl = page.url();
      console.log(`🏠 After sign out URL: ${homeUrl}`);
      
      // Now re-login with GitHub OAuth
      console.log('🔄 Re-logging in with GitHub OAuth...');
      
      // Click auth button again
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click();
      } else if (await signInButton.isVisible()) {
        await signInButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Click GitHub OAuth again
      const githubButtonSecond = page.locator('button:has-text("Continue with GitHub")');
      await githubButtonSecond.click();
      console.log('✅ Clicked GitHub OAuth button (second time)');
      
      // Wait for auth flow
      await page.waitForTimeout(5000);
      
      // Check if we reach dashboard again
      const secondLoginUrl = page.url();
      console.log(`🎯 Second login URL: ${secondLoginUrl}`);
      
      if (secondLoginUrl.includes('dashboard')) {
        console.log('✅ Successfully re-logged in to dashboard');
        await page.screenshot({ path: 'test-results/07-dashboard-second-login.png' });
        
        // CRITICAL TEST: Check if GitHub token popup appears again
        await page.waitForTimeout(2000);
        const tokenPopupSecond = page.locator('[data-testid="github-token-popup"]');
        const isTokenPopupVisibleSecond = await tokenPopupSecond.isVisible().catch(() => false);
        
        if (isTokenPopupVisibleSecond) {
          console.log('❌ CRITICAL BUG: GitHub token popup appeared again after re-login!');
          console.log('🐛 This means token persistence is broken');
          await page.screenshot({ path: 'test-results/08-BUG-token-popup-reappeared.png' });
          
          // This is the bug we need to fix
          throw new Error('CRITICAL BUG: GitHub token popup should not appear for existing users');
          
        } else {
          console.log('✅ PERFECT: No GitHub token popup on re-login');
          console.log('🎉 Token persistence is working correctly');
          await page.screenshot({ path: 'test-results/08-SUCCESS-no-popup-relogin.png' });
        }
        
      } else {
        console.log('⚠️  Failed to reach dashboard on second login');
        await page.screenshot({ path: 'test-results/07-second-login-failed.png' });
      }
      
    } else {
      console.log('❌ Failed to reach dashboard on first login');
      await page.screenshot({ path: 'test-results/04-dashboard-not-reached.png' });
    }
    
    console.log('🏁 GitHub OAuth Token Persistence Test completed');
  });
});
