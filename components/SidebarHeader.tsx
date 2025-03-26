import { contentItems, availableServices, activeService, setActiveService } from "@/lib/services";
import { SettingsToggle } from "@/components/SettingsToggle";
import type { ServiceType } from "@/lib/types";
import { useSignal } from "@preact/signals";

export function SidebarHeader() {
	const itemCount = contentItems.value.length;
	const isDropdownOpen = useSignal(false);

	const handleServiceChange = (serviceType: ServiceType) => {
		setActiveService(serviceType);
		isDropdownOpen.value = false;
	};

	// Get current service info
	const currentService = availableServices.value.find(s => s.id === activeService.value) || {
		name: "Community Archive"
	};

	return (
		<div class="sticky top-0 z-10 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
			<div class="flex items-center justify-between">
				<div class="relative">
					<button 
						onClick={() => isDropdownOpen.value = !isDropdownOpen.value}
						class="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
					>
						{currentService.name} {itemCount > 0 && `(${itemCount})`}
						<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</button>

					{isDropdownOpen.value && (
						<div class="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
							<div class="py-1" role="menu" aria-orientation="vertical">
								{availableServices.value
									.filter(service => service.enabled)
									.map(service => (
										<button
											key={service.id}
											onClick={() => handleServiceChange(service.id)}
											class={`block w-full text-left px-4 py-2 text-sm ${
												service.id === activeService.value
													? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
													: 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
											}`}
											role="menuitem"
										>
											{service.name}
										</button>
									))}
							</div>
						</div>
					)}
				</div>
				<SettingsToggle />
			</div>
		</div>
	);
}
