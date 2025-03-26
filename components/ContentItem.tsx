import { memo } from "preact/compat";
import { serviceRegistry } from "@/lib/services";
import { LoadingItem } from "@/components/LoadingItem";
import type { ContentItem as ContentItemType } from "@/lib/types";
import { ErrorMessage } from "@/components/ErrorMessage";

export const ContentItem = memo(function ContentItemComponent({ 
  item 
}: { 
  item: ContentItemType 
}) {
  if (!item) {
    return <LoadingItem />;
  }

  try {
    const service = serviceRegistry.getService(item.service);
    
    if (!service) {
      return <ErrorMessage message={`Service ${item.service} not available`} />;
    }
    
    return service.renderItem(item);
  } catch (error) {
    console.error("Error rendering content item:", error);
    return <ErrorMessage message="Failed to render content" />;
  }
}); 