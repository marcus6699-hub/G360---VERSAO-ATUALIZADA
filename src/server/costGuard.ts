import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const METRICS_FILE = path.join(__dirname, "../../cost-guard-metrics.json");

export interface ServiceCostConfig {
  name: string;
  dailyLimit: number;
  rateLimitPerMin: number;
  blockPaidCalls: boolean;
}

export interface CostGuardConfig {
  enabled: boolean;
  strictFreeMode: boolean; // When true, completely blocks paid APIs
  services: Record<string, ServiceCostConfig>;
}

export interface ServiceUsage {
  dailyCount: number;
  totalCount: number;
  lastUsed: string | null;
  historyByMinute: Record<string, number>;
}

export interface CostGuardMetrics {
  date: string;
  config: CostGuardConfig;
  usage: Record<string, ServiceUsage>;
  cacheStats: {
    cnpjHits: number;
    cnpjMisses: number;
    aiDeduplicationHits: number;
  };
}

export const DEFAULT_CONFIG: CostGuardConfig = {
  enabled: true,
  strictFreeMode: true,
  services: {
    gemini_text: {
      name: "Google Gemini (Textos & SEO — Free Tier Sem Grounding Pago)",
      dailyLimit: 250,
      rateLimitPerMin: 15,
      blockPaidCalls: false,
    },
    gemini_grounding_paid: {
      name: "Google Gemini Grounding (Google Search / Maps Tool)",
      dailyLimit: 500,
      rateLimitPerMin: 60,
      blockPaidCalls: false, // Ativo para permitir Maps Grounding e Search Grounding
    },
    gemini_image: {
      name: "Google Gemini / Imagens IA (gemini-nano-banana-2.1)",
      dailyLimit: 250,
      rateLimitPerMin: 30,
      blockPaidCalls: false, // Ativo para permitir criação e edição de imagens via Gemini
    },
    gemini_video: {
      name: "Google Gemini Video / Omni",
      dailyLimit: 10,
      rateLimitPerMin: 2,
      blockPaidCalls: true, // Usa motor gratuito WebM Motion por padrão
    },
    google_places: {
      name: "Google Maps Platform / Places API (Enterprise & Photos SKU Pago)",
      dailyLimit: 50,
      rateLimitPerMin: 10,
      blockPaidCalls: true, // BLOQUEADO POR PADRÃO para zerar cobranças no Google Cloud (My Project 11343)!
    },
    cnpj_lookup: {
      name: "Consulta Pública de CNPJ (BrasilAPI/CNPJ.ws — 100% Gratuito)",
      dailyLimit: 250,
      rateLimitPerMin: 25,
      blockPaidCalls: false,
    },
    outscraper: {
      name: "Outscraper Google Maps v3 (Free Tier 500 Empresas/mês — Sem Cobrança GCP)",
      dailyLimit: 500,
      rateLimitPerMin: 60,
      blockPaidCalls: false, // Permitido no Free Tier (não cobra no Google Cloud)
    },
    serper: {
      name: "Serper Google Places Search (Free Tier — Sem Cobrança GCP)",
      dailyLimit: 1000,
      rateLimitPerMin: 120,
      blockPaidCalls: false,
    },
  },
};

// In-memory cache for CNPJ queries (24-hour TTL)
const cnpjCache = new Map<string, { data: any; source: string; timestamp: number }>();

// Persistent in-memory cache for Business/Lead/Autocomplete queries (7-day TTL) to avoid repeat API calls
const businessSearchCache = new Map<string, { data: any; timestamp: number }>();

// In-flight request deduplication map to prevent rapid double-clicks
const inFlightRequests = new Map<string, { promise: Promise<any>; timestamp: number }>();

export class CostGuardService {
  private metrics: CostGuardMetrics;
  private writePending = false;

  constructor() {
    this.metrics = this.loadMetrics();
  }

