export const GLOBAL_NAV = [
  { id: "home", label: "Home", href: "/", icon: "home" },
  { id: "products", label: "Products", href: "/products", icon: "products" },
  { id: "ai-pm", label: "AI PM", href: "/ai-pm", icon: "sparkles" },
  { id: "backlog", label: "Backlog", href: "/backlog", icon: "backlog" },
  { id: "artifacts", label: "Artifacts", href: "/artifacts", icon: "artifacts" },
  { id: "workflows", label: "Workflows", href: "/workflows", icon: "workflows" },
  { id: "automations", label: "Automations", href: "/automations", icon: "automations" },
  { id: "designs", label: "Designs", href: "/designs", icon: "designs" },
  { id: "tests", label: "Tests", href: "/tests", icon: "tests" },
  { id: "releases", label: "Releases", href: "/releases", icon: "releases" },
  { id: "integrations", label: "Integrations", href: "/integrations", icon: "integrations" },
  { id: "activity", label: "Activity", href: "/activity", icon: "activity" },
  { id: "settings", label: "Settings", href: "/settings", icon: "settings" },
] as const;

export const PRODUCT_NAV = [
  { id: "overview", label: "Overview" },
  { id: "brief", label: "Product Brief" },
  { id: "requirements", label: "Requirements" },
  { id: "artifacts", label: "Artifacts" },
  { id: "workflow", label: "Workflow" },
  { id: "data", label: "Data Model" },
  { id: "automation", label: "Automation" },
  { id: "ux", label: "UX / Design" },
  { id: "backlog", label: "Backlog" },
  { id: "testing", label: "Testing" },
  { id: "release", label: "Release" },
  { id: "activity", label: "Activity" },
  { id: "integrations", label: "Integrations" },
] as const;

export const LIFECYCLE_STEPS = [
  "Discovery & Brief",
  "Requirements",
  "Design",
  "Build",
  "Test",
  "Deploy",
] as const;

export const INTEGRATION_CATEGORIES = [
  "All",
  "Documents",
  "Delivery",
  "Design",
  "Automation",
  "Data",
  "Dev",
] as const;
