import { NatilleraProvider } from '@/contexts/NatilleraContext';

export default function NatillerasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NatilleraProvider>
      {children}
    </NatilleraProvider>
  );
}