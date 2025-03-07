import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

import LoadingTweet from "@/components/LoadingTweet";
import { supabase } from "@/lib/supabase";
import { getUserData, setUserData } from "@/lib/userCache";
import { getExpandedUrl } from "@/lib/urlCache";
import "./styles.css";

interface TweetProps {
  tweet: {
    tweet_id: string;
    full_text: string;
    created_at: string;
    account_id: string;
  };
}

function linkify(text: string) {
  // Handle URLs
  const urlRegex = /https?:\/\/[^\s<]+/g;
  const usernameRegex = /@(\w+)/g;

  // First escape HTML
  let html = text.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]!));

  // Replace URLs
  html = html.replace(urlRegex, (url) => {
    // Keep trailing parenthesis if it's part of the URL structure
    const trimmedUrl = url.replace(/[.,;:]$/, '');
    const hasClosingParen = trimmedUrl.endsWith(')') && !trimmedUrl.includes('(');
    const cleanUrl = hasClosingParen ? trimmedUrl.slice(0, -1) : trimmedUrl;
    
    // If we have an expanded URL for this t.co URL, use it
    const expandedUrl = getExpandedUrl(cleanUrl);
    const linkUrl = expandedUrl ? expandedUrl : cleanUrl;
    return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${linkUrl}</a>${hasClosingParen ? ')' : ''}`;
  });

  // Replace @mentions
  html = html.replace(usernameRegex, (match, username) => 
    `<a href="https://x.com/${username}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${match}</a>`
  );

  return html;
}

export function Tweet({ tweet }: TweetProps) {
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
  const formattedDate = new Date(tweet.created_at).toLocaleDateString();

  return (
    <a href={tweetUrl} target="_blank" rel="noopener noreferrer" class="block p-3 border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors">
      <div class="flex gap-2">
        <div class="flex-shrink-0">
          <img src={userData.value.photo} alt="" class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 mb-0.5">
            <span 
              class="font-bold text-gray-900 dark:text-gray-100"
              title={userData.value.displayName}
            >
              {userData.value.displayName}
            </span>
            <span 
              class="text-gray-500 dark:text-gray-400 text-sm"
              title={`@${userData.value.username}`}
            >
              @{userData.value.username}
            </span>
            <span class="text-gray-500 dark:text-gray-400 text-sm">· {formattedDate}</span>
          </div>
          <p 
            class="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for rendering links and user mentions in tweets
            dangerouslySetInnerHTML={{ 
              __html: linkify(tweet.full_text) 
            }}
          />
        </div>
      </div>
    </a>
  );
} 