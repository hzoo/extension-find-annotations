import { signal } from "@preact/signals-react";

export interface TweetData {
  id: string;
  username: string;
  displayName: string;
  text: string;
  timestamp: string;
  timeViewed: number;
  metrics: {
    replies: number;
    retweets: number;
    likes: number;
    views: number;
    bookmarks: number;
  };
  isRetweet: boolean;
  retweetedBy?: string;
}

export const recentTweets = signal<TweetData[]>([]);

export function extractTweetId(element: Element): string {
  // Tweet URLs are in format /username/status/id
  const links = element.querySelectorAll('a[href*="/status/"]');
  console.log('TweetObserver: Found status links:', links.length, Array.from(links).map(l => l.getAttribute('href')));
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href?.includes('/status/')) {
      return href.split('/status/')[1];
    }
  }
  return '';
}

export function extractUserInfo(element: Element) {
  try {
    // Find the user name container using data-testid
    const userNameEl = element.querySelector('[data-testid="User-Name"]');
    console.log('TweetObserver: Found user name element:', !!userNameEl);
    
    if (!userNameEl) return { displayName: '', username: '' };

    // Find all links within the User-Name element
    const links = Array.from(userNameEl.querySelectorAll('a'));
    
    // The first link typically contains the display name
    const displayNameLink = links.find(link => {
      const href = link.getAttribute('href');
      return href && !href.includes('analytics') && !href.includes('status');
    });
    
    // Get display name from the first text-containing span in the link
    const displayName = displayNameLink
      ?.querySelector('span')
      ?.textContent
      ?.trim() || '';

    // Username is in the href of the same link
    const username = displayNameLink
      ?.getAttribute('href')
      ?.replace('/', '') || '';

    console.log('TweetObserver: Extracted user info:', { displayName, username });
    return { displayName, username };
  } catch (error) {
    console.error('TweetObserver: Error extracting user info:', error);
    return { displayName: '', username: '' };
  }
}

export function extractText(element: Element): string {
  const textEl = element.querySelector('[data-testid="tweetText"]');
  return textEl?.textContent || '';
}

export function extractMetrics(element: Element) {
  const metrics = {
    replies: 0,
    retweets: 0,
    likes: 0,
    views: 0,
    bookmarks: 0
  };

  try {
    // Extract metrics using data-testid selectors
    const replyButton = element.querySelector('[data-testid="reply"]');
    const retweetButton = element.querySelector('[data-testid="retweet"]');
    const likeButton = element.querySelector('[data-testid="like"]');
    const analyticsLink = element.querySelector('a[href*="/analytics"]');

    // Helper function to extract number from text content
    const extractNumber = (el: Element | null): number => {
      if (!el) return 0;
      const text = el.textContent || '';
      const match = text.match(/\d+(\.\d+)?K?M?/);
      if (!match) return 0;
      
      const num = match[0];
      if (num.endsWith('K')) return Number.parseFloat(num) * 1000;
      if (num.endsWith('M')) return Number.parseFloat(num) * 1000000;
      return Number.parseInt(num, 10);
    };

    metrics.replies = extractNumber(replyButton);
    metrics.retweets = extractNumber(retweetButton);
    metrics.likes = extractNumber(likeButton);
    metrics.views = extractNumber(analyticsLink);

    console.log('TweetObserver: Extracted metrics:', metrics);
  } catch (error) {
    console.error('TweetObserver: Error extracting metrics:', error);
  }

  return metrics;
}

export function extractTimestamp(element: Element): string {
  const timeEl = element.querySelector('time');
  return timeEl?.getAttribute('datetime') || '';
}

export function extractRetweetInfo(element: Element): { isRetweet: boolean; retweetedBy?: string } {
  const socialContext = element.querySelector('[data-testid="socialContext"]');
  if (!socialContext) return { isRetweet: false };

  const text = socialContext.textContent || '';
  if (text.includes('reposted')) {
    // Extract username from the link in socialContext
    const username = socialContext.querySelector('a')?.getAttribute('href')?.replace('/', '') || '';
    return { isRetweet: true, retweetedBy: username };
  }

  return { isRetweet: false };
}

export function extractTweet(element: Element): TweetData | null {
  try {
    console.log(`TweetObserver: Starting tweet extraction for element: ${element.outerHTML.slice(0, 200)}...`);
    
    const id = extractTweetId(element);
    console.log('TweetObserver: Extracted ID:', id);
    if (!id) return null;

    const { username, displayName } = extractUserInfo(element);
    if (!username || !displayName) {
      console.log('TweetObserver: Failed to extract user info');
      return null;
    }

    const text = extractText(element);
    const timestamp = extractTimestamp(element);
    const metrics = extractMetrics(element);
    const { isRetweet, retweetedBy } = extractRetweetInfo(element);

    console.log('TweetObserver: Successfully extracted tweet:', {
      id,
      username,
      displayName,
      text: `${text.slice(0, 50)}...`,
      timestamp,
      metrics,
      isRetweet,
      retweetedBy
    });

    return {
      id,
      username,
      displayName,
      text,
      timestamp,
      timeViewed: Date.now(),
      metrics,
      isRetweet,
      retweetedBy
    };
  } catch (error) {
    console.error('Error extracting tweet:', error);
    return null;
  }
} 