import { test, expect } from '@playwright/test';

test('sign up, task, timer, streak smoke flow', async ({ page }) => {
  const email = `beta+${Date.now()}@example.com`;

  // 1. Sign up flow
  await page.goto('/signup');
  await page.getByLabel('Full name').fill('Beta Scholar');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Passw0rd!x');
  await page.getByLabel('18 or older').check();
  await page.getByLabel(/I agree to the Terms of Service and Privacy Policy/i).check();
  await page.getByRole('button', { name: 'Create account' }).click();

  // 2. Expect onboarding or dashboard view
  await expect(page.getByText(/Get set up|Dashboard|Welcome to Track Here/i)).toBeVisible();

  // 3. Navigate to Tasks and create task
  await page.goto('/tasks');
  const createTaskBtn = page.getByRole('button', { name: /New Task|Create a task/i });
  if (await createTaskBtn.isVisible()) {
    await createTaskBtn.click();
    await page.getByLabel(/Task Title/i).fill('Smoke Test Task');
    await page.getByRole('button', { name: /Save Task|Create Task/i }).click();
  }

  // 4. Navigate to Study & Timer
  await page.goto('/study');
  const topicInput = page.getByPlaceholder(/What are you working on/i);
  if (await topicInput.isVisible()) {
    await topicInput.fill('Smoke Testing Flow');
  }
  const startBtn = page.getByRole('button', { name: /Start session/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    // Let timer run for 3 seconds
    await page.waitForTimeout(3000);
    // Pause or finish
    const pauseBtn = page.getByRole('button', { name: /Pause/i });
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
    }
  }

  // 5. Check Streak card on Streaks page
  await page.goto('/streaks');
  await expect(page.getByText(/streak/i)).toBeVisible();
});

