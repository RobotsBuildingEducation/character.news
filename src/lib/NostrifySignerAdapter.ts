import type { NostrSigner } from '@nostrify/nostrify';
import NDK, { NDKUser, type NDKSigner, type NDKRelay, type NDKEncryptionScheme } from '@nostr-dev-kit/ndk';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Adapter between Nostrify's NostrSigner and NDK's NDKSigner interface.
 */
export class NostrifySignerAdapter implements NDKSigner {
  private _pubkey?: string;
  private _user?: NDKUser;
  private _userPromise?: Promise<NDKUser>;

  constructor(private signer: NostrSigner, private ndk?: NDK) {}

  /**
   * Attach the NDK instance after construction.
   */
  setNdk(ndk: NDK) {
    this.ndk = ndk;
  }

  get pubkey(): string {
    if (!this._pubkey) throw new Error('Not ready');
    return this._pubkey;
  }

  async blockUntilReady(): Promise<NDKUser> {
    const pubkey = await this.signer.getPublicKey();
    this._pubkey = pubkey;
    const user = this.ndk ? this.ndk.getUser({ pubkey }) : new NDKUser({ pubkey });
    this._user = user;
    this._userPromise = Promise.resolve(user);
    return user;
  }

  async user(): Promise<NDKUser> {
    if (!this._userPromise) {
      return this.blockUntilReady();
    }
    return this._userPromise;
  }

  get userSync(): NDKUser {
    if (!this._user) throw new Error('User not ready');
    return this._user;
  }

  async sign(event: NostrEvent): Promise<string> {
    const signed = await this.signer.signEvent(event);
    return signed.sig;
  }

  async relays(ndk: NDK = this.ndk as NDK): Promise<NDKRelay[]> {
    const relays = await this.signer.getRelays?.();
    if (!relays) return [];
    const { NDKRelay } = await import('@nostr-dev-kit/ndk');
    return Object.entries(relays)
      .filter(([, pol]) => pol.read && pol.write)
      .map(([url]) => new NDKRelay(url, ndk?.relayAuthDefaultPolicy, ndk));
  }

  async encryptionEnabled(scheme?: NDKEncryptionScheme): Promise<NDKEncryptionScheme[]> {
    const enabled: NDKEncryptionScheme[] = [];
    if (!scheme || scheme === 'nip04') if (this.signer.nip04) enabled.push('nip04');
    if (!scheme || scheme === 'nip44') if (this.signer.nip44) enabled.push('nip44');
    return enabled;
  }

  async encrypt(recipient: NDKUser, value: string, scheme: NDKEncryptionScheme = 'nip04'): Promise<string> {
    if (scheme === 'nip44' && this.signer.nip44) {
      return this.signer.nip44.encrypt(recipient.pubkey, value);
    }
    if (scheme === 'nip04' && this.signer.nip04) {
      return this.signer.nip04.encrypt(recipient.pubkey, value);
    }
    throw new Error('Encryption not supported');
  }

  async decrypt(sender: NDKUser, value: string, scheme: NDKEncryptionScheme = 'nip04'): Promise<string> {
    if (scheme === 'nip44' && this.signer.nip44) {
      return this.signer.nip44.decrypt(sender.pubkey, value);
    }
    if (scheme === 'nip04' && this.signer.nip04) {
      return this.signer.nip04.decrypt(sender.pubkey, value);
    }
    throw new Error('Decryption not supported');
  }

  toPayload(): string {
    return JSON.stringify({ type: 'nostrify-signer' });
  }
}
