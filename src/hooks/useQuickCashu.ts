import { useState, useEffect, useCallback } from 'react';
import { useCashuWallet } from "~/hooks/useCashuWallet";
import { useCashuToken } from "~/hooks/useCashuToken";
import { useSendNutzap, useFetchNutzapInfo } from "~/hooks/useSendNutzap";
import {
  createLightningInvoice,
  mintTokensFromPaidInvoice,
} from "~/lib/cashuLightning";
import { useCashuStore } from "~/stores/cashuStore";
import type { NutzapInformationalEvent } from "~/stores/nutzapStore";

/**
 * Simple hook to deposit 10 sats and zap a predefined recipient.
 */
export function useQuickCashu() {
  const { wallet, updateProofs } = useCashuWallet();
  const { sendToken } = useCashuToken();
  const { sendNutzap } = useSendNutzap();
  const { fetchNutzapInfo } = useFetchNutzapInfo();
  const cashuStore = useCashuStore();

  const [invoice, setInvoice] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<NutzapInformationalEvent | null>(null);

  // Predefined recipient
  const recipientPubkey = 'ab216c04afb690e0ea069415273801c6fb7469c28de8c101e49eb031c00fe2d7';

  // Fetch recipient info on mount
  useEffect(() => {
    fetchNutzapInfo(recipientPubkey)
      .then(info => setRecipientInfo(info))
      .catch(() => setRecipientInfo(null));
  }, [fetchNutzapInfo]);

  const deposit10 = useCallback(async () => {
    if (!cashuStore.activeMintUrl) throw new Error('No active mint selected');
    setIsCreatingInvoice(true);
    try {
      const res = await createLightningInvoice(cashuStore.activeMintUrl, 10);
      setInvoice(res.paymentRequest);
      setQuoteId(res.quoteId);
      return res.paymentRequest;
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [cashuStore.activeMintUrl]);

  const finalizeDeposit = useCallback(async () => {
    if (!cashuStore.activeMintUrl || !quoteId) return false;
    const proofs = await mintTokensFromPaidInvoice(cashuStore.activeMintUrl, quoteId, 10);
    if (proofs.length > 0) {
      await updateProofs({ mintUrl: cashuStore.activeMintUrl, proofsToAdd: proofs, proofsToRemove: [] });
      setInvoice(null);
      setQuoteId(null);
      return true;
    }
    return false;
  }, [cashuStore.activeMintUrl, quoteId, updateProofs]);

  const zapRecipient = useCallback(async () => {
    if (!recipientInfo) throw new Error('Recipient info not loaded');
    if (!cashuStore.activeMintUrl) throw new Error('No active mint selected');
    const proofs = await sendToken(cashuStore.activeMintUrl, 10, recipientInfo.p2pkPubkey);
    await sendNutzap({ recipientInfo, proofs, mintUrl: cashuStore.activeMintUrl });
  }, [recipientInfo, sendToken, sendNutzap, cashuStore.activeMintUrl]);

  return {
    wallet,
    invoice,
    quoteId,
    isCreatingInvoice,
    deposit10,
    finalizeDeposit,
    zapRecipient,
  };
}

