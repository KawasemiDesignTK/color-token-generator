import { useMemo } from 'react';
import { generateScale, filterScale, generateNeutral } from '../utils/scale.js';
import { generateSemanticTokens } from '../utils/semantic.js';
import { makePresetGradients } from '../utils/gradient.js';

export function useColorEngine(primaryHex, secondaryHex, accentHex, steps, roleSteps) {
  const primaryFull = useMemo(() => generateScale(primaryHex), [primaryHex]);
  const secondaryFull = useMemo(() => generateScale(secondaryHex), [secondaryHex]);
  const accentFull = useMemo(() => generateScale(accentHex), [accentHex]);
  const neutralFull = useMemo(() => generateNeutral(primaryHex), [primaryHex]);

  const primaryScale = useMemo(() => filterScale(primaryFull, steps), [primaryFull, steps]);
  const secondaryScale = useMemo(() => filterScale(secondaryFull, steps), [secondaryFull, steps]);
  const accentScale = useMemo(() => filterScale(accentFull, steps), [accentFull, steps]);
  const neutralScale = useMemo(() => filterScale(neutralFull, steps), [neutralFull, steps]);

  const { light: semLight, dark: semDark } = useMemo(
    () => generateSemanticTokens(primaryHex, secondaryHex, accentHex, neutralFull, roleSteps),
    [primaryHex, secondaryHex, accentHex, neutralFull, roleSteps]
  );

  const presetGradients = useMemo(
    () => makePresetGradients(primaryFull, secondaryFull, accentFull),
    [primaryFull, secondaryFull, accentFull]
  );

  return {
    primaryFull, secondaryFull, accentFull, neutralFull,
    primaryScale, secondaryScale, accentScale, neutralScale,
    semLight, semDark,
    presetGradients,
  };
}
