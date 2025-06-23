import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useNutsack() {
  const [balance, setBalance] = useLocalStorage<number>('nutsack:balance', 0);

  const deposit = useCallback((amount: number) => {
    setBalance((b) => b + amount);
  }, [setBalance]);

  const zap = useCallback((amount: number) => {
    setBalance((b) => b - amount);
  }, [setBalance]);

  return { balance, deposit, zap };
}
