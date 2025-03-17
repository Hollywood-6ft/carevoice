'use client';

import { DeepgramProvider } from '@/lib/contexts/DeepgramContext';
import { ReactNode } from 'react';

export default function DeepgramClientProvider({ children }: { children: ReactNode }) {
  return <DeepgramProvider>{children}</DeepgramProvider>;
} 