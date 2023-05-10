# Pongo UI

## Development

### Installation

If you have `npx` available, simply run `npx expo install` to install all dependencies.

### Local Dev

For web, `Call.tsx` should use the `react-native-webrtc-web-shim` library rather than `react-native-webrtc`

Certain features will not with in the Expo managed workflow on the Expo Go app.

1. `App.tsx` should be commented out on the lines for `@react-native-firebase/dynamic-links`
2. `PongoStackNavigator.tsx` should not import or use `Call.tsx`

### Building for Production

Check that the following have been done:

1. `App.tsx` should have `@react-native-firebase/dynamic-links` set up
2. `PongoStackNavigator.tsx` should import `Call.tsx`
3. `Call.tsx` should import the correct WebRTC library for web or mobile respectively

Build steps:

1. Ensure EAS CLI is installed with `npm i -g eas-cli`
2. iOS: run `eas build --platform ios` and follow the prompts
3. Android: run `eas build --platform android` and follow the prompts
4. Download the builds
5. Upload the builds to the App Store and Play Store