  private getTodayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private loadMetrics(): CostGuardMetrics {
    const today = this.getTodayStr();
    try {
      if (fs.existsSync(METRICS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(METRICS_FILE, "utf-8"));
        if (raw.date === today) {
          // Merge loaded config with default config, enforcing strictFreeMode defaults for paid Google Cloud SKUs
          const mergedServices = { ...DEFAULT_CONFIG.services };
          if (raw.config?.services) {
            for (const [k, v] of Object.entries(raw.config.services)) {
              if (mergedServices[k]) {
                mergedServices[k] = { ...mergedServices[k], ...(v as ServiceCostConfig) };
              }
            }
          }
          // Guarantee paid Google Cloud SKUs stay blocked when strictFreeMode is active unless explicitly overridden with allowPaidGcp
          const isStrict = raw.config?.strictFreeMode ?? true;
          if (isStrict && !raw.config?.allowPaidGcpOverride) {
            if (mergedServices.google_places) mergedServices.google_places.blockPaidCalls = true;
            if (mergedServices.gemini_grounding_paid) mergedServices.gemini_grounding_paid.blockPaidCalls = false;
            if (mergedServices.gemini_image) mergedServices.gemini_image.blockPaidCalls = false;
            if (mergedServices.outscraper) {
              mergedServices.outscraper.blockPaidCalls = false;
              mergedServices.outscraper.dailyLimit = Math.max(mergedServices.outscraper.dailyLimit || 0, 500);
              mergedServices.outscraper.rateLimitPerMin = Math.max(mergedServices.outscraper.rateLimitPerMin || 0, 60);
            }
          }
          return {
            date: today,
            config: {
              enabled: raw.config?.enabled ?? DEFAULT_CONFIG.enabled,
              strictFreeMode: isStrict,
              services: mergedServices,
            },
            usage: raw.usage || {},
            cacheStats: {
              cnpjHits: raw.cacheStats?.cnpjHits || 0,
              cnpjMisses: raw.cacheStats?.cnpjMisses || 0,
              aiDeduplicationHits: raw.cacheStats?.aiDeduplicationHits || 0,
            },
          };
        }
      }
    } catch (e) {
      console.warn("[CostGuard] Could not load existing metrics file, initializing fresh:", e);
    }

    return {
      date: today,
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      usage: {},
      cacheStats: {
        cnpjHits: 0,
        cnpjMisses: 0,
        aiDeduplicationHits: 0,
      },
    };
  }

  public saveMetrics(): void {
    try {
      fs.writeFileSync(METRICS_FILE, JSON.stringify(this.metrics, null, 2), "utf-8");
    } catch (err) {
      console.error("[CostGuard] Failed to save metrics file:", err);
    }
  }

  private ensureDay(): void {
    const today = this.getTodayStr();
    if (this.metrics.date !== today) {
      this.metrics.date = today;
      for (const svc of Object.keys(this.metrics.usage)) {
        this.metrics.usage[svc].dailyCount = 0;
        this.metrics.usage[svc].historyByMinute = {};
      }
      this.saveMetrics();
    }
  }

