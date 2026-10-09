import { SiteHeader } from "@/components/site-header";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
