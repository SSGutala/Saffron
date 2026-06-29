import { AiPmPage } from "@/modules/aria/pages/ai-pm-page";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function AiPmProjectPage({ params }: Props) {
  const { projectId } = await params;
  return <AiPmPage projectId={projectId} />;
}
