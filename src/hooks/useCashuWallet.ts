import { useCurrentUser } from "./useCurrentUser";
import { useEffect, useState } from "react";

interface Wallet {
  balance: number;
}

interface UpdateArgs {
  mintUrl: string;
  proofsToAdd: unknown[];
  proofsToRemove: unknown[];
}

interface CashuState {
  wallet: Wallet | null;
}

let memoryState: CashuState = { wallet: null };
const listeners: Array<(state: CashuState) => void> = [];

function updateState(partial: Partial<CashuState>) {
  memoryState = { ...memoryState, ...partial };
  for (const l of listeners) l(memoryState);
}

export function useCashuWallet() {
  const { user } = useCurrentUser();
  const [state, setState] = useState<CashuState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  // Initialize or reset wallet when user changes
  useEffect(() => {
    if (user && !memoryState.wallet) {
      updateState({ wallet: { balance: 0 } });
    }
    if (!user && memoryState.wallet) {
      updateState({ wallet: null });
    }
  }, [user]);

  const updateProofs = async ({ proofsToAdd, proofsToRemove }: UpdateArgs) => {
    const diff = proofsToAdd.length - proofsToRemove.length;
    const balance = (memoryState.wallet?.balance ?? 0) + diff;
    updateState({ wallet: { balance } });
  };

  return { wallet: state.wallet, updateProofs };
}
