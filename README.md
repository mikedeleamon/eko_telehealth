# Eko Telehealth

A telehealth app for a great cause — built with React Native and Expo.

---

## Prerequisites

Make sure you have the following installed before getting started:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — install globally:
  ```bash
  npm install -g expo-cli
  ```
- [Watchman](https://facebook.github.io/watchman/) (macOS, recommended for file watching):
  ```bash
  brew install watchman
  ```

### For iOS development (macOS only)

- Xcode (latest version from the Mac App Store)
- Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- CocoaPods:
  ```bash
  sudo gem install cocoapods
  ```

### For Android development

- [Android Studio](https://developer.android.com/studio) with an emulator configured, or a physical Android device with USB debugging enabled.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd eko_telehealth
```

### 2. Install JavaScript dependencies

```bash
npm install
```

### 3. Install iOS native dependencies (macOS only)

```bash
cd ios && pod install && cd ..
```

---

## Running the App

This project uses `expo-dev-client`, so you need to run a native build rather than Expo Go.

### iOS Simulator (macOS only)

```bash
npm run ios
```

This builds the app and launches it in the iOS Simulator.

### Android Emulator

```bash
npm run android
```

This builds the app and launches it in the Android emulator. Make sure an emulator is running in Android Studio first.

### Start the Metro bundler only

If you already have a native build installed on your device or simulator, you can start just the JS bundler:

```bash
npm start
```

Then press `i` for iOS or `a` for Android in the terminal.

### Web (experimental)

```bash
npm run web
```

---

## Project Structure

```
eko_telehealth/
├── src/
│   ├── components/     # Shared UI components
│   ├── constants/      # App-wide constants (colors, fonts, etc.)
│   ├── context/        # React context providers (auth, etc.)
│   ├── navigation/     # Stack and tab navigators
│   ├── screens/        # Screen components grouped by flow
│   └── utils/          # Helper functions
├── assets/             # Images, fonts, and other static assets
├── ios/                # Native iOS project
├── App.tsx             # App entry point
├── app.json            # Expo configuration
└── package.json
```

---

## Troubleshooting

**Metro bundler port conflict**
```bash
npm start -- --port 8082
```

**iOS build fails after `npm install`**
```bash
cd ios && pod install && cd ..
```

**Clear Metro cache**
```bash
npm start -- --clear
```

**Reset node_modules**
```bash
rm -rf node_modules && npm install
```
