# Stabilometer

Stabilometer is an Expo / React Native app for recording and comparing phone-motion-based estimates of postural sway, with and without an orthosis. It is intended for exploratory comparison, not diagnosis or clinical decision-making.

## Features

- DeviceMotion recording with an audible countdown/start/end cues and haptic feedback.
- Configurable series of 1–5 trials (default 3) and 5–120 second trial duration in 5-second increments (default 30 seconds).
- Per-trial sway path, estimated cumulative path length, mean sway speed, 95% sway ellipse area, and an at-a-glance stability index.
- Locally saved series with condition labels and editable series names.
- Overlay chart comparing one `Without orthosis` series and one `With orthosis` series of the same duration. Paths and 95% ellipse outlines are shown in red and green respectively.
- Local options, series history, multi-select deletion, and clear-all controls.
- A **Live** tab that shows the current lean angles, a bubble level, and the raw yaw/pitch/roll values, for checking the sensor and the axis directions.

## Requirements

- Node.js and npm.
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

The development client connects to Metro. For a standalone internal preview build, use:

```sh
npx eas-cli@latest build --profile preview --platform ios
```

The iOS internal distribution build may require registering the device with the Apple Developer account. A production/App Store build uses the `production` profile in `eas.json`.

## Using the app

1. On the **Measure** tab, choose `Without orthosis` or `With orthosis`. Optionally type a **Default series label**, which is saved on the device and given to every new series (you can still edit a series' label later on the **Series** tab).
2. Open **Options** if you want to change trials per series or trial duration. Options cannot be changed mid-series.
3. Place the phone upright against the abdomen at navel height, screen facing outward. Tap start, wait through the countdown, and hold the phone steadily during the recording. The trial ends automatically at the selected duration; it can also be stopped manually.
4. Continue until the configured number of trials is complete. The completed series is saved locally.
5. On **Series**, review and label saved series. To remove some, press and hold a series: checkboxes appear and a bar at the top shows the number selected, an **All / None** toggle and a trash can. Tap series to select or deselect them, then tap the trash can and confirm. The ✕ cancels the selection.
6. On **Chart**, use **Configure chart** to choose one series per condition. Once one series is selected, the other condition is restricted to series with the same trial duration. **Clear chart** removes the current selections.

The chart's `Unit: … cm` label is its grid spacing. `Front` / `Back` identify the vertical direction; `Left` / `Right` identify the horizontal direction.

Use the **Live** tab to check the sensor before recording: lean forward, back, left and right and confirm the bubble and the angles move in the expected direction.

## How the estimates work

DeviceMotion reports the gravity direction in the phone's own frame. With the phone upright against the abdomen and its screen facing outward, the app treats the lean of that direction as the body's lean and converts it into estimated horizontal displacements with an inverted-pendulum approximation:

```text
x = H * (-gx / |g|)    left / right, positive to the wearer's right
y = H * ( gz / |g|)    front / back, positive forward
```

Here `g` is gravity in the phone frame (`accelerationIncludingGravity - acceleration`) and `H` is the assumed pivot-to-phone height, currently 100 cm. Yaw, pitch and roll are deliberately not used: with the phone upright, pitch sits near 90° where these Euler angles are ill-conditioned, which flattens one axis and inflates the other. Each charted trial path is centered on its own mean. The 95% sway area is calculated from the covariance ellipse of the estimated path. Saved chart paths are downsampled to approximately one point every 200 ms.

These measurements are **estimates**, not direct measurements from a force platform. The fixed height, phone placement, posture and device orientation affect the results. Keep placement and test conditions consistent when comparing series. The stability index is an arbitrary comparison aid and is not clinically validated. The app is not a medical device.

## Local data

Measurement options and saved series are stored on the device using `expo-sqlite/kv-store`. No account or remote sync is configured. Saved series include summary metrics and compact chart paths; raw motion samples are used during the active measurement but are not stored in the series history. Removing a series or clearing history deletes the corresponding local records.

Each saved series records the version of the sway model that produced it. Series recorded with the earlier yaw/pitch/roll model have inaccurate values: they are flagged in the **Series** tab and cannot be added to the chart. Remove them and record new series.

## Development checks

```sh
npx tsc --noEmit
npx expo lint
npx expo install --check
```

Expo SDK-compatible dependencies are listed in `package.json` and pinned by `package-lock.json`.
