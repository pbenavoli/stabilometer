export interface MotionSample {
  /** Milliseconds since the session started. */
  t: number;
  /** Rotation around the X axis (front-back tilt), radians. */
  pitch: number;
  /** Rotation around the Y axis (left-right tilt), radians. */
  roll: number;
  /** Rotation around the Z axis, radians. */
  yaw: number;
  /** Gravity-compensated acceleration, m/s^2. */
  ax: number;
  ay: number;
  az: number;
}
