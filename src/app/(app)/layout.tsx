import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1600px]">
      <Sidebar />
      <div className="min-w-0 flex-1 px-4 py-6 lg:px-6">{children}</div>
    </div>
  );
}
