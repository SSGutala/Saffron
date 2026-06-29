import { ArtifactsListPage } from "@/modules/aria/pages/artifacts-list";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ArtifactsPage({ params }: Props) {
  const { projectId } = await params;
  return <ArtifactsListPage projectId={projectId} />;
}
