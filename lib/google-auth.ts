import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const googleIosClientIdSuffix = googleIosClientId?.replace(
  /\.apps\.googleusercontent\.com$/,
  ''
);

export const googleIosUrlScheme = googleIosClientIdSuffix
  ? `com.googleusercontent.apps.${googleIosClientIdSuffix}`
  : null;

export const googleIosRedirectUri =
  Platform.OS === 'ios' && googleIosUrlScheme
    ? AuthSession.makeRedirectUri({
        native: `${googleIosUrlScheme}:/oauthredirect`,
      })
    : null;

export const googleAuthRequestConfig = {
  webClientId: googleWebClientId,
  iosClientId: googleIosClientId,
  ...(googleIosRedirectUri ? { redirectUri: googleIosRedirectUri } : {}),
} as const;

export function getGoogleConfigErrorMessage() {
  if (!googleWebClientId) {
    return 'Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.\n\nGet it from Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs (Web application type).';
  }

  if (Platform.OS === 'ios' && !googleIosClientId) {
    return 'Please add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to your .env file.\n\nGet it from Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs (iOS application type).';
  }

  return null;
}
