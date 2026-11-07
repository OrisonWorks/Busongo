export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12"><div className="card w-full p-8">{children}</div></div>;
}
