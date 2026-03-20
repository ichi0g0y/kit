import { Theme } from "@radix-ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
	<StrictMode>
		<Theme appearance="dark" accentColor="cyan" grayColor="slate">
			<App />
		</Theme>
	</StrictMode>,
);