  /**
   * Checks whether a request to a service is allowed under configured daily limits, rate limits, and strict-free policies.
   */
  public checkLimit(serviceKey: string): { allowed: boolean; reason?: string; retryAfterSeconds?: number } {
    if (!this.metrics.config.enabled) return { allowed: true };
    this.ensureDay();

    const svcConfig = this.metrics.config.services[serviceKey];
    if (!svcConfig) {
      // Deny by default for unknown providers in strict free mode
      if (this.metrics.config.strictFreeMode) {
        return {
          allowed: false,
          reason: `[CostGuard] Provedor "${serviceKey}" não cadastrado. Bloqueado por política conservadora no Modo Gratuito Estrito.`,
        };
      }
      return { allowed: true };
    }

    if (this.metrics.config.strictFreeMode && svcConfig.blockPaidCalls) {
      return {
        allowed: false,
        reason: `[CostGuard] Serviço "${svcConfig.name}" bloqueado pelo Modo 100% Gratuito Estrito para evitar custos.`,
      };
    }

    const usage = this.metrics.usage[serviceKey] || {
      dailyCount: 0,
      totalCount: 0,
      lastUsed: null,
      historyByMinute: {},
    };

    // 1. Daily limit check
    if (usage.dailyCount >= svcConfig.dailyLimit) {
      return {
        allowed: false,
        reason: `[CostGuard] Limite diário de segurança atingido para ${svcConfig.name} (${usage.dailyCount}/${svcConfig.dailyLimit} chamadas hoje).`,
      };
    }

    // 2. Rate limit per minute check
    const currentMin = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    const minCount = usage.historyByMinute[currentMin] || 0;
    if (minCount >= svcConfig.rateLimitPerMin) {
      return {
        allowed: false,
        reason: `[CostGuard] Limite por minuto atingido para ${svcConfig.name} (${minCount}/${svcConfig.rateLimitPerMin} req/min). Aguarde alguns segundos.`,
        retryAfterSeconds: 60 - new Date().getSeconds(),
      };
    }

    return { allowed: true };
  }

  /**
   * Atomic check and reservation for concurrency safety.
   * Immediately reserves quota before the call is sent across the network.
   */
  public reserveQuota(serviceKey: string): {
    allowed: boolean;
    reason?: string;
    release: (success?: boolean) => void;
  } {
    const check = this.checkLimit(serviceKey);
    if (!check.allowed) {
      return {
        allowed: false,
        reason: check.reason,
        release: () => {},
      };
    }

    // Immediately record reservation
    this.recordCall(serviceKey);

    let released = false;
    return {
      allowed: true,
      release: (success = true) => {
        if (released) return;
        released = true;
        // If the call failed locally before dispatching to the network, roll back
        if (!success) {
          const currentMin = new Date().toISOString().slice(0, 16);
          const usage = this.metrics.usage[serviceKey];
          if (usage) {
            if (usage.dailyCount > 0) usage.dailyCount -= 1;
            if (usage.totalCount > 0) usage.totalCount -= 1;
            if (usage.historyByMinute[currentMin] && usage.historyByMinute[currentMin] > 0) {
              usage.historyByMinute[currentMin] -= 1;
            }
            this.saveMetrics();
          }
        }
      },
    };
  }

  /**
   * Records a successfully executed request.
   */
  public recordCall(serviceKey: string): void {
    this.ensureDay();
    const currentMin = new Date().toISOString().slice(0, 16);

    if (!this.metrics.usage[serviceKey]) {
      this.metrics.usage[serviceKey] = {
        dailyCount: 0,
        totalCount: 0,
        lastUsed: null,
        historyByMinute: {},
      };
    }

    const usage = this.metrics.usage[serviceKey];
    usage.dailyCount += 1;
    usage.totalCount += 1;
    usage.lastUsed = new Date().toISOString();
    usage.historyByMinute[currentMin] = (usage.historyByMinute[currentMin] || 0) + 1;

    // Keep minute history bounded to the last 15 minutes to save memory
    const keys = Object.keys(usage.historyByMinute);
    if (keys.length > 20) {
      const sorted = keys.sort();
      for (const oldKey of sorted.slice(0, keys.length - 15)) {
        delete usage.historyByMinute[oldKey];
      }
    }

    this.saveMetrics();
  }

  // Alias for backward-compatibility
  public recordUsage(serviceKey: string): void {
    this.recordCall(serviceKey);
  }

