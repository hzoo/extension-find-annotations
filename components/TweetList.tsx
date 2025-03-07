import { memo } from "preact/compat";
import { Tweet } from "@/components/Tweet";
import type { TweetData } from "@/lib/signals";

// A dedicated component for rendering the list of tweets
// Memoized to prevent unnecessary re-renders
const TweetList = memo(({ tweets }: { tweets: TweetData[] }) => {
  if (tweets.length === 0) {
    return null;
  }
  
  return (
    <div>
      {tweets.map(tweet => (
        <Tweet key={tweet.tweet_id} tweet={tweet} />
      ))}
    </div>
  );
});

export default TweetList; 