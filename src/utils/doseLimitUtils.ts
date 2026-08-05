export type DoseLimitViolation =
  | {
      type: 'max_24h';
      max: number;
      /** Existing doses in the rolling window before the proposed dose */
      countInWindow: number;
    }
  | {
      type: 'min_interval';
      minMinutes: number;
      minutesSinceLast: number;
    };

export function evaluateDoseLimits(args: {
  proposedTakenAtMs: number;
  /** Prior dose timestamps (ms), any order */
  priorTakenAtMs: number[];
  maxDoses24h: number | null | undefined;
  minIntervalMinutes: number | null | undefined;
}): DoseLimitViolation[] {
  const {
    proposedTakenAtMs,
    priorTakenAtMs,
    maxDoses24h,
    minIntervalMinutes,
  } = args;

  const violations: DoseLimitViolation[] = [];
  const windowStart = proposedTakenAtMs - 24 * 60 * 60 * 1000;

  const inWindow = priorTakenAtMs.filter(
    (t) => t > windowStart && t <= proposedTakenAtMs
  );

  if (maxDoses24h != null && maxDoses24h > 0) {
    const afterAdd = inWindow.length + 1;
    if (afterAdd > maxDoses24h) {
      violations.push({
        type: 'max_24h',
        max: maxDoses24h,
        countInWindow: inWindow.length,
      });
    }
  }

  if (minIntervalMinutes != null && minIntervalMinutes > 0) {
    const prior = priorTakenAtMs.filter((t) => t <= proposedTakenAtMs);
    if (prior.length > 0) {
      const last = Math.max(...prior);
      const minutesSinceLast = (proposedTakenAtMs - last) / (60 * 1000);
      if (minutesSinceLast < minIntervalMinutes) {
        violations.push({
          type: 'min_interval',
          minMinutes: minIntervalMinutes,
          minutesSinceLast: Math.max(0, Math.round(minutesSinceLast)),
        });
      }
    }
  }

  return violations;
}

export function formatIntervalMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${hours}h ${mins}m`;
}

export function describeDoseLimitViolations(violations: DoseLimitViolation[]): string[] {
  return violations.map((v) => {
    if (v.type === 'max_24h') {
      return `This would be dose ${v.countInWindow + 1} in 24 hours (maximum set to ${v.max}).`;
    }
    return `Only ${formatIntervalMinutes(v.minutesSinceLast)} since the last dose (minimum gap is ${formatIntervalMinutes(v.minMinutes)}).`;
  });
}
