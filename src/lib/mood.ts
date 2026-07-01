// Shared mood scale: maps the 1-10 mood value (AI-extracted or manual) into
// 5 human bands with a color and a face icon. Pure — safe on client and server.

export type MoodBand = 1 | 2 | 3 | 4 | 5;

export const MOOD_BANDS: { band: MoodBand; label: string; color: string; icon: string }[] = [
  { band: 5, label: "отлично", color: "#639922", icon: "ti-mood-happy" },
  { band: 4, label: "хорошо", color: "#1D9E75", icon: "ti-mood-smile" },
  { band: 3, label: "так себе", color: "#EF9F27", icon: "ti-mood-neutral" },
  { band: 2, label: "плохо", color: "#D85A30", icon: "ti-mood-sad" },
  { band: 1, label: "ужасно", color: "#E24B4A", icon: "ti-mood-cry" },
];

export function bandOf(mood: number): MoodBand {
  if (mood >= 9) return 5;
  if (mood >= 7) return 4;
  if (mood >= 5) return 3;
  if (mood >= 3) return 2;
  return 1;
}

export function bandMeta(b: MoodBand) {
  return MOOD_BANDS.find((x) => x.band === b) || MOOD_BANDS[2];
}

// One-tap bot buttons pick a band; store a representative 1-10 value.
export const BAND_TO_MOOD: Record<MoodBand, number> = { 5: 10, 4: 8, 3: 6, 2: 4, 1: 2 };
