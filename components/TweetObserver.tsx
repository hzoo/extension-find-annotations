import { useEffect, useRef } from 'react';
import { extractTweet, recentTweets } from '@/lib/tweet-extractor';
import { hasTweet, storeTweet, cleanupOldTweets } from '@/lib/storage';

const TWEET_SELECTOR = '[data-testid="cellInnerDiv"]';
const OBSERVER_OPTIONS = {
  root: null,
  rootMargin: '50px',
  threshold: 0.5,
};

// How often to run cleanup (in milliseconds)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function TweetObserver() {
  const observedTweets = useRef(new Set<string>());

  useEffect(() => {
    console.log('TweetObserver: Setting up observers');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        console.log('TweetObserver: Tweet intersecting, attempting to extract');
        const tweetElement = entry.target;
        const tweet = extractTweet(tweetElement);
        
        if (tweet) {
          console.log('TweetObserver: Tweet extracted:', tweet.id);
          // Always store the tweet to update metrics
          observedTweets.current.add(tweet.id);
          
          // Update recentTweets signal
          const existingIndex = recentTweets.value.findIndex(t => t.id === tweet.id);
          if (existingIndex >= 0) {
            // Replace existing tweet with updated data
            const updatedTweets = [...recentTweets.value];
            updatedTweets[existingIndex] = tweet;
            recentTweets.value = updatedTweets;
            console.log('TweetObserver: Updated existing tweet:', tweet.id);
          } else {
            // Add new tweet
            recentTweets.value = [...recentTweets.value, tweet];
            console.log('TweetObserver: Added new tweet:', tweet.id);
          }
          
          // Store in localStorage (this will merge with existing data)
          storeTweet(tweet);
        } else {
          console.log('TweetObserver: Failed to extract tweet from element:', tweetElement);
        }
      });
    }, OBSERVER_OPTIONS);

    // Initial observation of existing tweets
    const existingTweets = document.querySelectorAll(TWEET_SELECTOR);
    console.log('TweetObserver: Found existing tweets:', existingTweets.length);
    existingTweets.forEach((tweet) => {
      observer.observe(tweet);
    });

    // Watch for new tweets being added
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches(TWEET_SELECTOR)) {
              console.log('TweetObserver: New tweet element added directly');
              observer.observe(node);
            } else {
              const newTweets = node.querySelectorAll(TWEET_SELECTOR);
              if (newTweets.length > 0) {
                console.log('TweetObserver: Found new tweets in added node:', newTweets.length);
                newTweets.forEach((tweet) => {
                  observer.observe(tweet);
                });
              }
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Periodically clean up old tweets
    const cleanupInterval = setInterval(() => {
      cleanupOldTweets();
    }, CLEANUP_INTERVAL);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      clearInterval(cleanupInterval);
    };
  }, []);

  // Debug view of collected tweets
  return (
    <div className="fixed bottom-4 right-4 bg-white/80 p-2 rounded-lg text-xs">
      Tweets collected: {recentTweets.value.length}
    </div>
  );
} 