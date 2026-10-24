export const root: string;
export function loadCredentials(directory?: string): Promise<{
  CRM_API_URL: string;
  CRM_PROJECT_ID: string;
  CRM_MCP_TOKEN: string;
}>;
