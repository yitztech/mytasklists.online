const base = require('./app.json').expo;
const { withPodfile } = require('expo/config-plugins');
// GoogleSignIn 10 trae AppCheckCore, que necesita modular headers en sus dependencias. El plugin
// del SDK los añade, pero solo se carga con un client ID de iOS; sin él, `pod install` falla.
const GOOGLE_PODS = ['AppCheckCore', 'GoogleUtilities', 'RecaptchaInterop'].map(name => `  pod '${name}', :modular_headers => true`).join('\n');
const withGoogleModularHeaders = config => withPodfile(config, config => {
  if (!config.modResults.contents.includes("pod 'AppCheckCore'")) config.modResults.contents = config.modResults.contents.replace(/^(\s*config = use_native_modules)/m, `${GOOGLE_PODS}\n$1`);
  return config;
});
module.exports = () => {
  const release = ['production', 'direct'].includes(process.env.EAS_BUILD_PROFILE) || process.env.MYTASKLISTS_LOCAL_RELEASE === 'true';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || (release ? 'https://mytasklists.online/api' : base.extra.apiUrl);
  const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || (release ? 'https://mytasklists.online' : base.extra.socketUrl);
  if (release && [apiUrl, socketUrl].some(value => { const url = new URL(value); return url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname); })) throw new Error('A release build requires public HTTPS API and socket URLs');
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || base.extra.googleWebClientId;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || base.extra.googleIosClientId;
  const googlePlugins = [];
  // No Firebase files are needed on Android with an explicit webClientId.
  // iOS requires a reversed client ID URL scheme registered by the SDK plugin.
  if (googleIosClientId) {
    if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(googleIosClientId)) throw new Error('Invalid Google iOS client ID');
    googlePlugins.push(['react-native-nitro-google-signin', {
      iosUrlScheme: googleIosClientId.split('.').reverse().join('.'),
    }]);
  } else {
    googlePlugins.push(withGoogleModularHeaders);
  }
  return {...base, plugins:[...(base.plugins||[]),'expo-iap',...googlePlugins], ...(process.env.MYTASKLISTS_LOCAL_RELEASE==='true'?{updates:{enabled:false}}:{}), extra:{...base.extra,apiUrl,socketUrl,googleWebClientId,googleIosClientId,billingChannel:process.env.EXPO_PUBLIC_BILLING_CHANNEL||(process.env.EAS_BUILD_PLATFORM==='ios'?'app_store':'play')}};
};
