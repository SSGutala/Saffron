import "@/styles/aria.css";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="light">{children}</div>;
}
