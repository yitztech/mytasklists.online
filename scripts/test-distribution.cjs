const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { DistributionController } = require('../apps/backend/dist/modules/billing/distribution.controller');

test('downloads only expose controlled, unchanged publication manifests', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mytasklists-distribution-test-'));
  process.env.DOWNLOADS_DIR = root;
  process.env.ANDROID_STORE_PUBLISHED = 'false';
  process.env.IOS_STORE_PUBLISHED = 'false';
  process.env.GITHUB_DISTRIBUTION_ENABLED = 'false';
  try {
    const service = new DistributionController();
    assert.equal((await service.manifest()).android.apk, null);

    const fixture = Buffer.from('isolated unit fixture, not an installable APK');
    await fs.writeFile(path.join(root, 'fixture.apk'), fixture);
    const manifest = {
      file: 'fixture.apk',
      version: '2.0.0',
      signed: true,
      size: fixture.length,
      sha256: crypto.createHash('sha256').update(fixture).digest('hex'),
    };
    await fs.writeFile(path.join(root, 'android.json'), JSON.stringify(manifest));
    assert.equal((await service.manifest()).android.apk.url, '/downloads/fixture.apk');

    await fs.writeFile(path.join(root, 'fixture.apk'), Buffer.alloc(fixture.length, 1));
    assert.equal((await service.manifest()).android.apk, null);

    await fs.writeFile(path.join(root, 'android.json'), JSON.stringify({ ...manifest, file: '../fixture.apk' }));
    assert.equal((await service.manifest()).android.apk, null);
  } finally {
    delete process.env.DOWNLOADS_DIR;
    delete process.env.GITHUB_DISTRIBUTION_ENABLED;
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('downloads resolve latest github release when enabled or when local is outdated', async () => {
  process.env.GITHUB_DISTRIBUTION_ENABLED = 'true';
  process.env.ANDROID_STORE_PUBLISHED = 'false';
  process.env.IOS_STORE_PUBLISHED = 'false';
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).includes('releases/latest')) {
        return {
          ok: true,
          json: async () => ({
            tag_name: 'v2.5.1',
            body: 'Versión 2.5.1\n\nSHA-256: 5738772ced8777dc2bb0e327dc64236e3d449bc6dd2d7795ffc30e967a540420',
            assets: [
              {
                name: 'mytasklists-2.5.1.apk',
                size: 96217620,
                digest: 'sha256:5738772ced8777dc2bb0e327dc64236e3d449bc6dd2d7795ffc30e967a540420',
                browser_download_url: 'https://github.com/yitztech/mytasklists.online/releases/download/v2.5.1/mytasklists-2.5.1.apk',
              },
            ],
          }),
        };
      }
      return originalFetch(url);
    };

    const service = new DistributionController();
    const result = await service.manifest();
    assert.ok(result.android.apk);
    assert.equal(result.android.apk.version, '2.5.1');
    assert.equal(result.android.apk.size, 96217620);
    assert.equal(result.android.apk.sha256, '5738772ced8777dc2bb0e327dc64236e3d449bc6dd2d7795ffc30e967a540420');
    assert.equal(result.android.apk.url, 'https://github.com/yitztech/mytasklists.online/releases/download/v2.5.1/mytasklists-2.5.1.apk');
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GITHUB_DISTRIBUTION_ENABLED;
  }
});
