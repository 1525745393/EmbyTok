export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
}

export function isLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}
