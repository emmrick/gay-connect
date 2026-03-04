import { supabase } from "@/integrations/supabase/client";

let isLogging = false;
const recentEvents = new Set<string>();
const DEDUP_WINDOW_MS = 10000;
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

const logSecurityEvent = async (
  eventType: string,
  severity: string,
  description: string,
  payload?: string,
  metadata?: Record<string, unknown>
) => {
  if (isLogging) return;
  isLogging = true;

  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("security_events" as any).insert({
      event_type: eventType,
      severity,
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      description: description.slice(0, 2000),
      payload: payload?.slice(0, 5000) || null,
      metadata: metadata || {},
    });
  } catch {
    // Silent fail
  } finally {
    isLogging = false;
  }
};

const deduplicatedLog = (
  eventType: string,
  severity: string,
  description: string,
  payload?: string,
  metadata?: Record<string, unknown>
) => {
  const key = `${eventType}:${description.slice(0, 100)}`;
  if (recentEvents.has(key)) return;
  recentEvents.add(key);
  setTimeout(() => recentEvents.delete(key), DEDUP_WINDOW_MS);
  logSecurityEvent(eventType, severity, description, payload, metadata);
};

// ── XSS Detection ──────────────────────────────────────────
const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on(error|load|click|mouseover|focus|blur)\s*=/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)\s*=/i,
  /innerHTML\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /\bdata\s*:\s*text\/html/i,
  /expression\s*\(/i,
  /url\s*\(\s*['"]?\s*javascript/i,
];

const detectXSS = (input: string): boolean => {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
};

// ── SQL Injection Detection ────────────────────────────────
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b.*\b(FROM|INTO|TABLE|SET|WHERE|ALL)\b)/i,
  /'\s*(OR|AND)\s+'?\d*'?\s*=\s*'?\d*'?/i,
  /;\s*(DROP|DELETE|ALTER|UPDATE|INSERT)\b/i,
  /--\s*$/,
  /\/\*.*\*\//,
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /\b(SLEEP|BENCHMARK|WAITFOR)\s*\(/i,
];

const detectSQLInjection = (input: string): boolean => {
  return SQL_PATTERNS.some((pattern) => pattern.test(input));
};

// ── Input Sanitization Monitor ─────────────────────────────
const monitorInputs = () => {
  document.addEventListener("submit", (e) => {
    const form = e.target as HTMLFormElement;
    const inputs = form.querySelectorAll("input, textarea");

    inputs.forEach((input) => {
      const value = (input as HTMLInputElement).value;
      if (!value) return;

      if (detectXSS(value)) {
        e.preventDefault();
        deduplicatedLog(
          "xss_attempt",
          "high",
          `Tentative XSS détectée dans un formulaire`,
          value.slice(0, 500),
          { formAction: form.action, inputName: (input as HTMLInputElement).name }
        );
      }

      if (detectSQLInjection(value)) {
        e.preventDefault();
        deduplicatedLog(
          "sql_injection",
          "critical",
          `Tentative d'injection SQL détectée`,
          value.slice(0, 500),
          { formAction: form.action, inputName: (input as HTMLInputElement).name }
        );
      }
    });
  }, true);
};

// ── URL Manipulation Detection ─────────────────────────────
const monitorURLManipulation = () => {
  const checkURL = () => {
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      if (detectXSS(value) || detectSQLInjection(value)) {
        deduplicatedLog(
          "url_manipulation",
          "high",
          `Paramètre URL suspect détecté: ${key}`,
          value.slice(0, 500),
          { parameter: key }
        );
      }
    });

    // Check hash for XSS
    if (window.location.hash && detectXSS(decodeURIComponent(window.location.hash))) {
      deduplicatedLog(
        "xss_attempt",
        "high",
        "Tentative XSS via fragment URL",
        window.location.hash.slice(0, 500)
      );
    }
  };

  checkURL();
  window.addEventListener("popstate", checkURL);
  window.addEventListener("hashchange", checkURL);
};

// ── Brute Force Detection (login attempts) ─────────────────
const monitorBruteForce = () => {
  const originalSignIn = supabase.auth.signInWithPassword.bind(supabase.auth);

  supabase.auth.signInWithPassword = async (credentials: any) => {
    const email = credentials.email || "unknown";
    const now = Date.now();
    const tracker = loginAttempts.get(email) || { count: 0, firstAttempt: now };

    // Reset if window expired (5 minutes)
    if (now - tracker.firstAttempt > 300000) {
      tracker.count = 0;
      tracker.firstAttempt = now;
    }

    tracker.count++;
    loginAttempts.set(email, tracker);

    if (tracker.count >= 5) {
      deduplicatedLog(
        "brute_force",
        "critical",
        `Tentative de brute force détectée: ${tracker.count} essais pour ${email.slice(0, 3)}***`,
        undefined,
        { attemptCount: tracker.count, email: email.replace(/(.{3}).*(@.*)/, "$1***$2") }
      );
    }

    const result = await originalSignIn(credentials);

    if (result.error) {
      if (tracker.count >= 3) {
        deduplicatedLog(
          "failed_login",
          tracker.count >= 5 ? "high" : "medium",
          `Échecs de connexion répétés (${tracker.count}x)`,
          undefined,
          { attemptCount: tracker.count }
        );
      }
    } else {
      // Successful login, reset
      loginAttempts.delete(email);
    }

    return result;
  };
};

