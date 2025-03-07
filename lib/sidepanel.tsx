import { render } from "preact";
import { Sidebar } from "@/components/Sidebar";
import { setupSidePanel } from "@/lib/messaging";
import { loadSettings } from "@/lib/settings";
import "./styles.css";

// Setup side panel messaging"
setupSidePanel();

// Load settings from storage
loadSettings().catch(err => console.error("Failed to load settings:", err));

// Render sidebar directly instead of through App component
render(<Sidebar />, document.getElementById("app")!); 