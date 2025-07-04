import { useEffect, useState } from 'react'
import { useNostr } from '@nostrify/react'
import { useNostrLogin, NLogin, NUser } from '@nostrify/react/login'
import { CashuMint, CashuWallet, MintQuoteState, Proof } from '@cashu/cashu-ts'
import { generateSecretKey } from 'nostr-tools'
import { bytesToHex } from '@noble/hashes/utils'

const SHEILFER_NIP05 = 'sheilfer@primal.net'
const WALLET_KIND = 17375
const ZAPINFO_KIND = 10019
const ZAP_KIND = 9321
const defaultMints = ['https://mint.chorus.community']

type Wallet = { privkey: string; mints: string[]; proofs: Proof[] }

export function useNostrCashuManager() {
  const { nostr } = useNostr()
  const { logins, addLogin, removeLogin } = useNostrLogin()
  const [user, setUser] = useState<NUser | undefined>()
  const [wallet, setWallet] = useState<Wallet | null>(null)

  const loginActions = {
    nsec(nsec: string) {
      const login = NLogin.fromNsec(nsec)
      addLogin(login)
      return login
    },
    async bunker(uri: string) {
      const login = await NLogin.fromBunker(uri, nostr)
      addLogin(login)
      return login
    },
    async extension() {
      const login = await NLogin.fromExtension()
      addLogin(login)
      return login
    },
    async logout() {
      const current = logins[0]
      if (current) removeLogin(current.id)
    }
  }

  useEffect(() => {
    const login = logins[0]
    if (!login) {
      setUser(undefined)
      return
    }
    switch (login.type) {
      case 'nsec':
        setUser(NUser.fromNsecLogin(login))
        break
      case 'bunker':
        setUser(NUser.fromBunkerLogin(login, nostr))
        break
      case 'extension':
        setUser(NUser.fromExtensionLogin(login))
        break
      default:
        setUser(undefined)
    }
  }, [logins, nostr])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      let w: Wallet | null = null
      const local = localStorage.getItem('cashu-' + user.pubkey)
      if (local) {
        try {
          w = JSON.parse(local) as Wallet
        } catch {
          w = null
        }
      }
      if (!w) {
        w = await fetchWalletFromNostr(user)
      }
      if (!w) {
        w = await createNewWallet()
        await saveWalletToNostr(user, w)
      }
      setWallet(w)
      localStorage.setItem('cashu-' + user.pubkey, JSON.stringify(w))
    })().catch(console.error)
  }, [user])

  const fetchWalletFromNostr = async (usr: NUser): Promise<Wallet | null> => {
    const events = await nostr.query([
      { kinds: [WALLET_KIND], authors: [usr.pubkey], limit: 1 }
    ])
    if (events.length === 0) return null
    const event = events[0]
    if (!usr.signer.nip44) return null
    const decrypted = await usr.signer.nip44.decrypt(usr.pubkey, event.content)
    const data = JSON.parse(decrypted) as string[][]
    const privkey = data.find(t => t[0] === 'privkey')?.[1]
    const mints = data.filter(t => t[0] === 'mint').map(t => t[1])
    if (!privkey) return null
    return { privkey, mints, proofs: [] }
  }

  const saveWalletToNostr = async (usr: NUser, w: Wallet) => {
    if (!usr.signer.nip44) return
    const tags = [
      ['privkey', w.privkey],
      ...w.mints.map(m => ['mint', m])
    ]
    const content = await usr.signer.nip44.encrypt(
      usr.pubkey,
      JSON.stringify(tags)
    )
    const event = await usr.signer.signEvent({
      kind: WALLET_KIND,
      content,
      tags: [],
      created_at: Math.floor(Date.now() / 1000)
    })
    await nostr.event(event)
  }

  const createNewWallet = async (): Promise<Wallet> => {
    const privkey = bytesToHex(generateSecretKey())
    return { privkey, mints: [...defaultMints], proofs: [] }
  }

  const balance = wallet ? wallet.proofs.reduce((sum, p) => sum + p.amount, 0) : 0

  const createDepositInvoice = async (amount: number) => {
    if (!wallet) throw new Error('Wallet not loaded')
    const mintUrl = wallet.mints[0]
    const mint = new CashuMint(mintUrl)
    const cw = new CashuWallet(mint)
    await cw.loadMint()
    const quote = await cw.createMintQuote(amount)
    return {
      mintUrl,
      amount,
      paymentRequest: quote.request,
      quoteId: quote.quote,
      state: quote.state
    }
  }

  const finalizeDeposit = async (quoteId: string, amount: number) => {
    if (!wallet) throw new Error('Wallet not loaded')
    const mintUrl = wallet.mints[0]
    const mint = new CashuMint(mintUrl)
    const cw = new CashuWallet(mint)
    await cw.loadMint()
    let attempts = 0
    while (attempts < 40) {
      const q = await cw.checkMintQuote(quoteId)
      if (q.state === MintQuoteState.PAID) break
      attempts++
      await new Promise(r => setTimeout(r, 3000))
    }
    const proofs = await cw.mintProofs(amount, quoteId)
    if (!wallet) return proofs
    const updated = { ...wallet, proofs: [...wallet.proofs, ...proofs] }
    setWallet(updated)
    if (user) {
      localStorage.setItem('cashu-' + user.pubkey, JSON.stringify(updated))
    }
    return proofs
  }

  const fetchNutzapInfo = async (recipientPubkey: string) => {
    const events = await nostr.query(
      [{ kinds: [ZAPINFO_KIND], authors: [recipientPubkey], limit: 1 }],
      { signal: AbortSignal.timeout(5000) }
    )
    if (events.length === 0) throw new Error('Recipient has no Cash wallet')
    const event = events[0]
    const relays = event.tags.filter(t => t[0] === 'relay').map(t => t[1])
    const mints = event.tags
      .filter(t => t[0] === 'mint')
      .map(t => ({ url: t[1], units: t.slice(2) }))
    const p2pkPubkey = event.tags.find(t => t[0] === 'pubkey')?.[1]
    if (!p2pkPubkey) throw new Error('No pubkey tag')
    return { event, relays, mints, p2pkPubkey }
  }

  const sendNutzap = async ({
    recipientInfo,
    proofs,
    mintUrl,
    comment = ''
  }: {
    recipientInfo: Awaited<ReturnType<typeof fetchNutzapInfo>>
    proofs: Proof[]
    mintUrl: string
    comment?: string
  }) => {
    if (!user) throw new Error('User not logged in')
    const tags = [
      ...proofs.map(p => ['proof', JSON.stringify(p)]),
      ['u', mintUrl],
      ['p', recipientInfo.event.pubkey]
    ]
    const event = await user.signer.signEvent({
      kind: ZAP_KIND,
      content: comment,
      tags,
      created_at: Math.floor(Date.now() / 1000)
    })
    await nostr.event(event)
  }

  const sendToken = async (
    mintUrl: string,
    amount: number,
    p2pkPubkey?: string
  ): Promise<Proof[]> => {
    if (!wallet) throw new Error('Wallet not loaded')
    const mint = new CashuMint(mintUrl)
    const cw = new CashuWallet(mint)
    await cw.loadMint()
    const proofs = wallet.proofs
    const { keep, send } = await cw.send(amount, proofs, {
      pubkey: p2pkPubkey,
      privkey: wallet.privkey
    })
    const updated = { ...wallet, proofs: keep }
    setWallet(updated)
    if (user) {
      localStorage.setItem('cashu-' + user.pubkey, JSON.stringify(updated))
    }
    return send
  }

  const zapSheilfer = async (amount: number, comment = '') => {
    if (!wallet) throw new Error('Wallet not loaded')
    const res = await fetch(
      'https://primal.net/.well-known/nostr.json?name=sheilfer'
    )
    const json = await res.json()
    const pubkey = json.names?.sheilfer
    if (!pubkey) throw new Error('Failed to resolve sheilfer nip05')
    const recipientInfo = await fetchNutzapInfo(pubkey)
    const mintUrl =
      wallet.mints.find(m => recipientInfo.mints.find(r => r.url === m)) ||
      wallet.mints[0]
    const proofs = await sendToken(mintUrl, amount, recipientInfo.p2pkPubkey)
    await sendNutzap({ recipientInfo, proofs, mintUrl, comment })
  }

  return {
    user,
    wallet,
    balance,
    loginActions,
    createDepositInvoice,
    finalizeDeposit,
    zapSheilfer
  }
}
