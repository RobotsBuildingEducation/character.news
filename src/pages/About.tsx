import { useSeoMeta } from "@unhead/react";
import { Link } from "react-router-dom";

const About = () => {
  useSeoMeta({
    title: "About - Character News",
    description: "Learn more about Character News",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-prose text-center space-y-4">
        <h1 className="text-2xl font-bold">About Character News</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Social media and the news suck. There's a bunch of noise and tons of
          signals that aren't useful. This is a new app and it'll get a little
          better every time I work on an article.
        </p>

        <br />
        <Link to="/">
          Back to front page
        </Link>
      </div>
    </div>
  );
};

export default About;
