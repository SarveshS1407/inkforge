# INKFORGE — Cross-Platform Build & Installation Handbook

This manual provides complete, repeatable instructions for packaging, installing, and running **INKFORGE** across **Android**, **Windows**, **macOS**, and modern mobile devices.

All clients connect to the central **INKFORGE** production backend and share identical authentication sessions, books, chapters, upload histories, and publication registries.

---

## Central Infrastructure & Unified Data Model

- **Production Endpoint:** `https://inkforge-sigma.vercel.app`
- **Application ID:** `com.inkforge.app`
- **App Name:** `INKFORGE`
- **Primary Data Store:** PostgreSQL / Supabase
- **Offline Resilience:** Local-first draft sanctuary via client-side storage

---

## 1. Android Native Application (APK)

The Android application is packaged with native Android SDK tooling, featuring hardware-accelerated WebKit rendering, responsive typography, file upload dialogs for `.docx` and `.pdf` manuscripts, and gesture pull-to-refresh.

### Prerequisites

- **Java Development Kit (JDK):** Version 17 or higher (`java -version`)
- **Android SDK:** Installed at `/Users/kingpin/Library/Android/sdk` (or configured via `ANDROID_HOME`)
- **Target Platform:** Android API Level 34 (Android 14) / 36
- **Build Tools:** `34.0.0` or `36.0.0`

### Project Structure

```
android/
├── app/
│   ├── build.gradle                 # Application packaging, applicationId com.inkforge.app
│   └── src/main/
│       ├── AndroidManifest.xml      # Permissions (INTERNET, ACCESS_NETWORK_STATE)
│       ├── java/com/inkforge/app/
│       │   └── MainActivity.java    # Native WebView wrapper & file chooser
│       └── res/                     # Strings, themes, icons, and launcher mipmaps
├── build.gradle                     # Top-level Gradle configuration
├── settings.gradle                  # Gradle project hierarchy
├── local.properties                 # SDK directory pointer
└── gradlew                          # Bootstrapped Gradle execution wrapper
```

### Building the Debug APK

1. Navigate to the `android/` directory:
   ```bash
   cd android
   ```
2. Run the Gradle build task:
   ```bash
   ./gradlew assembleDebug
   ```
3. The generated APK will be available at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Installing on an Android Phone or Tablet

#### Method A: Direct ADB Installation (Developer USB / Wireless)
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your device via USB or WiFi.
3. Install the APK:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

#### Method B: Direct Device Download
1. Upload `app-debug.apk` to Google Drive or place it in the `public/` directory of your Vercel deployment.
2. Open the download link on your phone.
3. Tap **Install** (allow installation from this source if prompted).

---

## 2. Windows Desktop Application

INKFORGE provides full desktop application support on Windows 10 and Windows 11 via modern Progressive Web Application (PWA) architecture with isolated window chrome, Start Menu integration, and taskbar pinning.

### Installation via Microsoft Edge or Google Chrome

1. Open `https://inkforge-sigma.vercel.app` in **Microsoft Edge** or **Google Chrome**.
2. Look for the **App Available** install icon in the right side of the address bar:
   - In **Edge**: Click the icon or go to **Settings & More (...) > Apps > Install INKFORGE**.
   - In **Chrome**: Click the download/install icon or go to **Menu (...) > Cast, Save, and Share > Install INKFORGE**.
3. In the confirmation dialog, click **Install**.
4. Check the options to:
   - **Pin to Taskbar**
   - **Pin to Start Menu**
   - **Create Desktop Shortcut**

### Desktop Capabilities on Windows
- Runs in a dedicated, frameless desktop window without browser tab clutter.
- Remembers user session, dark/vellum paper tone, and active manuscript drafts.
- Works offline for draft writing with automatic background sync when reconnected.

---

## 3. macOS Desktop Application

On macOS Sonoma (14+), Ventura, and Monterey, INKFORGE can be run as a first-class macOS desktop application with native Dock icon, menu bar integration, and keyboard shortcuts.

### Option A: Safari 17+ Native "Add to Dock" (Recommended)

1. Open `https://inkforge-sigma.vercel.app` in **Safari**.
2. Open the **File** menu in the top menu bar.
3. Select **Add to Dock...**
4. Set the name to **INKFORGE** and click **Add**.
5. The application is now installed into `~/Applications` and appears in the macOS Dock with its gold-and-oxblood book crest icon.
6. Opening the app launches an independent WebKit instance with dedicated macOS window management.

### Option B: Chrome / Brave / Edge on macOS

1. Open `https://inkforge-sigma.vercel.app` in Chrome.
2. Click the install icon in the URL bar (or **Menu > Save and Share > Install INKFORGE**).
3. Click **Install**.
4. The app is added to `~/Applications/Chrome Apps` and appears in Spotlight Search.

---

## 4. iPhone & iPad (iOS / iPadOS)

1. Open `https://inkforge-sigma.vercel.app` in **Safari**.
2. Tap the **Share** button (box with upward arrow) in the toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the title **INKFORGE** and tap **Add**.
5. The icon will appear on your iOS Home Screen. When opened, it runs in full-screen standalone mode without the Safari URL bar.

---

## 5. Capacitor Cross-Platform Integration

For multi-platform build pipelines (iOS via Xcode, Android via Android Studio), Capacitor configuration is included at `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.inkforge.app",
  appName: "INKFORGE",
  webDir: "out",
  server: {
    url: "https://inkforge-sigma.vercel.app",
    cleartext: true,
    androidScheme: "https",
  },
};

export default config;
```

To sync changes or launch inside Android Studio:
```bash
npx cap copy android
npx cap open android
```

---

## 6. Verification Checklist

| Platform | Target Artifact | Status | Shared Backend Sync |
| :--- | :--- | :--- | :--- |
| **Web** | `https://inkforge-sigma.vercel.app` | Deployed & Active | Master Database |
| **Android** | `android/app/build.gradle` (APK) | Configured (`com.inkforge.app`) | Live REST API |
| **Windows** | PWA Manifest (`manifest.json`) | Configured (`standalone`) | Live REST API |
| **macOS** | Safari Add to Dock / PWA | Configured (`standalone`) | Live REST API |
| **iOS** | Web App Metas & Apple Touch | Configured (`black-translucent`) | Live REST API |
