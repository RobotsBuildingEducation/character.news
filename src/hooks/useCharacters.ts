import { collection, getDocs, addDoc } from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { db } from "~/lib/firebaseResources";
import { HISTORIAN_NSEC } from "~/constants";

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

  const _historian = (() => {
    const sk = nip19.decode(HISTORIAN_NSEC).data as Uint8Array;
    const pk = getPublicKey(sk);
    return {
      id: "historian",
      name: "Historian",
      prompt:
        "Give information and educational background before discussing the current state of affairs. Additionally, offer frequent debates related to the matter and forms of propaganda that may be flourishing as a result of it. Make it expository and connect the dots in the timeline for the audience to process further. You aren't writing as a character but the essence of the character in order to write intelligently on the subject. The only formatting should be spaces between paragraphs. Do not use lists at all, write as if it's an essay of news. Headers should be a max of ### size. Never indicate any context or attributes provided in this prompt in your response, like saying things like 'as a historian..'",
      nsec: HISTORIAN_NSEC,
      npub: nip19.npubEncode(pk),
    } as Character;
  })();

  const charactersQuery = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Character) }));
    },
  });

  const addCharacter = useMutation({
    mutationFn: async ({ name, prompt }: { name: string; prompt: string }) => {
      const sk = generateSecretKey();
      const pk = getPublicKey(sk);
      const nsec = nip19.nsecEncode(sk);
      const npub = nip19.npubEncode(pk);
      await addDoc(colRef, { name, prompt, nsec, npub });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["characters"] }),
  });

  return {
    characters: [...(charactersQuery.data ?? [])],
    addCharacter,
  };
}
