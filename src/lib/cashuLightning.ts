export async function createLightningInvoice(mintUrl: string, amount: number) {
  return { paymentRequest: '', quoteId: '' };
}

export async function mintTokensFromPaidInvoice(
  mintUrl: string,
  quoteId: string,
  amount: number
) {
  return [] as unknown[];
}