  // --- Central Guarded Runner (Guarantees zero forgotten checks) ---
  public async executeGuarded<T>(
    serviceKey: string,
    callFn: () => Promise<T>,
    fallbackFn?: (reason: string) => Promise<T> | T
  ): Promise<{ success: boolean; data?: T; fallbackUsed: boolean; reason?: string }> {
    const reservation = this.reserveQuota(serviceKey);
    if (!reservation.allowed) {
      if (fallbackFn) {
        const fbData = await fallbackFn(reservation.reason || "Cost limit reached");
        return { success: true, data: fbData, fallbackUsed: true, reason: reservation.reason };
      }
      return { success: false, fallbackUsed: false, reason: reservation.reason };
    }

    try {
      const data = await callFn();
      return { success: true, data, fallbackUsed: false };
    } catch (err: any) {
      // Network/API failure: decide whether to release or keep reservation
      reservation.release(false);
      if (fallbackFn) {
        const fbData = await fallbackFn(err?.message || "Execution failed");
        return { success: true, data: fbData, fallbackUsed: true, reason: err?.message };
      }
      throw err;
    }
  }

  // --- CNPJ Caching (24-hour TTL) ---
  public getCachedCnpj(cnpjClean: string): any | null {
    const cached = cnpjCache.get(cnpjClean);
    if (!cached) {
      this.metrics.cacheStats.cnpjMisses += 1;
      return null;
    }
    // 24 hour TTL (86400000 ms)
    if (Date.now() - cached.timestamp > 86400000) {
      cnpjCache.delete(cnpjClean);
      this.metrics.cacheStats.cnpjMisses += 1;
      return null;
    }
    this.metrics.cacheStats.cnpjHits += 1;
    return { ...cached.data, _fromCache: true, source: `${cached.source} (Cache 24h CostGuard)` };
  }

  public setCachedCnpj(cnpjClean: string, data: any, source: string): void {
    cnpjCache.set(cnpjClean, { data, source, timestamp: Date.now() });
  }

