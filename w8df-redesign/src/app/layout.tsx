import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "W8DF | Southern Michigan Amateur Radio Society",
  description: "Official club website for the Southern Michigan Amateur Radio Society (SMARS), Battle Creek, MI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50">
        
        {/* Top Header Strip */}
        <div className="bg-slate-900 text-slate-300 py-1 px-4 text-sm flex justify-between items-center">
          <div className="container mx-auto flex justify-between px-4">
            <span className="hidden sm:inline">Welcome to the Southern Michigan Amateur Radio Society (SMARS)</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Become a Member</a>
              <a href="#" className="hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-8 py-4 flex flex-col md:flex-row justify-between items-center">
            
            {/* Logo / Brand */}
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl shadow-inner shrink-0">
                ⚡
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-wider leading-tight">W8DF</h1>
                <p className="text-blue-200 text-sm font-medium tracking-wide">Southern Michigan Amateur Radio Society</p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-wrap justify-center gap-2 md:gap-6 font-medium text-lg">
              <a href="#" className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-blue-800/50 rounded transition-all">Home</a>
              <a href="#hamfest" className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-blue-800/50 rounded transition-all relative">
                Hamfest
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">SOON</span>
              </a>
              <a href="#meetings" className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-blue-800/50 rounded transition-all">Meetings</a>
              <a href="#testing" className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-blue-800/50 rounded transition-all">VE Testing</a>
              <a href="#about" className="px-3 py-2 text-white hover:text-yellow-400 hover:bg-blue-800/50 rounded transition-all">About</a>
            </nav>
            
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 mt-12 border-t-4 border-blue-900">
          <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">W8DF - SMARS</h3>
              <p className="mb-4">Dedicated to the amazing world of amateur radio in Battle Creek, Michigan and the surrounding areas.</p>
              <p className="text-sm">Walking ins welcome at all our meetings and testing sessions!</p>
            </div>
            <div>
              <h3 className="text-white text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Meeting Map</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Study Guides</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">FCC Rules</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">ARRL Affiliation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white text-xl font-bold mb-4">Club Status</h3>
              <div className="bg-slate-800 p-4 rounded border border-slate-700">
                <p className="text-sm mb-2"><strong className="text-slate-300">Repeater W8DF:</strong> 146.660 MHz (- offset, 131.8 PL)</p>
                <p className="text-sm mb-2"><strong className="text-slate-300">Status:</strong> <span className="text-green-400 font-bold">ONLINE</span></p>
                <p className="text-xs text-slate-500 mt-4">Website accessed 7,874 times since 11/17/2023</p>
              </div>
            </div>
          </div>
          <div className="container mx-auto px-8 mt-8 pt-8 border-t border-slate-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Southern Michigan Amateur Radio Society. All rights reserved.</p>
          </div>
        </footer>

      </body>
    </html>
  );
}
