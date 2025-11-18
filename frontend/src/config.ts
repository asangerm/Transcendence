function getProtocol(): { http: string; ws: string } {
    if (typeof window !== "undefined") {
      const isSecure = window.location.protocol === "https:";
      return {
        http: isSecure ? "https" : "http",
        ws: isSecure ? "wss" : "ws",
      };
    }
  
    return {
      http: "http",
      ws: "ws",
    };
  }
  
  //retourne l'URL complète de l'API (ex: "https://localhost:8000")
  export function getApiUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl;
    }
  
    const { http } = getProtocol();
    return `${http}://${window.location.hostname}:8000`;
  }
  
  //paramètre gameId - (Optionnel) ID du jeu à ajouter comme query parameter
  //retourne URL WebSocket complète (ex: "wss://localhost:8000/ws?gameId=abc123")
  
  export function getWsUrl(gameId?: string): string {
    let baseUrl = import.meta.env.VITE_WS_URL;
  
    if (!baseUrl) {
      const { ws } = getProtocol();
      baseUrl = `${ws}://${window.location.hostname}:8000/ws`;
    }
  
    if (gameId) {
      return `${baseUrl}?gameId=${encodeURIComponent(gameId)}`;
    }
  
    return baseUrl;
  }
  