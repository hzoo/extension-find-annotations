import { TweetObserver } from '@/components/TweetObserver';
import { DebugView } from '@/components/DebugView';

export default function App() {
  return (
    <div className="x-scroll-dl-app">
      <TweetObserver />
      <DebugView />
    </div>
  );
} 