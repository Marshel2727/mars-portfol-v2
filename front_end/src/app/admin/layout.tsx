import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
    children,
}:{
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-gradient-to-b from-gray-800 to-emerald-900">
            <Sidebar/>

            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}