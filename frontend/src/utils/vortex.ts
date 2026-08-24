export interface VortexConfig {
  apiUrl: string;
}

export class VortexClient {
  private apiUrl: string;

  constructor(config: VortexConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
  }

  async authorize(appKey: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/apps/${appKey}/launch`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error("[VortexClient] Chyba při ověřování autorizace:", error);
      return false;
    }
  }

  async getProfile(accessToken: string): Promise<{ subject: string; name: string; roles: string[] } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        }
      });

      if (response.status === 200) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("[VortexClient] Chyba při získávání profilu:", error);
      return null;
    }
  }

  expressMiddleware(appKey: string) {
    return async (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Chybí nebo je neplatný autorizační token" });
      }

      const token = authHeader.split(" ")[1];
      const hasAccess = await this.authorize(appKey, token);

      if (!hasAccess) {
        return res.status(403).json({ error: "Forbidden: Nemáte oprávnění k této aplikaci" });
      }

      next();
    };
  }
}
