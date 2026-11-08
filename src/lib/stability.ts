import { tiltSines } from '@/lib/orientation';
import type { MotionSample } from '@/types/motion';

/**
 * Approximate distance (cm) from the ankles (sway pivot point) to the phone,
 * used as the default to convert the body's lean into an equivalent
 * lateral/anterior-posterior displacement.
 */
export const DEFAULT_PIVOT_HEIGHT_CM = 100;

const CHI_SQUARE_95_DF2 = 5.991;

/** Bump when the displacement maths changes so older saved series can be told apart. */
export const SWAY_MODEL_VERSION = 2;

export interface SwayPoint {
  t: number;
  /** Medio-lateral displacement estimate, cm (positive to the wearer's right). */
  x: number;
  /** Anterior-posterior displacement estimate, cm (positive forward). */
  y: number;
}

export interface SwayEllipse {
  /** Semi-axes of the 95% confidence ellipse, cm. */
  semiMajorCm: number;
  semiMinorCm: number;
  /** Rotation of the major axis from the x axis, radians. */
  angleRad: number;
}

export interface StabilityMetrics {
  points: SwayPoint[];
  durationS: number;
  /** Area of the 95% confidence ellipse of the sway trajectory, cm^2. Lower = more stable. */
  swayAreaCm2: number;
  /** The 95% confidence ellipse (centred on the trajectory's mean) whose area is `swayAreaCm2`. */
  ellipse: SwayEllipse;
  /** Total length of the sway path, cm. */
  pathLengthCm: number;
  /** Mean sway speed, cm/s. */
  meanVelocityCmPerS: number;
  /** Root-mean-square distance from the centroid, cm. */
  rmsCm: number;
  /**
   * Arbitrary inverse-of-sway-area score for at-a-glance comparison (higher = more stable).
   * Not a validated clinical measurement — only meaningful when comparing sessions
   * recorded the same way (same phone placement, same pivot height assumption).
   */
  stabilityIndex: number;
}

/**
 * Converts a sample's lean into an estimated sway displacement, in cm.
 * The lean comes from the gravity direction in the phone's frame; Euler angles are not used because
 * they are singular when the phone is held upright.
 */
export function sampleToSwayPoint(sample: MotionSample, pivotHeightCm: number): SwayPoint {
  const tilt = tiltSines(sample.gx, sample.gy, sample.gz) ?? { right: 0, forward: 0 };
  return {
    t: sample.t,
    x: pivotHeightCm * tilt.right,
    y: pivotHeightCm * tilt.forward,
  };
}

export function computeStabilityMetrics(
  samples: MotionSample[],
  pivotHeightCm: number,
): StabilityMetrics | null {
  if (samples.length < 2) return null;

  const points = samples.map((s) => sampleToSwayPoint(s, pivotHeightCm));
  const n = points.length;
  const durationS = (points[n - 1].t - points[0].t) / 1000;

  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

  let varX = 0;
  let varY = 0;
  let covXY = 0;
  let rmsSum = 0;
  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    varX += dx * dx;
    varY += dy * dy;
    covXY += dx * dy;
    rmsSum += dx * dx + dy * dy;
  }
  varX /= n;
  varY /= n;
  covXY /= n;
  const rmsCm = Math.sqrt(rmsSum / n);

  // Eigenvalues of the 2x2 covariance matrix give the confidence ellipse's semi-axes.
  const trace = varX + varY;
  const det = varX * varY - covXY * covXY;
  const discriminant = Math.max(0, (trace * trace) / 4 - det);
  const sqrtDisc = Math.sqrt(discriminant);
  const lambda1 = trace / 2 + sqrtDisc;
  const lambda2 = Math.max(0, trace / 2 - sqrtDisc);
  const swayAreaCm2 = Math.PI * CHI_SQUARE_95_DF2 * Math.sqrt(lambda1 * lambda2);
  const ellipse: SwayEllipse = {
    semiMajorCm: Math.sqrt(CHI_SQUARE_95_DF2 * lambda1),
    semiMinorCm: Math.sqrt(CHI_SQUARE_95_DF2 * lambda2),
    angleRad: 0.5 * Math.atan2(2 * covXY, varX - varY),
  };

  let pathLengthCm = 0;
  for (let i = 1; i < n; i++) {
    pathLengthCm += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  const meanVelocityCmPerS = durationS > 0 ? pathLengthCm / durationS : 0;

  // Arbitrary scale factor so typical sessions land in a readable 1-1000ish range.
  const stabilityIndex = 1000 / (swayAreaCm2 + 1);

  return { points, durationS, swayAreaCm2, ellipse, pathLengthCm, meanVelocityCmPerS, rmsCm, stabilityIndex };
}

