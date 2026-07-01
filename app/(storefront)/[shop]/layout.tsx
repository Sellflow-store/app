import TrackVisit from "@/components/store/TrackVisit";

// Wraps every storefront page for a shop. Its only job beyond rendering the
// page is to mount the pageview beacon so traffic + AI visibility get logged.
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <>
      {children}
      <TrackVisit slug={shop} />
    </>
  );
}
