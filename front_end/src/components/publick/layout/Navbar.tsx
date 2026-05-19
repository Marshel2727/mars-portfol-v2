export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="text-2xl font-bold tracking-tighter text-teal-400">marsPorto.</div>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
          <a href="#about" className="hover:text-teal-400 transition">About</a>
          <a href="#skills" className="hover:text-teal-400 transition">Skills</a>
          <a href="#projects" className="hover:text-teal-400 transition">Projects</a>
          <a href="#contact" className="hover:text-teal-400 transition">Contact</a>
        </div>
      </div>
    </nav>
  );
}