/** Spacing between stored path points; keeps a saved trial small while the path stays readable. */
const SHAPE_SAMPLE_INTERVAL_MS = 200;

/** What is kept of a trial for overlay charts, centred on its own mean so trials align at the origin. */
export interface TrialShape {
  /** Downsampled path as [x, y] pairs in cm, relative to the trial's mean position. */
  path: [number, number][];
  ellipse: SwayEllipse;
}

const roundCm = (value: number) => Math.round(value * 100) / 100;

export function toTrialShape(metrics: StabilityMetrics): TrialShape {
  const { points, ellipse } = metrics;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  const path: [number, number][] = [];
  let lastKeptT = -Infinity;
  points.forEach((p, index) => {
    const isLast = index === points.length - 1;
    if (p.t - lastKeptT >= SHAPE_SAMPLE_INTERVAL_MS || isLast) {
      path.push([roundCm(p.x - meanX), roundCm(p.y - meanY)]);
      lastKeptT = p.t;
    }
  });

  return {
    path,
    ellipse: {
      semiMajorCm: roundCm(ellipse.semiMajorCm),
      semiMinorCm: roundCm(ellipse.semiMinorCm),
      angleRad: Math.round(ellipse.angleRad * 1000) / 1000,
    },
  };
}

export interface TrialAggregate {
  count: number;
  meanSwayAreaCm2: number;
  /** Sample standard deviation of sway area across trials, cm^2. */
  sdSwayAreaCm2: number;
  /** Coefficient of variation (SD / mean), percent — lower means more consistent trials. */
  cvPercent: number;
  /** Stability index derived from the mean sway area (not the mean of each trial's index). */
  meanStabilityIndex: number;
  meanPathLengthMm: number;
  sdPathLengthMm: number;
  cvPathLengthPercent: number;
}

/** Summarizes a series of repeated trials so their consistency (not just their average) is visible. */
export function aggregateTrials(trials: StabilityMetrics[]): TrialAggregate | null {
  if (trials.length === 0) return null;

  const areas = trials.map((trial) => trial.swayAreaCm2);
  const pathLengthsMm = trials.map((trial) => trial.pathLengthCm * 10);
  const n = trials.length;
  const meanSwayAreaCm2 = areas.reduce((sum, area) => sum + area, 0) / n;
  const meanPathLengthMm = pathLengthsMm.reduce((sum, length) => sum + length, 0) / n;

  const areaVariance =
    n > 1 ? areas.reduce((sum, area) => sum + (area - meanSwayAreaCm2) ** 2, 0) / (n - 1) : 0;
  const pathLengthVariance =
    n > 1
      ? pathLengthsMm.reduce((sum, length) => sum + (length - meanPathLengthMm) ** 2, 0) / (n - 1)
      : 0;
  const sdSwayAreaCm2 = Math.sqrt(areaVariance);
  const sdPathLengthMm = Math.sqrt(pathLengthVariance);
  const cvPercent = meanSwayAreaCm2 > 0 ? (sdSwayAreaCm2 / meanSwayAreaCm2) * 100 : 0;
  const cvPathLengthPercent = meanPathLengthMm > 0 ? (sdPathLengthMm / meanPathLengthMm) * 100 : 0;
  const meanStabilityIndex = 1000 / (meanSwayAreaCm2 + 1);

  return {
    count: n,
    meanSwayAreaCm2,
    sdSwayAreaCm2,
    cvPercent,
    meanStabilityIndex,
    meanPathLengthMm,
    sdPathLengthMm,
    cvPathLengthPercent,
  };
}
