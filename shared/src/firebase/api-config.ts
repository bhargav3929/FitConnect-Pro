// ---------------------------------------------------------------------------
// Configurable API base URL for apiFetch
// Web uses '' (relative), mobile uses absolute URL
// ---------------------------------------------------------------------------

interface ApiConfig {
    baseUrl: string;
}

let _config: ApiConfig = { baseUrl: '' };

export function initApiConfig(config: ApiConfig): void {
    _config = config;
}

export function getApiBaseUrl(): string {
    return _config.baseUrl;
}
