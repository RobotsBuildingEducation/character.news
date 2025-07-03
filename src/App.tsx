// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from "@unhead/react/client";
import { InferSeoMetaPlugin } from "@unhead/addons";
import { Suspense } from "react";
import NostrProvider from "~/components/NostrProvider";
import { Toaster } from "~/components/ui/toaster";
import { Toaster as Sonner } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { NostrLoginProvider } from "@nostrify/react/login";
import { AppProvider } from "~/components/AppProvider";
import { AppConfig } from "~/contexts/AppContext";
import HeaderActions from "~/components/HeaderActions";
import WalletInitializer from "~/components/WalletInitializer";
import AppRouter from "./AppRouter";

const head = createHead({
  plugins: [InferSeoMetaPlugin()],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: "light",
  relayUrl: "wss://relay.damus.io",
};

const presetRelays = [
  { url: "wss://relay.damus.io", name: "Damus" },
  { url: "wss://relay.primal.net:443", name: "Primal" },
];

export function App() {
  return (
    <UnheadProvider head={head}>
      <AppProvider
        storageKey="nostr:app-config"
        defaultConfig={defaultConfig}
        presetRelays={presetRelays}
      >
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey="nostr:login">
            <NostrProvider>
              <WalletInitializer />
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Suspense>
                  <HeaderActions />
                  <AppRouter />
                </Suspense>
              </TooltipProvider>
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </AppProvider>
    </UnheadProvider>
  );
}

export default App;
