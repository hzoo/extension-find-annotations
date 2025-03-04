import { signal } from "@preact/signals";

const count = signal(0);

export default function App() {
  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 z-index-100">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        X Scroll DL
      </h2>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => count.value++}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Count: {count.value}
        </button>
      </div>
    </div>
  );
}