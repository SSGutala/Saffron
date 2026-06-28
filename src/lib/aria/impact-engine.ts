import type { Artifact, Project } from "@/generated/prisma";
import type { ImpactAnalysis } from "@/types/aria";
import { ARTIFACT_IMPACT_GRAPH, getImpactedTypes } from "./knowledge-graph";
import { resolveArtifactType } from "./artifact-mapper";

export function computeImpactForArtifact(
  artifact: Artifact,
  allArtifacts: Artifact[],
): ImpactAnalysis | null {
  const stageKey = artifact.stageKey;
  if (!stageKey) return null;

  const impactedTypes = getImpactedTypes(stageKey);
  const graphEntries = ARTIFACT_IMPACT_GRAPH[stageKey] ?? [];

  const affected = graphEntries.map((entry) => {
    const match = allArtifacts.find(
      (a) =>
        a.stageKey === entry.type.replace(/_/g, "_") ||
        resolveArtifactType(a) === entry.type ||
        a.artifactType === entry.type,
    );
    return {
      artifactId: match?.id,
      title: match?.title ?? entry.label,
      artifactType: entry.type,
      reason: entry.reason,
      status: match?.status,
    };
  });

  if (affected.length === 0 && impactedTypes.length === 0) return null;

  const artifactType = resolveArtifactType(artifact);
  const changedRecently = artifact.version > 1;

  return {
    sourceArtifactId: artifact.id,
    sourceTitle: artifact.title,
    sourceType: artifactType,
    affected,
    recommendation: changedRecently
      ? `${artifact.title} changed. Review ${affected.length} downstream artifact${affected.length !== 1 ? "s" : ""} that may need updates.`
      : `When ${artifact.title} is approved, Aria will coordinate downstream artifacts.`,
  };
}

export function findArtifactsNeedingUpdate(
  artifacts: Artifact[],
): ImpactAnalysis[] {
  return artifacts
    .filter((a) => a.stageKey && a.version > 1)
    .map((a) => computeImpactForArtifact(a, artifacts))
    .filter((x): x is ImpactAnalysis => x !== null && x.affected.length > 0);
}

export function computeProjectImpacts(
  _project: Project,
  artifacts: Artifact[],
): ImpactAnalysis[] {
  return findArtifactsNeedingUpdate(artifacts);
}
