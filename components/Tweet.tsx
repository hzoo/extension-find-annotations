import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { memo } from "preact/compat";

import {LoadingTweet} from "@/components/LoadingTweet";
import { supabase } from "@/lib/supabase";
import { getUserData, setUserData } from "@/lib/userCache";
import { getExpandedUrl } from "@/lib/urlCache";
import type { TweetData } from "@/lib/signals";

// Define types for extended entities and media
interface MediaEntity {
  type: string;
  media_url_https: string;
  url: string;
  id_str: string;
}

interface ExtendedEntities {
  media: MediaEntity[];
}

// Extended TweetData type with optional extended_entities
interface ExtendedTweetData extends TweetData {
  extended_entities?: ExtendedEntities;
  verified?: boolean;
}

// Helper function to clean URLs for display
function cleanUrlForDisplay(url: string, maxLength = 25): string {
  return url
    // Remove protocol (http://, https://)
    .replace(/^https?:\/\//, '')
    // Remove www. prefix
    .replace(/^www\./, '')
    // Truncate if too long
    .slice(0, maxLength) + (url.length > maxLength ? '...' : '');
}

// Convert text with URLs and usernames to HTML with links
function linkify(text: string) {
  // Create a combined regex that captures both URLs and usernames
  // The regex uses capturing groups to differentiate between URLs and usernames
  const combinedRegex = /(https?:\/\/[^\s<]+)|(@\w+)/g;
  
  // First, replace URLs and usernames with placeholder tokens
  // This prevents them from being affected by HTML escaping
  const tokens: Record<string, string> = {};
  let tokenCounter = 0;
  
  const tokenizedText = text.replace(combinedRegex, (match) => {
    const token = `__TOKEN_${tokenCounter++}__`;
    tokens[token] = match;
    return token;
  });
  
  // Now escape HTML in the remaining text
  const escapedText = tokenizedText.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char]!,
  );
  
  // Finally, replace tokens with their HTML link versions
  return escapedText.replace(/__TOKEN_(\d+)__/g, (_, index) => {
    const originalMatch = tokens[`__TOKEN_${index}__`];
    
    // Check if it's a URL
    if (originalMatch.startsWith('http')) {
      const trimmedUrl = originalMatch.replace(/[.,;:]$/, "");
      
      // Handle t.co URLs
      if (trimmedUrl.includes('t.co/')) {
        // If we have an expanded URL for this t.co URL, use it
        const expandedUrl = getExpandedUrl(trimmedUrl);
        if (expandedUrl) {
          const displayUrl = cleanUrlForDisplay(expandedUrl);
          return `<a href="${expandedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${displayUrl}</a>`;
        }
        // If no expanded URL is available, don't show the t.co URL
        return '';
      }
      
      const displayUrl = cleanUrlForDisplay(trimmedUrl);
      return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${displayUrl}</a>`;
    }
    
    // If it's a username
    if (originalMatch.startsWith('@')) {
      // Extract just the username without the @ symbol
      const usernameWithoutAt = originalMatch.substring(1);
      return `<a href="https://x.com/${usernameWithoutAt}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${originalMatch}</a>`;
    }
    
    // This should never happen, but return the original match just in case
    return originalMatch;
  });
}

/**
 * Process tweet text to identify and separate reply mentions
 * @param text The tweet text to process
 * @returns An object containing the processed text parts
 */
function processReplyMentions(text: string): { 
  isReply: boolean;
  replyMentions: string; 
  mainText: string;
} {
  // Regular expression to match mentions at the beginning of a tweet
  // This matches one or more @username patterns at the start, followed by optional whitespace
  const replyMentionsRegex = /^((@\w+\s*)+)(?=\S)/;
  
  const match = text.match(replyMentionsRegex);
  
  if (match) {
    // This is a reply tweet with mentions at the beginning
    const replyMentions = match[1].trim();
    const mainText = text.slice(match[0].length).trim();
    
    return {
      isReply: true,
      replyMentions,
      mainText
    };
  }
  
  // Not a reply or no mentions at the beginning
  return {
    isReply: false,
    replyMentions: '',
    mainText: text
  };
}

// Highlight search terms in text
function highlightText(text: string, query: string) {
  if (!query) return linkify(text);

  const linkedText = linkify(text);
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Use a non-greedy match to avoid matching across HTML tags
  const regex = new RegExp(`(${safeQuery})(?![^<]*>)`, "gi");

  return linkedText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-500/80 px-0.5 rounded">$1</mark>',
  );
}

