const base = require('./app.json').expo;
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
  }
  return {...base, plugins:[...(base.plugins||[]),'expo-iap',...googlePlugins], ...(process.env.MYTASKLISTS_LOCAL_RELEASE==='true'?{updates:{enabled:false}}:{}), extra:{...base.extra,apiUrl,socketUrl,googleWebClientId,googleIosClientId,billingChannel:process.env.EXPO_PUBLIC_BILLING_CHANNEL||(process.env.EAS_BUILD_PLATFORM==='ios'?'app_store':'play')}};
};
