import { test, expect } from '@playwright/test';

test('Google-only preview sign-in and responsive routes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(
    page.getByText('Google authentication will be connected', { exact: false }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Continue with Google' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your practice, in conversation.' }),
  ).toBeVisible();
  const routes = [
    '/dashboard',
    '/dashboard/agents',
    '/dashboard/agents/agent-sophie',
    '/dashboard/numbers',
    '/dashboard/calls',
    '/dashboard/calls/CA_1048',
    '/dashboard/test',
    '/dashboard/tools',
    '/dashboard/variables',
    '/dashboard/settings',
    '/dashboard/guide',
    '/onboarding',
    '/login',
  ];
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1').last()).toBeVisible();
      await expect(page.getByText('Loading demo workspace…')).toHaveCount(0);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `Horizontal overflow on ${route} at ${width}px`).toBeFalsy();
    }
  }
  expect(errors).toEqual([]);
});

test('create, edit and publish an agent, route a number and save a simulated call', async ({
  page,
}) => {
  await page.goto('/dashboard/agents');
  await page.getByRole('button', { name: 'Create agent', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Agent name').fill('Pilot receptionist');
  await dialog.getByRole('button', { name: 'Create agent', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Pilot receptionist', exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('System prompt')
    .fill('Answer practice questions and collect callback details.');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Draft saved for this preview session');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publish version' }).click();
  await expect(page.getByText('Live version v1', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Versions', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'v1', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Phone numbers', exact: true }).click();
  await page.getByRole('button', { name: 'Connect number', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Phone number (E.164)').fill('+919876543210');
  await page
    .getByRole('dialog')
    .getByLabel('Assigned agent')
    .selectOption({ label: 'Pilot receptionist' });
  await page.getByRole('dialog').getByRole('button', { name: 'Save routing' }).click();
  await expect(page.getByText('+919876543210', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Test studio', exact: true }).click();
  await page.getByLabel('Agent', { exact: true }).selectOption({ label: 'Pilot receptionist' });
  await page.getByRole('button', { name: 'Start simulated call' }).click();
  await page.getByRole('button', { name: 'End simulated call' }).click();
  await page.getByRole('link', { name: 'View saved call' }).click();
  await expect(page.getByRole('heading', { name: 'Morgan Lee', exact: true })).toBeVisible();
  await expect(page.getByText('Pilot receptionist', { exact: true }).last()).toBeVisible();
});

test('variables and workspace updates are shared, and reset restores fixtures', async ({
  page,
}) => {
  await page.goto('/dashboard/variables');
  await page.getByRole('button', { name: 'Add variable' }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('company_name');
  await page.getByRole('dialog').getByLabel('Value', { exact: true }).fill('Duplicate');
  await page.getByRole('dialog').getByRole('button', { name: 'Save variable' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    'A variable with this name already exists.',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Edit company_name' }).click();
  await page.getByRole('dialog').getByLabel('Value', { exact: true }).fill('Demo Clinic');
  await page.getByRole('dialog').getByRole('button', { name: 'Save variable' }).click();
  await expect(page.locator('pre').last()).toContainText('Demo Clinic');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Workspace name').fill('New Practice');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.workspace')).toContainText('New Practice');
  await page.getByRole('tab', { name: 'Audit log' }).click();
  await expect(page.getByRole('cell', { name: 'Workspace settings updated' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.locator('.workspace')).toContainText('Bloom Aesthetics');
});

test('tool validation, persistence and simulated result', async ({ page }) => {
  await page.goto('/dashboard/tools');
  await page.getByRole('button', { name: 'Add API tool' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tool name').fill('lookup_hours');
  await dialog.getByLabel('Description').fill('Look up practice hours');
  await dialog.getByLabel('Endpoint').fill('/api/hours');
  await dialog.getByLabel('Input schema').fill('{broken');
  await dialog.getByRole('button', { name: 'Save tool' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Enter valid JSON');
  await dialog.getByLabel('Input schema').fill('{"type":"object","properties":{}}');
  await dialog.getByRole('button', { name: 'Save tool' }).click();
  await expect(page.getByRole('heading', { name: 'lookup_hours', exact: true })).toBeVisible();
  await page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'lookup_hours', exact: true }) })
    .getByRole('button', { name: 'Test tool' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('No request was sent');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Voice agents', exact: true }).click();
  await page.getByRole('link', { name: 'Tools', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'lookup_hours', exact: true })).toBeVisible();
});

test('call filters, CSV download and missing record states', async ({ page }) => {
  await page.goto('/dashboard/calls');
  await page.getByRole('textbox', { name: 'Search calls' }).fill('Morgan');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('avishkar-sample-calls.csv');
  await page.getByRole('textbox', { name: 'Search calls' }).fill('no-such-caller');
  await expect(page.getByRole('heading', { name: 'No calls match your filters' })).toBeVisible();
  await page.goto('/dashboard/calls/missing');
  await expect(page.getByRole('heading', { name: 'Call not found' })).toBeVisible();
  await page.goto('/dashboard/agents/missing');
  await expect(page.getByRole('heading', { name: 'Agent not found' })).toBeVisible();
});

test('dialogs restore focus and tabs support arrow keys', async ({ page }) => {
  await page.goto('/dashboard/agents');
  const create = page.getByRole('button', { name: 'Create agent' });
  await create.click();
  await expect(page.getByRole('dialog').getByLabel('Agent name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(create).toBeFocused();
  await page.getByRole('link', { name: 'Open agent' }).first().click();
  const configuration = page.getByRole('tab', { name: 'Configuration' });
  await configuration.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Variables' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Variables' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
