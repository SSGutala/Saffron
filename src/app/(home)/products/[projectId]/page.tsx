import { ProductOverviewPage } from "@/modules/aria/pages/product-overview";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { projectId } = await params;
  return <ProductOverviewPage projectId={projectId} />;
}
