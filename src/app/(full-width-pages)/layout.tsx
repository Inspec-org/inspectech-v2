export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-[#FAF4FF]">{children}</div>;
}
