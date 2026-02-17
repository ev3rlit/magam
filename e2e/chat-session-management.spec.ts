import { expect, test } from '@playwright/test';

test.describe('Chat session management', () => {
  test.beforeEach(async ({ page }) => {
    const providers = [
      { id: 'claude', displayName: 'Claude Code', isInstalled: true, command: 'claude', version: '1.0.0' },
      { id: 'codex', displayName: 'Codex CLI', isInstalled: true, command: 'codex', version: '0.1.0' },
      { id: 'gemini', displayName: 'Gemini CLI', isInstalled: true, command: 'gemini', version: '0.2.0' },
    ];

    const groups: any[] = [];
    const sessions: any[] = [];
    const messages = new Map<string, any[]>();

    const now = () => Date.now();

    await page.route('**/api/chat/providers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ providers }),
      });
    });

    await page.route('**/api/chat/groups', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ groups }) });
        return;
      }

      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const group = {
          id: `g-${groups.length + 1}`,
          name: body.name,
          color: body.color ?? null,
          sortOrder: body.sortOrder ?? 0,
          createdAt: now(),
          updatedAt: now(),
        };
        groups.push(group);
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ group }) });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/chat/groups/*', async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').pop()!;
      const index = groups.findIndex((g) => g.id === id);

      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (index < 0) {
          await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Group not found' }) });
          return;
        }
        groups[index] = { ...groups[index], ...body, updatedAt: now() };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ group: groups[index] }) });
        return;
      }

      if (route.request().method() === 'DELETE') {
        if (index >= 0) groups.splice(index, 1);
        for (const session of sessions) {
          if (session.groupId === id) session.groupId = null;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true, fallbackGroupId: null }) });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/chat/sessions', async (route) => {
      if (route.request().method() === 'GET') {
        const url = new URL(route.request().url());
        const groupId = url.searchParams.get('groupId');
        const q = (url.searchParams.get('q') || '').toLowerCase();
        let list = [...sessions];
        if (groupId) list = list.filter((s) => s.groupId === groupId);
        if (q) list = list.filter((s) => String(s.title).toLowerCase().includes(q));

        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: list }) });
        return;
      }

      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const session = {
          id: `s-${sessions.length + 1}`,
          title: body.title || `New Chat ${sessions.length + 1}`,
          groupId: body.groupId ?? null,
          providerId: body.providerId ?? 'claude',
          createdAt: now(),
          updatedAt: now(),
        };
        sessions.unshift(session);
        messages.set(session.id, []);
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ session }) });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/chat/sessions/*/messages**', async (route) => {
      const url = new URL(route.request().url());
      const parts = url.pathname.split('/');
      const sessionId = parts[parts.indexOf('sessions') + 1];
      const items = messages.get(sessionId) || [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items, nextCursor: null }) });
    });

    await page.route('**/api/chat/sessions/*', async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').pop()!;
      const index = sessions.findIndex((s) => s.id === id);

      if (route.request().method() === 'GET') {
        const session = sessions[index];
        if (!session) {
          await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Session not found' }) });
          return;
        }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session }) });
        return;
      }

      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (index < 0) {
          await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Session not found' }) });
          return;
        }
        sessions[index] = { ...sessions[index], ...body, updatedAt: now() };
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: sessions[index] }) });
        return;
      }

      if (route.request().method() === 'DELETE') {
        if (index >= 0) sessions.splice(index, 1);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true }) });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/chat/send', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const sessionId = body.sessionId || 's-1';
      const eventText = [
        'event: chunk',
        `data: ${JSON.stringify({ type: 'tool_use', content: 'prompt-ready', metadata: { sessionId } })}`,
        '',
        'event: chunk',
        `data: ${JSON.stringify({ type: 'text', content: 'ok', metadata: { sessionId } })}`,
        '',
        'event: done',
        `data: ${JSON.stringify({ type: 'done', content: '', metadata: { sessionId } })}`,
        '',
      ].join('\n');

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
        },
        body: eventText,
      });
    });

    await page.route('**/api/chat/stop', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ stopped: true }) });
    });

    await page.route('**/api/files', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ files: ['examples/mindmap.tsx'] }) }),
    );
    await page.route('**/api/file-tree', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tree: {
            name: 'workspace',
            path: '/',
            type: 'directory',
            children: [{ name: 'examples', path: 'examples', type: 'directory', children: [{ name: 'mindmap.tsx', path: 'examples/mindmap.tsx', type: 'file' }] }],
          },
        }),
      }),
    );
    await page.route('**/api/render', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ graph: { children: [] } }) }),
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
  });

  test('can create group/session, move session, reopen and switch provider', async ({ page }) => {
    await page.getByRole('button', { name: /AI Chat/i }).click();

    await expect(page.getByText('Local AI Chat')).toBeVisible();

    await page.getByPlaceholder('New group').fill('Backend');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByRole('button', { name: 'Backend' })).toBeVisible();

    await page.getByRole('button', { name: '+ New Session' }).click();
    await expect(page.getByRole('button', { name: /New Chat 1/ }).first()).toBeVisible();

    const groupSelect = page.locator('select').filter({ has: page.locator('option[value=""]') }).first();
    await groupSelect.selectOption({ label: 'Backend' });

    await page.getByRole('button', { name: 'Backend' }).click();
    await expect(page.getByText('No sessions yet.')).toBeHidden();

    const providerSelect = page.locator('select').filter({ has: page.locator('option[value="claude"]') }).first();
    await providerSelect.selectOption('codex');

    await expect(page.getByText('Provider 변경 확인')).toBeVisible();
    await page.getByRole('button', { name: '변경' }).click();
    await expect(page.getByText('Provider 변경 확인')).toBeHidden();

    await page.getByText('New Chat 1').first().click();
    await expect(page.getByText('No active session')).toBeHidden();
  });
});
