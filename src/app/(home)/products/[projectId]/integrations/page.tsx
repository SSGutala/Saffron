import { ProductIntegrationsPage } from "@/modules/aria/pages/product-section-page";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProductIntegrationsRoute({ params }: Props) {
  const { projectId } = await params;
  return <ProductIntegrationsPage projectId={projectId} />;
}
