# Stabilometer

[Français](./README.fr.md)

Stabilometer is an Expo / React Native app for recording and comparing phone-motion-based estimates of postural sway, with and without an orthosis. It is intended for exploratory comparison, not diagnosis or clinical decision-making.

## Features

- DeviceMotion recording with an audible countdown/start/end cues and haptic feedback.
- Configurable series of 1–5 trials (default 3) and 5–120 second trial duration in 5-second increments (default 30 seconds).
- Configurable ankle-to-phone height (default 100 cm), used to estimate sway displacement.
- Per-trial sway path, estimated cumulative path length, mean sway speed, 95% sway ellipse area, and an at-a-glance stability index.
- Locally saved series with condition labels and editable series names.
- Overlay chart comparing one `Without orthosis` series and one `With orthosis` series of the same duration. Paths and 95% ellipse outlines are shown in red and green respectively.
- Local options, series history, multi-select deletion, and clear-all controls.
- A **Live** tab that shows the current lean angles, a bubble level, and the raw yaw/pitch/roll values, for checking the sensor and the axis directions.
- An **About** tab showing the application version and GPL license notice.

## Requirements

- Node.js 22.13 or newer on the 22 line, 24.3 or newer on the 24 line, or Node.js 26 or newer, and npm (Expo SDK 58 does not support odd-numbered Node.js releases).
- Expo Go on a supported physical device for the quickest sensor test, or an iOS development/preview build.
- DeviceMotion access enabled for the app.

## Install and run

Install the locked dependencies:

```sh
npm ci
```

Start the app for Expo Go:

```sh
npx expo start --go
```

Scan the QR code with Expo Go. For sensor measurements, use a physical phone; simulator sensor data may be unavailable or unsuitable.

For a development client, start Metro with:

```sh
npx expo start --dev-client
```

Build an iOS development client with EAS:

```sh
npx eas-cli@latest build --profile development --platform ios
```

The development client connects to Metro. After upgrading the Expo SDK, create and install a new development or preview build; an existing build contains native code for its previous SDK. For a standalone internal preview build, use:

```sh
npx eas-cli@latest build --profile preview --platform ios
```

The iOS internal distribution build may require registering the device with the Apple Developer account. A production/App Store build uses the `production` profile in `eas.json`.

## Using the app

1. On the **Measure** tab, choose `Without orthosis` or `With orthosis`. Enter the **Ankle-to-phone height**, in centimeters, measured from the ankle to the phone at navel height. It defaults to 100 cm and is saved on the device. Optionally type a **Default series label**, which is saved on the device and given to every new series (you can still edit a series' label later on the **Series** tab).
2. Open **Options** if you want to change trials per series or trial duration. Options cannot be changed mid-series.
3. Stand with heels touching and feet turned outward at a 60° angle between them, as shown in the [foot-position illustration](./Orthosis%20Feet%20Position.pdf), if comfortable and safe. Place the phone upright against the abdomen at navel height, screen facing outward. A trouser belt with a secure holder can help keep it in place without interfering with the orthosis. Tap start, wait through the countdown, and keep the phone steady during the recording. The trial ends automatically at the selected duration; it can also be stopped manually.
4. Continue until the configured number of trials is complete. The completed series is saved locally.
5. On **Series**, review and label saved series. To remove some, press and hold a series: checkboxes appear and a bar at the top shows the number selected, an **All / None** toggle and a trash can. Tap series to select or deselect them, then tap the trash can and confirm. The ✕ cancels the selection.
6. On **Chart**, use **Configure chart** to choose one series per condition. Once one series is selected, the other condition is restricted to series with the same trial duration. The chart warns if their ankle-to-phone heights differ. **Clear chart** removes the current selections.

The chart's `Unit: … cm` label is its grid spacing. `Front` / `Back` identify the vertical direction; `Left` / `Right` identify the horizontal direction.

Use the **Live** tab to check the sensor before recording: lean forward, back, left and right and confirm the bubble and the angles move in the expected direction.

## How the estimates work

DeviceMotion reports the gravity direction in the phone's own frame. With the phone upright against the abdomen and its screen facing outward, the app treats the lean of that direction as the body's lean and converts it into estimated horizontal displacements with an inverted-pendulum approximation:

```text
x = H * (-gx / |g|)    left / right, positive to the wearer's right
y = H * ( gz / |g|)    front / back, positive forward
```

Here `g` is gravity in the phone frame (`accelerationIncludingGravity - acceleration`) and `H` is the entered ankle-to-phone height, defaulting to 100 cm. Yaw, pitch and roll are deliberately not used: with the phone upright, pitch sits near 90° where these Euler angles are ill-conditioned, which flattens one axis and inflates the other. Each charted trial path is centered on its own mean. The 95% sway area is calculated from the covariance ellipse of the estimated path. Saved chart paths are downsampled to approximately one point every 200 ms.

These measurements are **estimates**, not direct measurements from a force platform. The entered height, phone placement, posture and device orientation affect the results. Keep the height, placement and test conditions consistent when comparing series. The stability index is an arbitrary comparison aid and is not clinically validated. The app is not a medical device.

## Local data

Measurement options and saved series are stored on the device using `expo-sqlite/kv-store`. No account or remote sync is configured. Saved series include the ankle-to-phone height, summary metrics and compact chart paths; earlier series used 100 cm. Raw motion samples are used during the active measurement but are not stored in the series history. Removing a series or clearing history deletes the corresponding local records.

Each saved series records the version of the sway model that produced it. Series recorded with the earlier yaw/pitch/roll model have inaccurate values: they are flagged in the **Series** tab and cannot be added to the chart. Remove them and record new series.

## Development checks

```sh
npx tsc --noEmit
npx expo lint
npx expo install --check
npx expo-doctor
node --test tests/pivot-height.test.cjs
```

Expo SDK-compatible dependencies are listed in `package.json` and pinned by `package-lock.json`.
Web output is explicitly kept as a single-page bundle with synchronous routes, preserving the SDK 57 defaults.

The application version displayed in **About** comes from `expo.version` in `app.json` (currently `1.0.0`). Update it for releases; `package.json` has a separate npm package version.
