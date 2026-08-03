import Topbar from "@/components/Topbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Topbar />
      <main>{children}</main>
    </>
  );
}