  // --- Business & Lead Search Cache (7-day TTL) to save 100% on repeated queries ---
  public getCachedBusinessSearch(key: string): any | null {
    const normKey = String(key || "").trim().toLowerCase();
    const cached = businessSearchCache.get(normKey);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > 7 * 86400000) {
      businessSearchCache.delete(normKey);
      return null;
    }
    this.metrics.cacheStats.aiDeduplicationHits += 1;
    return cached.data;
  }

  public setCachedBusinessSearch(key: string, data: any): void {
    const normKey = String(key || "").trim().toLowerCase();
    if (!normKey) return;
    businessSearchCache.set(normKey, { data, timestamp: Date.now() });
  }

  // --- Request Deduplication (Prevents parallel double-clicks from running duplicate AI tasks) ---
  public async deduplicateRequest<T>(requestKey: string, fn: () => Promise<T>): Promise<T> {
    const existing = inFlightRequests.get(requestKey);
    if (existing && Date.now() - existing.timestamp < 15000) {
      this.metrics.cacheStats.aiDeduplicationHits += 1;
      return existing.promise as Promise<T>;
    }

    const promise = fn();
    inFlightRequests.set(requestKey, { promise, timestamp: Date.now() });

    try {
      const result = await promise;
      return result;
    } finally {
      // Keep in flight map clean after short settling window
      setTimeout(() => inFlightRequests.delete(requestKey), 3000);
    }
  }

  // Alias for backward-compatibility
  public async deduplicate<T>(requestKey: string, fn: () => Promise<T>): Promise<T> {
    return this.deduplicateRequest(requestKey, fn);
  }

  public getMetrics(): CostGuardMetrics {
    this.ensureDay();
    return JSON.parse(JSON.stringify(this.metrics));
  }

  public getConfig(): CostGuardConfig {
    return JSON.parse(JSON.stringify(this.metrics.config));
  }

  /**
   * Validates configuration update payload with a strict whitelist.
   * Rejects NaN, negative numbers, infinite limits, unexpected keys.
   */
  public validateConfigUpdate(body: any): { valid: boolean; error?: string; cleanConfig?: Partial<CostGuardConfig> } {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { valid: false, error: "O corpo da requisição deve ser um objeto JSON válido." };
    }

    const allowedTopKeys = new Set(["enabled", "strictFreeMode", "services"]);
    for (const key of Object.keys(body)) {
      if (!allowedTopKeys.has(key)) {
        return { valid: false, error: `Campo não permitido no payload: "${key}".` };
      }
    }

    const clean: Partial<CostGuardConfig> = {};

    if ("enabled" in body) {
      if (typeof body.enabled !== "boolean") {
        return { valid: false, error: "O campo 'enabled' deve ser um booleano (true ou false)." };
      }
      clean.enabled = body.enabled;
    }

    if ("strictFreeMode" in body) {
      if (typeof body.strictFreeMode !== "boolean") {
        return { valid: false, error: "O campo 'strictFreeMode' deve ser um booleano (true ou false)." };
      }
      clean.strictFreeMode = body.strictFreeMode;
    }

    if ("services" in body) {
      if (!body.services || typeof body.services !== "object" || Array.isArray(body.services)) {
        return { valid: false, error: "O campo 'services' deve ser um objeto de serviços." };
      }

      const knownServices = new Set(Object.keys(DEFAULT_CONFIG.services));
      const allowedServiceKeys = new Set(["dailyLimit", "rateLimitPerMin", "blockPaidCalls"]);
      const cleanServices: Record<string, Partial<ServiceCostConfig>> = {};

      for (const [svcName, svcCfg] of Object.entries(body.services)) {
        if (!knownServices.has(svcName)) {
          return { valid: false, error: `Serviço desconhecido: "${svcName}". Serviços válidos: ${Array.from(knownServices).join(", ")}.` };
        }
        if (!svcCfg || typeof svcCfg !== "object" || Array.isArray(svcCfg)) {
          return { valid: false, error: `Configuração do serviço "${svcName}" deve ser um objeto.` };
        }

        const cleanSvc: Partial<ServiceCostConfig> = {};
        for (const [prop, val] of Object.entries(svcCfg as any)) {
          if (!allowedServiceKeys.has(prop)) {
            return { valid: false, error: `Propriedade "${prop}" não permitida para o serviço "${svcName}".` };
          }
          if (prop === "dailyLimit") {
            const num = Number(val);
            if (!Number.isInteger(num) || num < 1 || num > 50000 || Number.isNaN(num)) {
              return { valid: false, error: `dailyLimit de "${svcName}" deve ser um número inteiro entre 1 e 50.000.` };
            }
            cleanSvc.dailyLimit = num;
          } else if (prop === "rateLimitPerMin") {
            const num = Number(val);
            if (!Number.isInteger(num) || num < 1 || num > 1000 || Number.isNaN(num)) {
              return { valid: false, error: `rateLimitPerMin de "${svcName}" deve ser um número inteiro entre 1 e 1.000.` };
            }
            cleanSvc.rateLimitPerMin = num;
          } else if (prop === "blockPaidCalls") {
            if (typeof val !== "boolean") {
              return { valid: false, error: `blockPaidCalls de "${svcName}" deve ser booleano.` };
            }
            cleanSvc.blockPaidCalls = val;
          }
        }
        cleanServices[svcName] = cleanSvc;
      }
      clean.services = cleanServices as any;
    }

    return { valid: true, cleanConfig: clean };
  }

  public updateConfig(newConfig: Partial<CostGuardConfig>): CostGuardConfig {
    if (typeof newConfig.enabled === "boolean") {
      this.metrics.config.enabled = newConfig.enabled;
    }
    if (typeof newConfig.strictFreeMode === "boolean") {
      this.metrics.config.strictFreeMode = newConfig.strictFreeMode;
    }
    if (newConfig.services) {
      for (const [k, v] of Object.entries(newConfig.services)) {
        if (this.metrics.config.services[k]) {
          this.metrics.config.services[k] = {
            ...this.metrics.config.services[k],
            ...v,
          };
        }
      }
    }
    this.saveMetrics();
    return this.metrics.config;
  }
}

export const costGuard = new CostGuardService();
