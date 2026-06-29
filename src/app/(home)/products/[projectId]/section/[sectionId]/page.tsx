import {
  ProductSectionPage,
} from "@/modules/aria/pages/product-section-page";
import type { ProductSectionFilter } from "@/lib/aria/global-filters";

const VALID_SECTIONS = new Set([
  "brief",
  "requirements",
  "workflow",
  "data",
  "automation",
  "ux",
  "backlog",
  "testing",
  "release",
  "activity",
  "timeline",
  "lifecycle",
]);

interface Props {
  params: Promise<{ projectId: string; sectionId: string }>;
}

export default async function ProductSectionRoute({ params }: Props) {
  const { projectId, sectionId } = await params;

  if (!VALID_SECTIONS.has(sectionId)) {
    return (
      <ProductSectionPage projectId={projectId} section="brief" />
    );
  }

  return (
    <ProductSectionPage
      projectId={projectId}
      section={sectionId as ProductSectionFilter | "activity" | "timeline" | "lifecycle"}
    />
  );
}
