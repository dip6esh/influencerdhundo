import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppStateProvider } from "@/lib/app-state";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { trackPageView } from "@/lib/analytics-tracker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl bg-background px-4 py-2.5 text-sm font-semibold ring-1 ring-border"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function RouteAnalyticsTracker() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentSearch = routerState.location.searchStr;

  useEffect(() => {
    const fullPath = currentSearch ? `${currentPath}${currentSearch}` : currentPath;
    trackPageView(fullPath);
  }, [currentPath, currentSearch]);

  return null;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Influencer Dhundo — Where Businesses Find Relevant Creators with 0% Commission" },
      {
        name: "description",
        content:
          "Discover and connect directly with local Instagram creators and influencers across India. Filter by city, category, followers, and budget. 0% commission.",
      },
      {
        name: "keywords",
        content:
          "influencer marketing India, local influencers, instagram creators Surat, hire influencers Ahmedabad, micro creators Mumbai, nano influencers, direct brand collaboration",
      },
      { name: "author", content: "Influencer Dhundo" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },

      // Open Graph
      { property: "og:site_name", content: "Influencer Dhundo" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Influencer Dhundo — Local Influencer Discovery Platform" },
      {
        property: "og:description",
        content: "Where businesses find relevant influencers to collaborate. Connect directly with local creators with 0% commission.",
      },
      { property: "og:image", content: "https://www.influencerdhundo.com/logo.png" },
      { property: "og:image:alt", content: "Influencer Dhundo Logo & Directory" },
      { property: "og:url", content: "https://www.influencerdhundo.com/" },

      // Twitter Cards
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Influencer Dhundo — Local Influencer Discovery Platform" },
      {
        name: "twitter:description",
        content: "Where businesses find relevant influencers to collaborate. Connect directly with local creators with 0% commission.",
      },
      { name: "twitter:image", content: "https://www.influencerdhundo.com/logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://www.influencerdhundo.com/" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap",
      },
      { rel: "icon", href: "/logo.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const globalSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.influencerdhundo.com/#organization",
        "name": "Influencer Dhundo",
        "url": "https://www.influencerdhundo.com",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.influencerdhundo.com/#logo",
          "url": "https://www.influencerdhundo.com/logo.png",
          "caption": "Influencer Dhundo",
        },
        "description":
          "India's direct discovery platform connecting local businesses with Instagram creators and influencers with 0% commission.",
      },
      {
        "@type": "WebSite",
        "@id": "https://www.influencerdhundo.com/#website",
        "url": "https://www.influencerdhundo.com",
        "name": "Influencer Dhundo",
        "publisher": {
          "@id": "https://www.influencerdhundo.com/#organization",
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.influencerdhundo.com/discover?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <RouteAnalyticsTracker />
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <SiteHeader />
          <main className="flex-1">
            {/* Required: nested routes render here. */}
            <Outlet />
          </main>
          <SiteFooter />
        </div>
      </AppStateProvider>
    </QueryClientProvider>
  );
}

