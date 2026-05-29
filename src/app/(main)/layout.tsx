import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 has-bottom-nav">
        {children}
      </main>
      <MobileNav />
      <footer className="text-center py-6 pb-24 md:pb-6 text-xs text-gray-400">
        <p>禺山高级中学校园墙 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
