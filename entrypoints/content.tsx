import { render } from "preact";
import App from "@/components/App";
import { setupPushMode } from "@/lib/pushMode";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // Setup push mode
    const pushModeController = setupPushMode();
    
    const ui = await createShadowRootUi(ctx, {
      name: "x-scroll-dl-ui",
      position: "inline",
      anchor: "body",
      append: "last",
      onMount: (container) => {
        const wrapper = document.createElement("div");
        container.append(wrapper);

        render(<App />, wrapper);
        return wrapper;
      },
      onRemove: (elements) => {
        // Clean up push mode when removing the UI
        pushModeController.cleanup();
        elements?.remove();
      },
    });

    ui.mount();
  },
}); 