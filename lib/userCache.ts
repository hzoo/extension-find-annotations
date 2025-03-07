interface UserData {
  username: string;
  displayName: string;
  photo: string;
}

const PREFIX = 'twitter-user-';
const TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache
const userCache = new Map<string, UserData>();

// Load cached IDs and clean up expired ones
try {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      const [timestamp, data] = localStorage.getItem(key)!.split('|');
      if (now - Number(timestamp) <= TTL) {
        userCache.set(key.slice(PREFIX.length), JSON.parse(data));
      } else {
        localStorage.removeItem(key);
      }
    }
  }
} catch (err) {
  console.warn('Failed to load user cache:', err);
}

export function getUserData(account_id: string): UserData | undefined {
  const data = userCache.get(account_id);
  const stored = localStorage.getItem(`${PREFIX}${account_id}`);
  
  if (stored) {
    const [timestamp, cached] = stored.split('|');
    if (Date.now() - Number(timestamp) <= TTL) {
      const data = JSON.parse(cached);
      userCache.set(account_id, data); // Update memory cache
      return data;
    }
    localStorage.removeItem(`${PREFIX}${account_id}`);
  }
  
  return data;
}

export function setUserData(account_id: string, data: UserData) {
  userCache.set(account_id, data);
  
  try {
    localStorage.setItem(
      `${PREFIX}${account_id}`, 
      `${Date.now()}|${JSON.stringify(data)}`
    );
  } catch (err) {
    console.warn('Failed to save user cache:', err);
  }
} 