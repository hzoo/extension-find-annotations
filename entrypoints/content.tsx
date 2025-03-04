import { render } from "preact";
import App from "@/components/App";
import "@/assets/tailwind.css";

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "x-scroll-dl-ui",
      position: "inline",
      anchor: "body",
      append: "first",
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