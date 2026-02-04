import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Express } from './pages/Express';
import { Listen } from './pages/Listen';
import { Archive } from './pages/Archive';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const queryClient = new QueryClient();

// Layout component with Header and Footer
function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <Header />
      <main className="container flex-1 py-8 md:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Root route with layout
const rootRoute = createRootRoute({
  component: Layout,
});

// Define routes
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Onboarding,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: Home,
});

const expressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/express',
  component: Express,
});

const listenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/listen',
  component: Listen,
});

const archiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/archive',
  component: Archive,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  onboardingRoute,
  homeRoute,
  expressRoute,
  listenRoute,
  archiveRoute,
]);

// Create router
const router = createRouter({ routeTree });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
