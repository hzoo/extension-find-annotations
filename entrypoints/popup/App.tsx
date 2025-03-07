import { signal, useSignal } from '@preact/signals';

const sig = signal(0);

function App() {
	const count = useSignal(sig);

	return (
		<div className="flex flex-col items-center justify-center p-4 w-full">
			<h1 className="text-2xl font-bold text-gray-800">WXT + React</h1>
			<div className="p-4 mt-4 bg-white shadow rounded-lg">
				<button
					onClick={() => sig.value += 1}
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				>
					count is {count}
				</button>
				<p className="mt-2 text-gray-700">
					Edit{" "}
					<code className="text-gray-900 bg-gray-100 rounded p-1">
						src/App.tsx
					</code>{" "}
					and save to test HMR
				</p>
			</div>
			<p className="mt-4 text-gray-600">
				Click on the WXT and React logos to learn more
			</p>
		</div>
	);
}

export default App;
