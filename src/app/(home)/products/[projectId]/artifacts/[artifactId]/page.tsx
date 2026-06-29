import { ArtifactDetailPage } from "@/modules/aria/pages/artifact-detail";

interface Props {
  params: Promise<{ projectId: string; artifactId: string }>;
}

export default async function ArtifactPage({ params }: Props) {
  const { projectId, artifactId } = await params;
  return <ArtifactDetailPage projectId={projectId} artifactId={artifactId} />;
}
