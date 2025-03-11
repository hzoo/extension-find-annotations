import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { memo } from "preact/compat";

import {LoadingTweet} from "@/components/LoadingTweet";
import { supabase } from "@/lib/supabase";
import { getUserData, setUserData } from "@/lib/userCache";
import { getExpandedUrl } from "@/lib/urlCache";
import type { TweetData, TweetType } from "@/lib/signals";

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

function cleanUrlForDisplay(url: string, maxLength = 25): string {
  const cleaned = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, ''); // remove ending slash
  if (cleaned.length > maxLength) {
    return `${cleaned.slice(0, maxLength - 3)}...`;
  }
  return cleaned;
}

// Convert text with URLs and usernames to HTML with links
function linkify(text: string) {
  // Create a combined regex that captures both URLs and usernames
  // The regex uses capturing groups to differentiate between URLs and usernames
  // Also capture any non-whitespace character before the URL
  const combinedRegex = /([^\s])(https?:\/\/[^\s<]+)|(@\w+)/g;
  
  // First, replace URLs and usernames with placeholder tokens
  // This prevents them from being affected by HTML escaping
  const tokens: Record<string, string> = {};
  let tokenCounter = 0;
  
  const tokenizedText = text
    // Handle URLs that have text directly before them
    .replace(/([^\s])(https?:\/\/[^\s<]+)/g, '$1 $2')
    // Then tokenize all URLs and usernames
    .replace(/(https?:\/\/[^\s<]+)|(@\w+)/g, (match) => {
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
      const displayUrl = cleanUrlForDisplay(trimmedUrl);
      return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${displayUrl}</a>`;
    }
    
    // If it's a username
    if (originalMatch.startsWith('@')) {
      // Extract just the username without the @ symbol
      const usernameWithoutAt = originalMatch.substring(1);
      return `<a href="https://x.com/${usernameWithoutAt}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${originalMatch}</a>`;
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
  tweetType,
}: { 
  full_text: string; 
  queryText?: string;
  extended_entities?: ExtendedEntities;
  tweetType?: TweetType;
}) => {
  // Process the text to handle reply mentions
  const { isReply, replyMentions, mainText } = processReplyMentions(full_text);
  
  return (
    <div class="relative">
      {/* Display Reply indicator */}
      {(isReply || tweetType === 'reply' || tweetType === 'self_reply') && (
        <div class="flex items-center gap-1 mb-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clip-rule="evenodd" />
          </svg>
          <span>
            {tweetType === 'self_reply' ? 'Replying to self' : 'Replying to'}
          </span>
          {isReply && (
            <span 
              class="hover:underline cursor-pointer text-blue-500"
              title={replyMentions}
            >
              {replyMentions.split(/\s+/).length > 1 
                ? `${replyMentions.split(/\s+/)[0]} and ${replyMentions.split(/\s+/).length - 1} others` 
                : replyMentions}
            </span>
          )}
        </div>
      )}

      {/* Display Retweet indicator */}
      {tweetType === 'retweet' && (
        <div class="flex items-center gap-1 mb-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3">
            <path d="M19.7 10.7L17.3 8.3C17.1 8.1 16.9 8 16.6 8C16 8 15.6 8.4 15.6 9C15.6 9.3 15.7 9.5 15.9 9.7L16.6 10.4H10C9.4 10.4 9 10.8 9 11.4C9 12 9.4 12.4 10 12.4H16.6L15.9 13.1C15.7 13.3 15.6 13.5 15.6 13.8C15.6 14.4 16 14.8 16.6 14.8C16.9 14.8 17.1 14.7 17.3 14.5L19.7 12.1C19.9 11.9 20 11.7 20 11.4C20 11.1 19.9 10.9 19.7 10.7ZM7.4 13.8C7.4 13.2 7 12.8 6.4 12.8C5.8 12.8 5.4 13.2 5.4 13.8V16.4C5.4 18.4 6.6 19.6 8.6 19.6H16.6C17.2 19.6 17.6 19.2 17.6 18.6C17.6 18 17.2 17.6 16.6 17.6H8.6C7.7 17.6 7.4 17.3 7.4 16.4V13.8Z" />
            <path d="M6.6 8H15.6C16.2 8 16.6 7.6 16.6 7C16.6 6.4 16.2 6 15.6 6H7.6C5.6 6 4.4 7.2 4.4 9.2V11.8C4.4 12.4 4.8 12.8 5.4 12.8C6 12.8 6.4 12.4 6.4 11.8V9.2C6.4 8.3 6.7 8 6.6 8Z" />
          </svg>
          <span>Retweeted</span>
        </div>
      )}

      {/* Display Quote Tweet indicator */}
      {tweetType === 'quote_retweet' && (
        <div class="flex items-center gap-1 mb-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
            <path d="M10 4.5c1.215 0 2.417.055 3.604.162a.68.68 0 01.615.597c.124 1.038.208 2.088.25 3.15l-1.689-1.69a.75.75 0 00-1.06 1.061l2.999 3a.75.75 0 001.06 0l3.001-3a.75.75 0 10-1.06-1.06l-1.748 1.747a41.31 41.31 0 00-.258-3.386.68.68 0 01.614-.597A40.594 40.594 0 0119.5 4.5a.75.75 0 000-1.5A42.593 42.593 0 0010 2.25 42.593 42.593 0 00.5 3a.75.75 0 000 1.5 40.593 40.593 0 017.396.798.68.68 0 01.615.597 38.62 38.62 0 01.21 11.609.68.68 0 01-.614.597A40.593 40.593 0 01.5 17.5a.75.75 0 000 1.5c2.07 0 3.98-.124 5.937-.492a.684.684 0 01.616-.597c.374-.081.74-.153 1.097-.221.781-.145 1.464-.663 1.95-1.37a8.18 8.18 0 00.836-1.54l.001-.001a6.516 6.516 0 00.37-.9 9.83 9.83 0 00.164-.66l.002-.009.004-.019.001-.01.332-1.652a.75.75 0 00-1.466-.3l-.333 1.66-.002.01a7.853 7.853 0 01-.118.48l-.001.003a7.9 7.9 0 01-.662 1.647c-.16.267-.34.533-.535.79-.193.258-.472.391-.778.443-.413.073-.858.145-1.33.218-1.957.368-3.871.492-5.939.492a42.59 42.59 0 01-10-1.25 38.7 38.7 0 01.207-10.617.68.68 0 01.615-.597A42.591 42.591 0 0110 4.5z" />
          </svg>
          <span>Quoted Tweet</span>
        </div>
      )}

      <p
        class={`text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words text-xs leading-normal 
          ${tweetType === 'retweet' ? 'italic text-gray-700 dark:text-gray-300' : ''}`}
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

// Custom border colors based on tweet type
function getTweetBorderClass(tweetType?: TweetType) {
  switch(tweetType) {
    case 'reply':
      return 'border-blue-100 dark:border-blue-900/30';
    case 'self_reply':
      return 'border-green-100 dark:border-green-900/30';
    case 'retweet':
      return 'border-purple-100 dark:border-purple-900/30';
    case 'quote_retweet':
      return 'border-orange-100 dark:border-orange-900/30';
    default:
      return 'border-gray-100 dark:border-gray-800';
  }
}

// Custom background hover colors based on tweet type
function getTweetHoverClass(tweetType?: TweetType) {
  switch(tweetType) {
    case 'reply':
      return 'hover:bg-blue-50 dark:hover:bg-blue-900/20';
    case 'self_reply':
      return 'hover:bg-green-50 dark:hover:bg-green-900/20';
    case 'retweet':
      return 'hover:bg-purple-50 dark:hover:bg-purple-900/20';
    case 'quote_retweet':
      return 'hover:bg-orange-50 dark:hover:bg-orange-900/20';
    default:
      return 'hover:bg-gray-50 dark:hover:bg-gray-800/50';
  }
}

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
  
  // Get custom border and hover classes based on tweet type
  const borderClass = getTweetBorderClass(tweet.type);
  const hoverClass = getTweetHoverClass(tweet.type);

  return (
    <article class={`block p-3 border-b transition-colors ${borderClass} ${hoverClass}`}>
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
            tweetType={tweet.type}
          />
        </div>
      </div>
    </article>
  );
}); 