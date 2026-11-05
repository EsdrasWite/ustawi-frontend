import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Navbar } from "./Navbar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-24 lg:pb-0">
        <Navbar />
        <div className="bg-gradient-hero">
          <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};