// ── DevTools Detection ─────────────────────────────────────
const monitorDevTools = () => {
  let devtoolsOpen = false;

  const threshold = 160;
  const check = () => {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    
    if ((widthDiff || heightDiff) && !devtoolsOpen) {
      devtoolsOpen = true;
      deduplicatedLog(
        "devtools_opened",
        "low",
        "DevTools ouvert par un utilisateur",
        undefined,
        { widthDiff: window.outerWidth - window.innerWidth, heightDiff: window.outerHeight - window.innerHeight }
      );
    } else if (!widthDiff && !heightDiff) {
      devtoolsOpen = false;
    }
  };

  setInterval(check, 3000);
};

// ── Console Tampering Detection ────────────────────────────
const monitorConsoleTampering = () => {
  const nativeToString = Function.prototype.toString;
  
  try {
    const consoleLogStr = nativeToString.call(console.log);
    if (!consoleLogStr.includes("[native code]") && !consoleLogStr.includes("originalConsoleError")) {
      deduplicatedLog(
        "console_tampering",
        "medium",
        "Modification suspecte de la console détectée"
      );
    }
  } catch {
    // Silently fail
  }
};

// ── Prototype Pollution Detection ──────────────────────────
const monitorPrototypePollution = () => {
  const originalDefineProperty = Object.defineProperty;

  try {
    Object.defineProperty(Object.prototype, "__proto__", {
      set(value) {
        deduplicatedLog(
          "prototype_pollution",
          "critical",
          "Tentative de pollution de prototype détectée",
          String(value).slice(0, 500)
        );
      },
      get() {
        return undefined;
      },
      configurable: true,
    });
  } catch {
    // Already frozen or non-configurable
  }
};

// ── Rapid Request Detection (client-side DDoS indicator) ───
const monitorRapidRequests = () => {
  let requestCount = 0;
  let windowStart = Date.now();
  const MAX_REQUESTS = 100; // per 10 seconds
  const WINDOW_MS = 10000;

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const now = Date.now();
    if (now - windowStart > WINDOW_MS) {
      requestCount = 0;
      windowStart = now;
    }

    requestCount++;

    if (requestCount > MAX_REQUESTS) {
      deduplicatedLog(
        "rapid_requests",
        "high",
        `Trafic anormal détecté: ${requestCount} requêtes en ${Math.round((now - windowStart) / 1000)}s`,
        undefined,
        { requestCount, windowSeconds: Math.round((now - windowStart) / 1000) }
      );
    }

    return originalFetch.apply(window, args);
  };
};

// ── Suspicious localStorage/sessionStorage Access ──────────
const monitorStorageAccess = () => {
  const sensitiveKeys = ["supabase.auth.token", "sb-", "auth"];

  const originalGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key: string) {
    // Detect mass extraction
    if (typeof key === "string" && sensitiveKeys.some((sk) => key.includes(sk))) {
      // Only log if not from our own app origin (heuristic)
      const stack = new Error().stack || "";
      if (stack.includes("eval") || stack.includes("Function")) {
        deduplicatedLog(
          "suspicious_storage_access",
          "high",
          `Accès suspect au stockage local: ${key.slice(0, 50)}`,
          undefined,
          { key: key.slice(0, 100) }
        );
      }
    }
    return originalGetItem.call(this, key);
  };
};

// ── CSRF Token Validation Helper ───────────────────────────
const monitorCrossOriginRequests = () => {
  const originalFetch = window.fetch;

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
    
    // Check for requests to our API from potentially forged origins
    if (url.includes("supabase.co") && init?.method && ["POST", "PUT", "DELETE", "PATCH"].includes(init.method.toUpperCase())) {
      const headers = init.headers as Record<string, string> | undefined;
      if (!headers?.["authorization"] && !headers?.["apikey"]) {
        deduplicatedLog(
          "csrf_attempt",
          "medium",
          "Requête API sans authentification détectée",
          url.slice(0, 200),
          { method: init.method }
        );
      }
    }

    return originalFetch.call(window, input, init);
  };
};

// ── Main Initialization ────────────────────────────────────
export const initSecurityMonitor = () => {
  monitorInputs();
  monitorURLManipulation();
  monitorBruteForce();
  monitorDevTools();
  monitorRapidRequests();
  monitorStorageAccess();

  // Log initial page load security check
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    deduplicatedLog(
      "insecure_connection",
      "high",
      "Connexion non sécurisée (HTTP) détectée",
      window.location.href
    );
  }
};

export const logSecurityEventManually = (
  eventType: string,
  severity: string,
  description: string,
  payload?: string,
  metadata?: Record<string, unknown>
) => {
  deduplicatedLog(eventType, severity, description, payload, metadata);
};
