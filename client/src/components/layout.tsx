import { Link, useLocation } from "wouter";
import { Layers, Github } from "lucide-react";
import logoImage from "@assets/app_logo_1773238351966.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden relative selection:bg-primary selection:text-white">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] opacity-15" />
      </div>
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-xl bg-[#4d4d4d]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <img src={logoImage} alt="DepthCloud" className="w-10 h-10 rounded-lg group-hover:opacity-80 transition-opacity" />
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">
              DepthCloud
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-white' : 'text-muted-foreground'}`}>
              Create
            </Link>
            <Link href="/gallery" className="text-sm font-medium transition-colors hover:text-primary text-[#ffffff]">
              Gallery
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
      <footer className="border-t border-border bg-background/50 backdrop-blur-sm py-8 mt-12 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DepthCloud. All rights reserved.<br className="md:hidden" />
            <span className="hidden md:inline"> Made by Lukmou in Replit</span>
            <br className="md:hidden" />
            <span className="md:hidden">Made by Lukmou in Replit</span>
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Powered by Three.js
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
