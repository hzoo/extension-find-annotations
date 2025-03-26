import { contentItems } from "@/lib/services";
import { ContentItem } from "@/components/ContentItem";
import type { ContentItem as ContentItemType } from "@/lib/types";

interface ContentListProps {
  items?: ContentItemType[];
}

export function ContentList({ items = contentItems.value }: ContentListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div class="py-2 space-y-3">
      {items.map(item => (
        <ContentItem key={item.id} item={item} />
      ))}
    </div>
  );
} 