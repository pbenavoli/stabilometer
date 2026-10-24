export interface MotionSample {
  /** Milliseconds since the session started. */
  t: number;
  /** Gravity in the phone's frame, m/s^2 (pointing down): x to the screen's right, y up the screen, z out of the screen. */
  gx: number;
  gy: number;
  gz: number;
  /** Gravity-compensated acceleration, m/s^2. */
  ax: number;
  ay: number;
  az: number;
}
