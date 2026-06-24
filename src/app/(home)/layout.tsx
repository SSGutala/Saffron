import { Navbar } from '@/modules/home/ui/components/navbar';

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col min-h-screen max-h-screen">
      <Navbar />
      <div className="absolute inset-0 -z-10 w-full h-full bg-gradient-to-br from-zinc-600 via-zinc-800 to-red-900" />
      <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
    </main>
  );
}
