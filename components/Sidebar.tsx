import { useSignalEffect } from "@preact/signals";
import { currentUrl } from "@/lib/messaging";
import { LoadingItemList } from "@/components/LoadingItem";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ContentList } from "@/components/ContentList";
import { SidebarHeader } from "@/components/SidebarHeader";
import { EmptyList } from "@/components/EmptyList";
import { contentItems, loading, error, contentSourceUrl, fetchContentImpl } from "@/lib/services";
import { autoFetchEnabled, extractBaseDomain, isDomainWhitelisted } from "@/lib/settings";
import { TweetSourceNotification } from "@/components/TweetSourceNotification";
import CacheStatus from "@/components/CacheStatus";
import { useRef, useEffect } from "preact/hooks";

// Simple debounce function
const debounce = (fn: Function, ms = 300) => {
	let timeoutId: ReturnType<typeof setTimeout>;
	return function(...args: any[]) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), ms);
	};
};

function SidebarBody() {
	// Create a debounced version of fetchContentImpl
	const debouncedFetch = useRef(debounce(fetchContentImpl, 1000));
	
	// Load content when URL changes
	useSignalEffect(() => {
		const newUrl = currentUrl.value;
		
		if (newUrl) {
			// Update content source URL
			contentSourceUrl.value = newUrl;
			
			// Only fetch if auto-fetch is enabled AND domain is whitelisted
			if (autoFetchEnabled.value && isDomainWhitelisted(extractBaseDomain(newUrl))) {
				debouncedFetch.current();
			}
		}
	});

	return (
		<div className="flex-1 overflow-y-auto">
			{loading.value ? (
				<LoadingItemList />
			) : error.value ? (
				<ErrorMessage message={error.value} />
			) : (
				<ContentList />
			)}
		</div>
	);
}

export function Sidebar() {
	return (
		<div className="flex flex-col h-full">
			<SidebarHeader />
			<TweetSourceNotification />
			<CacheStatus />
			{contentItems.value.length === 0 && !loading.value && <EmptyList />}
			<SidebarBody />
		</div>
	);
}
