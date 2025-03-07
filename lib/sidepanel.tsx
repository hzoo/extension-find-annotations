import { render } from "preact";
import App from "@/components/App";
import { setupSidePanel } from "@/lib/messaging";
import "./styles.css";

// Setup side panel messaging"
setupSidePanel();

// Render the app
render(<App />, document.getElementById("app")!); 