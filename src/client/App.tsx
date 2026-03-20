import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { ScanOverview } from "./pages/ScanOverview";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<Landing />} />
					<Route path="scan" element={<ScanOverview />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
