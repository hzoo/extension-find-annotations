import { render } from "preact";
import App from "@/components/App";
import "@/assets/tailwind.css";

export default defineContentScript({
  matches: ["https://x.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "x-scroll-dl-ui",
      position: "inline",
      anchor: "body",
      append: "last",
      onMount: (container) => {
        const wrapper = document.createElement("div");
        container.append(wrapper);

        render(<App />, wrapper);
        return { wrapper };
      },
      onRemove: (elements) => {
        elements?.wrapper.remove();
      },
    });

    ui.mount();
  },
}); 