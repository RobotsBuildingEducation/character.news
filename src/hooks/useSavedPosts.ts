import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNostr } from "@nostrify/react";
import { nip19 } from "nostr-tools";
import type { NostrEvent } from "@nostrify/nostrify";

import { db } from "~/lib/firebaseResources";
import { useCurrentUser } from "./useCurrentUser";

export function useSavedPosts() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  const npub = user ? nip19.npubEncode(user.pubkey) : null;
  const docRef = npub ? doc(collection(db, "users"), npub) : null;

  const idsQuery = useQuery<string[]>({
    queryKey: ["savedPostIds", npub],
    queryFn: async () => {
      if (!docRef) return [];
      const snap = await getDoc(docRef);
      const data = snap.data() as { savedPostIds?: string[] } | undefined;
      return data?.savedPostIds ?? [];
    },
    enabled: !!docRef,
  });

  const eventsQuery = useQuery<NostrEvent[]>({
    queryKey: ["savedEvents", idsQuery.data?.join(",")],
    queryFn: async ({ signal }) => {
      const ids = idsQuery.data ?? [];
      if (!user || ids.length === 0) return [];
      const events = await nostr.query(
        [{ kinds: [1], ids }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]) }
      );
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user && (idsQuery.data ?? []).length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!docRef) throw new Error("Not logged in");
      await setDoc(docRef, { savedPostIds: arrayUnion(postId) }, { merge: true });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["savedPostIds", npub] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!docRef) throw new Error("Not logged in");
      await updateDoc(docRef, { savedPostIds: arrayRemove(postId) });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["savedPostIds", npub] }),
  });

  return {
    savedPostIds: idsQuery.data ?? [],
    savedEvents: eventsQuery.data ?? [],
    savePost: saveMutation.mutateAsync,
    removePost: removeMutation.mutateAsync,
  };
}
