import { memo } from "preact/compat";

const EmptyTweets = memo(() => (
  <div class="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
    <p>No tweets found for this page.</p>
  </div>
));

export default EmptyTweets; 