import { useSeoMeta } from "@unhead/react";
import { LoginArea } from "@/components/auth/LoginArea";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminPostForm } from "@/components/AdminPostForm";
import { useNutsack } from "@/hooks/useNutsack";
import { Button } from "@/components/ui/button";
import { PostFeed } from "@/components/PostFeed";

const Index = () => {
  useSeoMeta({
    title: "Character News",
    description: "News with AI summaries",
  });

  const isAdmin = useIsAdmin();
  const { balance, deposit, zap } = useNutsack();

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 p-6 bg-gray-100 dark:bg-gray-900">
      <LoginArea className="max-w-60" />
      <div className="text-center space-y-4">
        <p className="text-gray-800 dark:text-gray-200">Balance: {balance}</p>
        <Button onClick={() => deposit(1)}>Deposit 1</Button>
      </div>
      {isAdmin && (
        <div className="w-full max-w-xl">
          <AdminPostForm />
        </div>
      )}
      {!isAdmin && <Button onClick={() => zap(1)}>Zap Admin</Button>}
      <div className="w-full max-w-xl">
        <PostFeed />
      </div>
      {/* {isAdmin && (
        <div className="w-full max-w-xl">
          <AdminArticleForm />
        </div>
      )} */}
      {!isAdmin && <Button onClick={() => zap(1)}>Zap Admin</Button>}
    </div>
  );
};

export default Index;
