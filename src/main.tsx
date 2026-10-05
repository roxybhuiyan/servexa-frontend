import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, queryClient } from "./app/session";
import { router } from "./app/router";
import "./styles/global.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </QueryClientProvider>,
);
