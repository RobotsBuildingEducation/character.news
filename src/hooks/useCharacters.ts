import { collection, getDocs, addDoc } from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools";
import { db } from "@/lib/firebaseResources";

export interface Character {
  id?: string;
  name: string;
  prompt: string;
  nsec: string;
  npub: string;
}

const colRef = collection(db, "characters");

export function useCharacters() {
  const queryClient = useQueryClient();

  const charactersQuery = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Character) }));
    },
  });

  const addCharacter = useMutation({
    mutationFn: async ({ name, prompt }: { name: string; prompt: string }) => {
      const sk = generatePrivateKey();
      const pk = getPublicKey(sk);
      const nsec = nip19.nsecEncode(sk);
      const npub = nip19.npubEncode(pk);
      await addDoc(colRef, { name, prompt, nsec, npub });
    },
    onSuccess: () => queryClient.invalidateQueries(["characters"]),
  });

  return { characters: charactersQuery.data ?? [], addCharacter };
}
