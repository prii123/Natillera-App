import { usePathname } from 'next/navigation';

export function useNatilleraIdFromPath() {
  const pathname = usePathname();
  // Matches /natilleras/[id] or /natilleras/[id]/algo
  const match = pathname.match(/^\/natilleras\/(\w+)/);
  return match ? match[1] : null;
}
