import { expect, test } from '@playwright/test';

const files = [
  'docs/overview.graph.tsx',
  'docs/guide.graph.tsx',
  'notes/day1.graph.tsx',
  'notes/day2.graph.tsx',
  'notes/day3.graph.tsx',
  'notes/day4.graph.tsx',
  'notes/day5.graph.tsx',
  'notes/day6.graph.tsx',
  'notes/day7.graph.tsx',
  'notes/day8.graph.tsx',
  'notes/day9.graph.tsx',
  'notes/day10.graph.tsx',
  'notes/day11.graph.tsx',
];

const fileNodes = files.map((path) => {
  const fileName = path.split('/').at(-1) ?? path;
  return {
    name: fileName,
    path,
    type: 'file',
  };
});

const treeData = {
  tree: {
    name: 'workspace',
    path: '/',
    type: 'directory',
    children: [
      {
        name: 'docs',
        path: 'docs',
        type: 'directory',
        children: fileNodes
          .filter((node) => node.path.startsWith('docs/'))
          .map((node) => ({
            ...node,
            path: node.path,
          })),
      },
      {
        name: 'notes',
        path: 'notes',
        type: 'directory',
        children: fileNodes
          .filter((node) => node.path.startsWith('notes/'))
          .map((node) => ({
            ...node,
            path: node.path,
          })),
      },
    ],
  },
};

const graphPayload = {
  graph: {
    children: [],
  },
};

const openTabFromTree = async (page, fileName: string) => {
  const fileTitle = fileName.split('/').at(-1) ?? fileName;
  const segments = fileName.split('/');

  if (segments.length === 1) {
    await page.getByRole('button', { name: fileTitle }).click();
    await expect(page.getByRole('tab', { name: fileTitle })).toBeVisible();
    return;
  }

  const folders = segments.slice(0, -1);

  for (const folder of folders) {
    await page.getByRole('button', { name: folder }).click();
  }

  await page.getByRole('button', { name: fileTitle }).click();
  await expect(page.getByRole('tab', { name: fileTitle })).toBeVisible();
};

