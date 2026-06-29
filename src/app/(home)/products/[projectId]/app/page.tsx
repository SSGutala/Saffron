import { ProductAppPage } from "@/modules/aria/pages/product-app";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function AppPage({ params }: Props) {
  const { projectId } = await params;
  return <ProductAppPage projectId={projectId} />;
}
