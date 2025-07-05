import { useSeoMeta } from "@unhead/react";
import { useIsAdmin } from "~/hooks/useIsAdmin";
import { AdminPostForm } from "~/components/AdminPostForm";
import { AdminCharacterForm } from "~/components/AdminCharacterForm";
import { AdminCharacterPostEditor } from "~/components/AdminCharacterPostEditor";
import { useNutsack } from "~/hooks/useNutsack";
import { Button } from "~/components/ui/button";
import { PostFeed } from "~/components/PostFeed";
import { Link } from "react-router-dom";

const Index = () => {
  useSeoMeta({
    title: "Character News",
    description: "News with AI summaries",
  });

  const isAdmin = useIsAdmin();
  const { balance, deposit, zap } = useNutsack();

  return (
    <div
      className="min-h-screen flex flex-col items-center gap-6 p-6"
      style={{ marginTop: 56 }}
    >
      <h1 className="text -2xl font-bold">Character News</h1>
      <Link to="/about" className="text-sm">
        About
      </Link>
      {/* <div className="text-center space-y-4">
        <p className="text-gray-800 dark:text-gray-200">Balance: {balance}</p>
        <Button onClick={() => deposit(1)}>Deposit 1</Button>
      </div> */}
      {isAdmin && (
        <div className="w-full max-w-xl space-y-4">
          <AdminPostForm />
          <AdminCharacterForm />
          <AdminCharacterPostEditor />
        </div>
      )}
      {/* {!isAdmin && <Button onClick={() => zap(1)}>Zap Admin</Button>} */}
      <div
        className="w-full max-w-xl"
        style={{ borderBottom: "1px solid #bfbfbf" }}
      >
        <PostFeed />
      </div>

      {/* {isAdmin && (
        <div className="w-full max-w-xl">
          <AdminArticleForm />
        </div>
      )} */}
      {/* {!isAdmin && <Button onClick={() => zap(1)}>Zap Admin</Button>} */}
    </div>
  );
};

export default Index;