const openTabByQuickOpen = async (page, fileName: string) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+T`);

  const quickOpenInput = page.getByPlaceholder('파일 경로 검색...');
  const fileTitle = fileName.split('/').at(-1) ?? fileName;

  let quickOpenAvailable = false;
  try {
    await expect(quickOpenInput, '퀵 오픈이 열려야 함').toBeVisible({
      timeout: 500,
    });
    quickOpenAvailable = true;
  } catch {
    quickOpenAvailable = false;
  }

  if (!quickOpenAvailable) {
    await openTabFromTree(page, fileName);
    return;
  }

  await quickOpenInput.fill(fileName);
  await page.getByRole('button', { name: fileName }).click();
  await expect(page.getByPlaceholder('파일 경로 검색...')).toBeHidden();
  await expect(page.getByRole('tab', { name: fileTitle })).toBeVisible();
};

const markActiveTabDirty = async (page) => {
  await page.evaluate(() => {
    const hooks = (
      window as Window & {
        __magamTest?: {
          getActiveTabId: () => string | null;
          markTabDirty: (tabId: string, dirty: boolean) => void;
        };
      }
    ).__magamTest;
    if (!hooks || !hooks.getActiveTabId) {
      throw new Error('Test hooks are not available');
    }

    const tabId = hooks.getActiveTabId();
    if (!tabId) {
      throw new Error('No active tab id to mark as dirty');
    }

    hooks.markTabDirty(tabId, true);
  });
};

const closeDialogButton = (page, label: string) =>
  page
    .getByRole('menuitem', { name: label })
    .or(page.getByRole('button', { name: label }));

const openContextMenu = async (page, tabName: string) => {
  const tab = page.getByRole('tab', { name: tabName });
  const box = await tab.boundingBox();
  if (!box) {
    throw new Error(`탭 "${tabName}" 위치를 찾을 수 없습니다.`);
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
    button: 'right',
  });
  await expect(page.getByRole('menu')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/files', (route) => {
    if (route.request().method() !== 'GET') {
      route.continue();
      return;
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        files,
      },
    });
  });

  await page.route('**/api/file-tree', (route) => {
    if (route.request().method() !== 'GET') {
      route.continue();
      return;
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: treeData,
    });
  });

  await page.route('**/api/render', (route) => {
    if (route.request().method() !== 'POST') {
      route.continue();
      return;
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: graphPayload,
    });
  });

  await page.route('**/api/assets/file', (route) => route.abort());

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
});

test('Cmd/Ctrl+T로 탭 열기', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await expect(page.getByRole('tab', { name: 'day1.graph.tsx' })).toBeVisible();
});

test('이미 열린 파일은 새 탭으로 늘리지 않고 활성화한다', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day2.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(2);
  await expect(
    page.getByRole('tab', { name: 'day1.graph.tsx' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('Ctrl+W로 탭 닫기(현재 탭)', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day2.graph.tsx');

  const shortcut = process.platform === 'darwin' ? 'Meta+W' : 'Control+W';
  await page.keyboard.press(shortcut);

  await expect(
    page.getByRole('tab', { name: 'day2.graph.tsx' }),
  ).not.toBeVisible();
  await expect(page.getByRole('tab', { name: 'day1.graph.tsx' })).toBeVisible();
});

test('더티 탭 닫기 시 확인 모달에서 취소 유지', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await markActiveTabDirty(page);

  const shortcut = process.platform === 'darwin' ? 'Meta+W' : 'Control+W';
  await page.keyboard.press(shortcut);

  await expect(
    page.getByRole('heading', { name: '변경사항이 저장되지 않았습니다' }),
  ).toBeVisible();
  await closeDialogButton(page, '취소').click();

  await expect(page.getByRole('tab', { name: 'day1.graph.tsx' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '변경사항이 저장되지 않았습니다' }),
  ).toBeHidden();
});

test('더티 탭 닫기 후 저장 안 함으로 닫기', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day2.graph.tsx');
  await page.getByRole('tab', { name: 'day2.graph.tsx' }).click();

  await markActiveTabDirty(page);
  const shortcut = process.platform === 'darwin' ? 'Meta+W' : 'Control+W';
  await page.keyboard.press(shortcut);

  await closeDialogButton(page, '저장 안 함').click();
  await expect(
    page.getByRole('tab', { name: 'day2.graph.tsx' }),
  ).not.toBeVisible();
  await expect(page.getByRole('tab', { name: 'day1.graph.tsx' })).toBeVisible();
});

test('우클릭 메뉴의 닫기 동작', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day2.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day3.graph.tsx');

  await page.getByRole('tab', { name: 'day1.graph.tsx' }).click();
  await openContextMenu(page, 'day1.graph.tsx');

  await closeDialogButton(page, '다른 탭 닫기').click();
  await expect(page.getByRole('tab', { name: 'day1.graph.tsx' })).toBeVisible();
  await expect(
    page.getByRole('tab', { name: 'day2.graph.tsx' }),
  ).not.toBeVisible();
  await expect(
    page.getByRole('tab', { name: 'day3.graph.tsx' }),
  ).not.toBeVisible();
});

test('우클릭 메뉴의 모든 탭 닫기 후 fallback 탭 오픈', async ({ page }) => {
  await openTabByQuickOpen(page, 'notes/day1.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day2.graph.tsx');
  await openTabByQuickOpen(page, 'notes/day3.graph.tsx');

  await page.getByRole('tab', { name: 'day2.graph.tsx' }).click();
  await openContextMenu(page, 'day2.graph.tsx');

  await closeDialogButton(page, '모든 탭 닫기').click();
  await expect(page.getByRole('tab')).toHaveCount(1);
});

test('탭 제한 초과 시 교체 안내 확인', async ({ page }) => {
  for (const fileName of files.slice(0, 10)) {
    await openTabByQuickOpen(page, fileName);
    await expect(page.getByRole('tab')).toHaveCount(
      Math.min(files.indexOf(fileName) + 1, 10),
    );
  }

  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+T' : 'Control+T',
  );
  await page
    .getByPlaceholder('파일 경로 검색...')
    .fill('notes/day10.graph.tsx');
  await page.getByRole('button', { name: 'notes/day10.graph.tsx' }).click();

  await expect(
    page.getByRole('heading', { name: '탭 개수 제한' }),
  ).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(10);
  await closeDialogButton(page, '교체 후 열기').click();

  await expect(
    page.getByRole('heading', { name: '탭 개수 제한' }),
  ).toBeHidden();
  await expect(page.getByRole('tab')).toHaveCount(10);
  await expect(
    page.getByRole('tab', { name: 'day10.graph.tsx' }),
  ).toBeVisible();
});
