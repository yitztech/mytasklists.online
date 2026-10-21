import { createHash } from 'node:crypto';
import { Controller, Get } from '@nestjs/common';
import { readFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Public } from '../../common/decorators/public.decorator';

const allowed = (value: string | undefined, host: string) => {
  try {
    const u = new URL(value || '');
    return u.protocol === 'https:' && u.hostname === host ? u.href : null;
  } catch {
    return null;
  }
};

const parseSemver = (v: string): number[] =>
  v.replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0);

const isVersionGreaterOrEqual = (v1: string, v2: string): boolean => {
  const p1 = parseSemver(v1);
  const p2 = parseSemver(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] ?? 0;
    const b = p2[i] ?? 0;
    if (a !== b) return a >= b;
  }
  return true;
};

export interface ApkDistribution {
  url: string;
  version: string;
  size: number;
  sha256?: string;
  githubReleaseUrl?: string;
}

@Controller('distribution')
export class DistributionController {
  private storeChecks = new Map<string, { expires: number; url: string | null }>();
  private artifactCheck: { key: string; valid: boolean } | null = null;
  private githubReleaseCache: { expires: number; data: ApkDistribution | null } | null = null;

  private async availableStore(url: string | null) {
    if (!url) return null;
    const old = this.storeChecks.get(url);
    if (old && old.expires > Date.now()) return old.url;
    let checked: string | null = url;
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(3000),
      });
      if (response.status === 404 || response.status === 410) checked = null;
    } catch {
      /* A transient failure keeps the configured link and visible alternatives. */
    }
    this.storeChecks.set(url, { expires: Date.now() + 600000, url: checked });
    return checked;
  }

  private async fetchLatestGithubRelease(): Promise<ApkDistribution | null> {
    if (this.githubReleaseCache && this.githubReleaseCache.expires > Date.now()) {
      return this.githubReleaseCache.data;
    }
    const repo = process.env.GITHUB_REPOSITORY || 'yitztech/mytasklists.online';
    let result: ApkDistribution | null = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
        headers: {
          'User-Agent': 'MyTaskLists-Distribution/1.0',
          Accept: 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        let tag = '';
        if (typeof data.tag_name === 'string') {
          tag = data.tag_name.replace(/^v/, '');
        }
        let assets: any[] = [];
        if (Array.isArray(data.assets)) {
          assets = data.assets;
        }
        const apkAsset = assets.find(
          (a: any) => typeof a.name === 'string' && /\.apk$/i.test(a.name),
        );
        if (apkAsset && typeof apkAsset.browser_download_url === 'string' && typeof apkAsset.size === 'number' && tag) {
          let sha256: string | undefined = undefined;
          if (typeof apkAsset.digest === 'string' && /^sha256:[a-f0-9]{64}$/i.test(apkAsset.digest)) {
            sha256 = apkAsset.digest.replace(/^sha256:/i, '').toLowerCase();
          } else if (typeof data.body === 'string') {
            const m = data.body.match(/\b([a-f0-9]{64})\b/i);
            if (m) sha256 = m[1].toLowerCase();
          }
          result = {
            url: apkAsset.browser_download_url,
            version: tag,
            size: apkAsset.size,
            sha256,
            githubReleaseUrl: apkAsset.browser_download_url,
          };
        }
      }
    } catch {
      /* Silently ignore transient network or rate-limit issues */
    }
    this.githubReleaseCache = { expires: Date.now() + 300000, data: result };
    return result;
  }

  @Public()
  @Get()
  async manifest() {
    let localApk: ApkDistribution | null = null;
    const root = process.env.DOWNLOADS_DIR || '/downloads';
    try {
      const m = JSON.parse(await readFile(join(root, 'android.json'), 'utf8'));
      const file = basename(m.file || '');
      if (
        file === m.file &&
        /\.apk$/.test(file) &&
        /^[a-f0-9]{64}$/.test(m.sha256) &&
        typeof m.version === 'string' &&
        m.signed === true
      ) {
        const info = await stat(join(root, file));
        const key = file + ':' + info.size + ':' + info.mtimeMs + ':' + m.sha256;
        if (this.artifactCheck?.key !== key) {
          this.artifactCheck = {
            key,
            valid:
              createHash('sha256').update(await readFile(join(root, file))).digest('hex') ===
              m.sha256,
          };
        }
        if (info.isFile() && info.size === m.size && this.artifactCheck.valid) {
          localApk = {
            url: '/downloads/' + encodeURIComponent(file),
            version: m.version,
            size: info.size,
            sha256: m.sha256,
            githubReleaseUrl: `https://github.com/yitztech/mytasklists.online/releases/download/v${encodeURIComponent(m.version)}/${encodeURIComponent(file)}`,
          };
        }
      }
    } catch {
      /* Local download not available or unverified */
    }

    let apk: ApkDistribution | null = localApk;
    const githubEnabled = process.env.GITHUB_DISTRIBUTION_ENABLED === 'true';

    if (githubEnabled) {
      try {
        const ghRelease = await this.fetchLatestGithubRelease();
        if (ghRelease) {
          if (!localApk || !isVersionGreaterOrEqual(localApk.version, ghRelease.version)) {
            apk = ghRelease;
          }
        }
      } catch {
        /* Fallback keeps localApk */
      }
    }

    return {
      android: {
        storeUrl: await this.availableStore(
          process.env.ANDROID_STORE_PUBLISHED === 'true'
            ? allowed(process.env.MOBILE_STORE_URL_ANDROID, 'play.google.com')
            : null,
        ),
        apk,
      },
      ios: {
        storeUrl: await this.availableStore(
          process.env.IOS_STORE_PUBLISHED === 'true'
            ? allowed(process.env.MOBILE_STORE_URL_IOS, 'apps.apple.com')
            : null,
        ),
        testflightUrl: allowed(process.env.IOS_TESTFLIGHT_URL, 'testflight.apple.com'),
      },
    };
  }
}
