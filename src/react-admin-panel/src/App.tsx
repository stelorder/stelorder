import { Route, Routes } from "react-router-dom";
import { MainRoute } from "./components/Routes/MainRoute";
import ConfigPage from "./pages/ConfigPage";
import InvoicesPage from "./pages/InvoicesPage";
import { OrdersPage } from "./pages/OrdersPage";
import { HistoryPage } from "./pages/HistoryPage";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainRoute />}>
        <Route path="jobs" element={<HistoryPage />} />
        <Route path="configuration" element={<ConfigPage />} />
        <Route path="invoice" element={<InvoicesPage />} />
        <Route path="order" element={<OrdersPage />} />
        <Route path="error" element={<ErrorPage />} />
      </Route>
      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
}

export default App;