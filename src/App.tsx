import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/main-layout";
import Analytics from "./pages/analytics";
import Dashboard from "./pages/dashboard";
import Entry from "./pages/entry";
import History from "./pages/history";
import Settings from "./pages/settings";

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/entry" element={<Entry />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default App;
