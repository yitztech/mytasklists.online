const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { OAuthService } = require('../apps/backend/dist/modules/auth/oauth.service');
const { AuthService } = require('../apps/backend/dist/modules/auth/auth.service');
const { AuthController } = require('../apps/backend/dist/modules/auth/auth.controller');
let jose, key, otherKey, jwks;
before(async () => {
  jose = await import('jose');
  key = await jose.generateKeyPair('RS256');
  otherKey = await jose.generateKeyPair('RS256');
  jwks = jose.createLocalJWKSet({ keys: [{ ...await jose.exportJWK(key.publicKey), kid: 'google-test', alg: 'RS256' }] });
});
const audience = 'test-web.apps.googleusercontent.com';
function oauth(audiences = [audience]) {
  const service = new OAuthService({ get: (name, fallback) => name === 'google.allowedAudiences' ? audiences : fallback }, {});
  service.googleJwks = jwks;
  return service;
}
async function token(overrides = {}, signingKey = key.privateKey) {
  return new jose.SignJWT({ sub: 'subject', email: 'person@example.test', email_verified: true,
    iss: 'https://accounts.google.com', aud: audience, iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300, ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'google-test' }).sign(signingKey);
}
test('native Google token accepts the explicitly configured WEB audience', async () => {
  const profile = await oauth().verifyGoogleIdToken(await token());
  assert.equal(profile.providerId, 'subject');
  assert.equal(profile.emailVerified, true);
});
test('expired, wrong audience, wrong issuer, invalid signature, missing expiry/subject reject', async () => {
  for (const claims of [{ exp: 1 }, { aud: 'other.apps.googleusercontent.com' }, { iss: 'https://attacker.test' }, { exp: undefined }, { iat: undefined }, { email: undefined }, { email: 123 }, { sub: undefined }, { sub: '' }]) {
    const value = await token(claims);
    await assert.rejects(() => oauth().verifyGoogleIdToken(value), /token|identidad/i);
  }
  const invalid = await token({}, otherKey.privateKey);
  await assert.rejects(() => oauth().verifyGoogleIdToken(invalid), /token/i);
});
test('unconfigured audiences fail closed and web nonce is bound to its login', async () => {
  const value = await token({ nonce: 'expected' });
  await assert.rejects(() => oauth([]).verifyGoogleIdToken(value), /configurado/i);
  await assert.rejects(() => oauth().verifyGoogleIdToken(value, 'different'), /corresponde/i);
  assert.equal((await oauth().verifyGoogleIdToken(value, 'expected')).providerId, 'subject');
});
test('Google endpoint verifies before resolving identity and returns only MFA challenge', async () => {
  let sessions = 0, resolutions = 0, cookies = 0;
  const user = { id: 'user-test', isActive: true, totpEnabled: true };
  const auth = new AuthService({ resolveSocialLogin: async () => { resolutions++; return { user, droppedUnverifiedPassword: false }; } },
    { issue: async () => { sessions++; throw new Error('MFA must precede session'); } }, {},
    { createChallenge: async (id) => { assert.equal(id, user.id); return 'challenge'; } }, {}, {}, {}, {});
  const controller = new AuthController(auth, {}, oauth(), { write: () => { cookies++; } }, {});
  const response = await controller.googleToken({ token: await token() }, { headers: {} }, {});
  assert.deepEqual(response, { mfaRequired: true, mfaToken: 'challenge' });
  assert.equal(sessions, 0);
  assert.equal(cookies, 0);
  assert.equal(resolutions, 1);
  await assert.rejects(() => controller.googleToken({ token: 'invalid' }, {}, {}));
  assert.equal(resolutions, 1);
});
test('Expo config embeds public SDK client IDs and reversed iOS scheme, never client secret', () => {
  const names = ['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const previous = names.map(name => process.env[name]);
  try {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-web.apps.googleusercontent.com';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'test-ios.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-server-secret-must-stay-server-side';
    const config = require('../apps/mobile/app.config.js')();
    assert.equal(config.extra.googleWebClientId, process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
    assert.equal(config.extra.googleIosClientId, process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
    const plugin = config.plugins.find(value => Array.isArray(value) && value[0] === 'react-native-nitro-google-signin');
    assert.equal(plugin[1].iosUrlScheme, 'com.googleusercontent.apps.test-ios');
    assert.equal(JSON.stringify(config).includes(process.env.GOOGLE_CLIENT_SECRET), false);
  } finally {
    names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index]; });
  }
});
