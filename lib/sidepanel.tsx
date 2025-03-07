import { render } from "preact";
import { Sidebar } from "@/components/Sidebar";
import { setupSidePanel } from "@/lib/messaging";
import "./styles.css";

// Setup side panel messaging"
setupSidePanel();

// Render sidebar directly instead of through App component
render(<Sidebar />, document.getElementById("app")!); 