// Format tweet date
function formatTweetDate(dateString: number | string) {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Format like "Jun 17, 2024" or just "Jun 17" if current year
  return `${month} ${day}${year !== currentYear ? `, ${year}` : ''}`;
}

// TweetContent component to handle the content part of a tweet
const TweetContent = ({ 
  full_text, 
  queryText = '',
  extended_entities,
}: { 
  full_text: string; 
  queryText?: string;
  extended_entities?: ExtendedEntities;
}) => {
  // Process the text to handle reply mentions
  const { isReply, replyMentions, mainText } = processReplyMentions(full_text);
  
  return (
    <div class="relative">
      {isReply && (
        <div class="flex items-center gap-1 mb-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clip-rule="evenodd" />
          </svg>
          <span>Replying to</span>
          <span 
            class="hover:underline cursor-pointer text-blue-600"
            title={replyMentions}
          >
            {replyMentions.split(/\s+/).length > 1 
              ? `${replyMentions.split(/\s+/)[0]} and ${replyMentions.split(/\s+/).length - 1} others` 
              : replyMentions}
          </span>
        </div>
      )}
      <p
        class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words text-xs leading-normal"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for rendering tweet with links
        dangerouslySetInnerHTML={{
          __html: highlightText(isReply ? mainText : full_text, queryText),
        }}
      />
      
      {/* Display media if available */}
      {extended_entities?.media && extended_entities.media.length > 0 && (
        <div class="mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {extended_entities.media.map((media: MediaEntity) => (
            media.type === "photo" && (
              <img 
                src={media.media_url_https} 
                alt="Tweet media" 
                class="w-full object-cover bg-gray-100 dark:bg-gray-800"
                style={{ maxHeight: extended_entities.media.length > 1 ? '180px' : '350px' }}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

// Memoize the Tweet component to prevent unnecessary re-renders
export const Tweet = memo(function TweetComponent({ tweet, queryText = '' }: { tweet: ExtendedTweetData; queryText?: string }) {
  const userData = useSignal<{
    username: string;
    displayName: string;
    photo: string;
  } | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check cache first
        const cached = getUserData(tweet.account_id);
        if (cached) {
          userData.value = {
            username: cached.username,
            displayName: cached.displayName,
            photo: cached.photo
          };
          return;
        }

        // If not in cache, fetch from Supabase
        const { data: account } = await supabase
          .from('account')
          .select('username, account_display_name')
          .eq('account_id', tweet.account_id)
          .single();

        if (account) {
          const { data: profile } = await supabase
            .from('profile')
            .select('avatar_media_url')
            .eq('account_id', tweet.account_id)
            .single();

          const newUserData = {
            username: account.username,
            displayName: account.account_display_name || account.username,
            photo: profile?.avatar_media_url || '/placeholder.png'
          };

          // Update both signal and cache
          userData.value = newUserData;
          setUserData(tweet.account_id, newUserData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, [tweet.account_id, userData]);

  if (!userData.value) return <LoadingTweet />;

  const tweetUrl = `https://x.com/${userData.value.username}/status/${tweet.tweet_id}`;
  const formattedDate = formatTweetDate(tweet.created_at);

  return (
    <article class="block p-3 border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors">
      <div class="flex flex-col gap-2">
        {/* Header row with avatar and name */}
        <a 
                  href={tweetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
        >
          <div class="flex items-start gap-2">
            <div class="flex-shrink-0">
            <img src={userData.value.photo} alt="" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
          <div class="flex flex-col flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span 
                class="font-bold text-gray-900 dark:text-gray-100 leading-tight line-clamp-1"
                title={userData.value.displayName}
              >
                {userData.value.displayName}
              </span>
              {tweet.verified && (
                <svg class="w-4 h-4 text-blue-500 ml-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
            </div>
            <div class="flex items-center gap-1">
              <span 
                class="text-gray-500 dark:text-gray-400 text-sm leading-tight line-clamp-1"
                title={`@${userData.value.username}`}
              >
                @{userData.value.username}
              </span>
              <span class="text-gray-500 dark:text-gray-400 text-sm mx-1">·</span>
              <span class="text-gray-500 dark:text-gray-400 text-sm hover:underline">{formattedDate}</span>
            </div>
          </div>
        </div>
        </a>
        
        
        {/* Tweet content - full width */}
        <div class="w-full">
          <TweetContent 
            full_text={tweet.full_text} 
            queryText={queryText}
            extended_entities={tweet.extended_entities}
          />
        </div>
      </div>
    </article>
  );
}); 