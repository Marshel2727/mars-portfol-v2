export default function Footer() {
  return (
    <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-800">
      © {new Date().getFullYear()} Marshel. Built with Next.js & Flask.
    </footer>
  );
}
