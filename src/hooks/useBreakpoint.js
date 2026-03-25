import { useState, useEffect } from 'react';

const BP = { tablet: 768, desktop: 1024 };

function getBreakpoint() {
  const w = window.innerWidth;
  if (w >= BP.desktop) return 'desktop';
  if (w >= BP.tablet) return 'tablet';
  return 'mobile';
}

export function useBreakpoint() {
  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    const mqT = window.matchMedia(`(min-width: ${BP.tablet}px)`);
    const mqD = window.matchMedia(`(min-width: ${BP.desktop}px)`);
    const update = () => setBp(getBreakpoint());
    mqT.addEventListener('change', update);
    mqD.addEventListener('change', update);
    return () => {
      mqT.removeEventListener('change', update);
      mqD.removeEventListener('change', update);
    };
  }, []);

  return { bp, isMobile: bp === 'mobile' };
}
