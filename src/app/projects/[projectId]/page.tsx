import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function LegacyProjectRedirect({ params }: Props) {
  const { projectId } = await params;
  redirect(`/products/${projectId}`);
}
