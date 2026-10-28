import {
  categories,
  featuredTools,
  getToolsByCategory,
  newTools,
  tools,
  type Category,
  type Tool,
} from "@/lib/tools";
import { getToolStatusMap } from "@/lib/tool-status";

export type ToolWithStats = Tool & {
  usageCount: number;
  isActive: boolean;
};

export async function getPublicTools(): Promise<ToolWithStats[]> {
  try {
    const statusMap = await getToolStatusMap();

    return tools
      .filter((tool) => statusMap[tool.id]?.isActive !== false && !statusMap[tool.id]?.maintenance)
      .map((tool) => ({
        ...tool,
        isActive: true,
        usageCount: statusMap[tool.id]?.usageCount ?? 0,
      }));
  } catch {
    return [];
  }
}

export async function getPublicToolById(
  id: string,
): Promise<ToolWithStats | null> {
  const tool = tools.find((entry) => entry.id === id);
  if (!tool) return null;

  try {
    const statusMap = await getToolStatusMap();
    const status = statusMap[id];
    if (status && (!status.isActive || status.maintenance)) return null;

    return {
      ...tool,
      isActive: status?.isActive ?? true,
      usageCount: status?.usageCount ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getPublicToolsByCategory(
  category: Category,
): Promise<ToolWithStats[]> {
  const publicTools = await getPublicTools();
  return publicTools.filter((tool) => tool.category === category);
}

export async function getPublicFeaturedTools(limit = 12) {
  const publicTools = await getPublicTools();
  const featuredIds = new Set(featuredTools.map((tool) => tool.id));
  const featured = publicTools.filter((tool) => featuredIds.has(tool.id));
  return (featured.length > 0 ? featured : publicTools).slice(0, limit);
}

export async function getPublicNewTools(limit = 6) {
  const publicTools = await getPublicTools();
  const newIds = new Set(newTools.map((tool) => tool.id));
  const recent = publicTools.filter((tool) => newIds.has(tool.id));
  return (recent.length > 0 ? recent : publicTools).slice(0, limit);
}

export async function getPublicCategoryCounts() {
  const publicTools = await getPublicTools();
  return Object.fromEntries(
    categories.map((category) => [
      category,
      publicTools.filter((tool) => tool.category === category).length,
    ]),
  ) as Record<Category, number>;
}

export async function getRelatedPublicTools(tool: Tool, limit = 4) {
  const categoryTools = await getPublicToolsByCategory(tool.category);
  return categoryTools.filter((entry) => entry.id !== tool.id).slice(0, limit);
}

export function fallbackToolsWithZeroStats(list: Tool[] = tools): ToolWithStats[] {
  return list.map((tool) => ({
    ...tool,
    isActive: true,
    usageCount: 0,
  }));
}

export { getToolsByCategory };
