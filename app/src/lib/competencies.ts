import type { CampaignThemeConfig } from "@/types/campaignTheme";

/**
 * Get themed competency name based on campaign theme configuration
 * @param originalName - Original competency name from database
 * @param themeConfig - Campaign theme configuration
 * @returns Themed competency name or original if no override exists
 */
export function getThemedCompetencyName(
  originalName: string,
  themeConfig?: CampaignThemeConfig | null
): string {
  if (!themeConfig?.competencyOverrides) {
    return originalName;
  }

  return themeConfig.competencyOverrides[originalName] || originalName;
}

/**
 * Get themed competency names for multiple competencies
 * @param competencies - Array of competency objects with name property
 * @param themeConfig - Campaign theme configuration
 * @returns Array of competencies with themed names
 */
export function getThemedCompetencies<T extends { name: string }>(
  competencies: T[],
  themeConfig?: CampaignThemeConfig | null
): (T & { themedName: string })[] {
  return competencies.map(comp => ({
    ...comp,
    themedName: getThemedCompetencyName(comp.name, themeConfig)
  }));
}

