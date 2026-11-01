export interface AeroAirport {
  iata?: string;
  icao?: string;
  name?: string;
  shortName?: string;
  municipalityName?: string;
  countryCode?: string;
}

export interface AeroTime {
  utc?: string;
  local?: string;
}

export interface AeroFlightItem {
  airline?: { name?: string; iata?: string; icao?: string };
  number?: string;
  status?: string;
  codeshareStatus?: string;
  isCargo?: boolean;
  departure?: {
    airport?: AeroAirport;
    scheduledTime?: AeroTime;
    revisedTime?: AeroTime;
    terminal?: string;
    gate?: string;
  };
  arrival?: {
    airport?: AeroAirport;
    scheduledTime?: AeroTime;
    revisedTime?: AeroTime;
    terminal?: string;
    gate?: string;
  };
}

export const AIRPORT_CODE_CITIES: Record<string, { code: string; city: string; airport: string; aliases: string[] }> = {
  DEL: { code: "DEL", city: "New Delhi", airport: "Indira Gandhi International Airport", aliases: ["delhi", "new delhi", "del", "vidp"] },
  BOM: { code: "BOM", city: "Mumbai", airport: "Chhatrapati Shivaji Maharaj International Airport", aliases: ["mumbai", "bombay", "bom", "vabb"] },
  BLR: { code: "BLR", city: "Bengaluru", airport: "Kempegowda International Airport", aliases: ["bengaluru", "bangalore", "blr", "vobl"] },
  MAA: { code: "MAA", city: "Chennai", airport: "Chennai International Airport", aliases: ["chennai", "madras", "maa", "vomm"] },
  CCU: { code: "CCU", city: "Kolkata", airport: "Netaji Subhash Chandra Bose International Airport", aliases: ["kolkata", "calcutta", "ccu", "vecc"] },
  HYD: { code: "HYD", city: "Hyderabad", airport: "Rajiv Gandhi International Airport", aliases: ["hyderabad", "hyd", "vohy"] },
  COK: { code: "COK", city: "Kochi", airport: "Cochin International Airport", aliases: ["kochi", "cochin", "kerala", "cok", "voci"] },
  AMD: { code: "AMD", city: "Ahmedabad", airport: "Sardar Vallabhbhai Patel International Airport", aliases: ["ahmedabad", "amd", "vaah"] },
  GOI: { code: "GOI", city: "Goa (Dabolim)", airport: "Dabolim International Airport", aliases: ["goa", "dabolim", "goi", "vogb"] },
  GOX: { code: "GOX", city: "Goa (Mopa)", airport: "Manohar International Airport", aliases: ["mopa", "gox", "voga"] },
  JSA: { code: "JSA", city: "Jaisalmer", airport: "Jaisalmer Airport", aliases: ["jaisalmer", "jsa", "vijr"] },
  JAI: { code: "JAI", city: "Jaipur", airport: "Jaipur International Airport", aliases: ["jaipur", "rajasthan", "jai", "viip"] },
  UDR: { code: "UDR", city: "Udaipur", airport: "Maharana Pratap Airport", aliases: ["udaipur", "udr", "vaud"] },
  VNS: { code: "VNS", city: "Varanasi", airport: "Lal Bahadur Shastri International Airport", aliases: ["varanasi", "banaras", "kashi", "vns", "vebn"] },
  SXR: { code: "SXR", city: "Srinagar", airport: "Sheikh ul-Alam International Airport", aliases: ["srinagar", "kashmir", "sxr", "visr"] },
  IXL: { code: "IXL", city: "Leh", airport: "Kushok Bakula Rimpochee Airport", aliases: ["leh", "ladakh", "ixl", "vilh"] },
  IXZ: { code: "IXZ", city: "Port Blair", airport: "Veer Savarkar International Airport", aliases: ["port blair", "andaman", "havelock", "ixz", "vopb"] },
  DED: { code: "DED", city: "Dehradun", airport: "Jolly Grant Airport", aliases: ["dehradun", "rishikesh", "mussoorie", "ded", "vidn"] },
  IXB: { code: "IXB", city: "Bagdogra", airport: "Bagdogra International Airport", aliases: ["bagdogra", "darjeeling", "gangtok", "sikkim", "ixb", "vebd"] },
  ATQ: { code: "ATQ", city: "Amritsar", airport: "Sri Guru Ram Dass Jee International Airport", aliases: ["amritsar", "golden temple", "atq", "viar"] },
  GAU: { code: "GAU", city: "Guwahati", airport: "Lokpriya Gopinath Bordoloi International Airport", aliases: ["guwahati", "assam", "gau", "vegt"] },
  PNQ: { code: "PNQ", city: "Pune", airport: "Pune International Airport", aliases: ["pune", "pnq", "vaaz"] },
  TRV: { code: "TRV", city: "Thiruvananthapuram", airport: "Thiruvananthapuram International Airport", aliases: ["trivandrum", "thiruvananthapuram", "trv", "votv"] },
  IXC: { code: "IXC", city: "Chandigarh", airport: "Shaheed Bhagat Singh International Airport", aliases: ["chandigarh", "ixc", "vicg"] },
  LKO: { code: "LKO", city: "Lucknow", airport: "Chaudhary Charan Singh International Airport", aliases: ["lucknow", "lko", "vilk"] },
  // SE Asia, Vietnam & Thailand
  PQC: { code: "PQC", city: "Phu Quoc", airport: "Phu Quoc International Airport", aliases: ["phu quoc", "phuquoc", "pqc", "vvpq", "duong dong"] },
  DAD: { code: "DAD", city: "Da Nang", airport: "Da Nang International Airport", aliases: ["da nang", "danang", "dad", "vvdn"] },
  HAN: { code: "HAN", city: "Hanoi", airport: "Noi Bai International Airport", aliases: ["hanoi", "han", "vvnb"] },
  SGN: { code: "SGN", city: "Ho Chi Minh City", airport: "Tan Son Nhat International Airport", aliases: ["ho chi minh", "saigon", "sgn", "vvts"] },
  CXR: { code: "CXR", city: "Nha Trang", airport: "Cam Ranh International Airport", aliases: ["nha trang", "cam ranh", "cxr", "vvcr"] },
  HPH: { code: "HPH", city: "Hai Phong", airport: "Cat Bi International Airport", aliases: ["hai phong", "haiphong", "hph", "vvci"] },
  BKK: { code: "BKK", city: "Bangkok", airport: "Suvarnabhumi Airport", aliases: ["bangkok", "thailand", "bkk", "vtbs"] },
  DMK: { code: "DMK", city: "Bangkok", airport: "Don Mueang International Airport", aliases: ["don mueang", "dmk", "vtbd"] },
  HKT: { code: "HKT", city: "Phuket", airport: "Phuket International Airport", aliases: ["phuket", "hkt", "vtsp"] },
  KBV: { code: "KBV", city: "Krabi", airport: "Krabi International Airport", aliases: ["krabi", "kbv", "vtsg"] },
  USM: { code: "USM", city: "Koh Samui", airport: "Samui International Airport", aliases: ["koh samui", "samui", "usm", "vtsm"] },
  CNX: { code: "CNX", city: "Chiang Mai", airport: "Chiang Mai International Airport", aliases: ["chiang mai", "cnx", "vtcc"] },
  REP: { code: "REP", city: "Siem Reap", airport: "Siem Reap-Angkor International Airport", aliases: ["siem reap", "angkor", "rep", "vdsa"] },
  PNH: { code: "PNH", city: "Phnom Penh", airport: "Phnom Penh International Airport", aliases: ["phnom penh", "pnh", "vdpp"] },
  DPS: { code: "DPS", city: "Bali", airport: "Ngurah Rai International Airport", aliases: ["bali", "denpasar", "dps", "wadd"] },
  CGK: { code: "CGK", city: "Jakarta", airport: "Soekarno-Hatta International Airport", aliases: ["jakarta", "cgk", "wiie"] },
  SIN: { code: "SIN", city: "Singapore", airport: "Singapore Changi Airport", aliases: ["singapore", "changi", "sin", "wsss"] },
  KUL: { code: "KUL", city: "Kuala Lumpur", airport: "Kuala Lumpur International Airport", aliases: ["kuala lumpur", "malaysia", "kul", "wmkk"] },
  PEN: { code: "PEN", city: "Penang", airport: "Penang International Airport", aliases: ["penang", "pen", "wmkp"] },
  LGK: { code: "LGK", city: "Langkawi", airport: "Langkawi International Airport", aliases: ["langkawi", "lgk", "wmgk"] },
  // Middle East & Indian Ocean
  DXB: { code: "DXB", city: "Dubai", airport: "Dubai International Airport", aliases: ["dubai", "dxb", "omdb"] },
  SHJ: { code: "SHJ", city: "Sharjah", airport: "Sharjah International Airport", aliases: ["sharjah", "shj", "omsj"] },
  AUH: { code: "AUH", city: "Abu Dhabi", airport: "Zayed International Airport", aliases: ["abu dhabi", "auh", "omaa"] },
  DOH: { code: "DOH", city: "Doha", airport: "Hamad International Airport", aliases: ["doha", "qatar", "doh", "othh"] },
  MCT: { code: "MCT", city: "Muscat", airport: "Muscat International Airport", aliases: ["muscat", "oman", "mct", "ooms"] },
  BAH: { code: "BAH", city: "Bahrain", airport: "Bahrain International Airport", aliases: ["bahrain", "bah", "obbi"] },
  MLE: { code: "MLE", city: "Malé", airport: "Velana International Airport", aliases: ["maldives", "male", "mle", "vrmm"] },
  CMB: { code: "CMB", city: "Colombo", airport: "Bandaranaike International Airport", aliases: ["colombo", "sri lanka", "cmb", "vcbi"] },
  MRU: { code: "MRU", city: "Mauritius", airport: "Sir Seewoosagur Ramgoolam International Airport", aliases: ["mauritius", "mru", "fimp"] },
  SEZ: { code: "SEZ", city: "Seychelles", airport: "Seychelles International Airport", aliases: ["seychelles", "sez", "fsia"] },
  // East Asia
  HKG: { code: "HKG", city: "Hong Kong", airport: "Hong Kong International Airport", aliases: ["hong kong", "hkg", "vhhh"] },
  NRT: { code: "NRT", city: "Tokyo", airport: "Narita International Airport", aliases: ["tokyo", "narita", "nrt", "rjaa"] },
  HND: { code: "HND", city: "Tokyo", airport: "Haneda Airport", aliases: ["tokyo haneda", "haneda", "hnd", "rjtt"] },
  ICN: { code: "ICN", city: "Seoul", airport: "Incheon International Airport", aliases: ["seoul", "incheon", "icn", "rksi"] },
  // Europe
  CDG: { code: "CDG", city: "Paris", airport: "Paris Charles de Gaulle Airport", aliases: ["paris", "cdg", "france", "lfpg"] },
  LHR: { code: "LHR", city: "London", airport: "London Heathrow Airport", aliases: ["london", "heathrow", "lhr", "egll"] },
  LGW: { code: "LGW", city: "London", airport: "London Gatwick Airport", aliases: ["gatwick", "lgw", "egkk"] },
  AMS: { code: "AMS", city: "Amsterdam", airport: "Amsterdam Airport Schiphol", aliases: ["amsterdam", "schiphol", "ams", "eham"] },
  FRA: { code: "FRA", city: "Frankfurt", airport: "Frankfurt Airport", aliases: ["frankfurt", "fra", "eddf"] },
  ZRH: { code: "ZRH", city: "Zurich", airport: "Zurich Airport", aliases: ["zurich", "zrh", "lszh"] },
  FCO: { code: "FCO", city: "Rome", airport: "Leonardo da Vinci-Fiumicino Airport", aliases: ["rome", "fiumicino", "fco", "lirf"] },
  VIE: { code: "VIE", city: "Vienna", airport: "Vienna International Airport", aliases: ["vienna", "vie", "loww"] },
  IST: { code: "IST", city: "Istanbul", airport: "Istanbul Airport", aliases: ["istanbul", "ist", "ltfm"] },
  ATH: { code: "ATH", city: "Athens", airport: "Athens International Airport", aliases: ["athens", "ath", "lgav"] },
  MAD: { code: "MAD", city: "Madrid", airport: "Adolfo Suárez Madrid-Barajas Airport", aliases: ["madrid", "mad", "lemd"] },
  BCN: { code: "BCN", city: "Barcelona", airport: "Josep Tarradellas Barcelona-El Prat Airport", aliases: ["barcelona", "bcn", "lebl"] },
};

export const POPULAR_ROUTE_AIRPORTS = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi Int'l" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda Int'l" },
  { code: "GOI", city: "Goa", name: "Dabolim / Mopa" },
  { code: "SXR", city: "Srinagar", name: "Sheikh ul-Alam" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi" },
  { code: "PQC", city: "Phu Quoc", name: "Phu Quoc Int'l" },
  { code: "DAD", city: "Da Nang", name: "Da Nang Int'l" },
  { code: "DPS", city: "Bali", name: "Ngurah Rai" },
  { code: "DXB", city: "Dubai", name: "Dubai Int'l" },
];

// In-memory cache for dynamic airport resolutions
const DYNAMIC_RESOLVED_CACHE = new Map<string, { code: string; city: string; airport: string }>();

/**
 * Synchronous local code resolver.
 * Handles patterns like "PQC", "PQC - Phu Quoc", "DEL (Delhi)", "Phu Quoc", "Delhi".
 */
export function resolveAirportCode(input: string): string {
  if (!input) return "";

  // 1. Check if string contains an IATA pattern in parens e.g. "Phu Quoc (PQC)" or "DEL"
  const parenMatch = input.match(/\b([A-Z]{3})\b/);
  if (parenMatch && AIRPORT_CODE_CITIES[parenMatch[1]]) {
    return parenMatch[1];
  }

  // Normalize multiple spaces and lowercase
  const clean = input.replace(/\s+/g, " ").trim().toLowerCase();
  if (!clean) return "";

  // Check cached dynamic resolutions
  if (DYNAMIC_RESOLVED_CACHE.has(clean)) {
    return DYNAMIC_RESOLVED_CACHE.get(clean)!.code;
  }

  const upper = clean.toUpperCase();
  if (AIRPORT_CODE_CITIES[upper]) {
    return upper;
  }

  // Look for match in aliases
  for (const [code, item] of Object.entries(AIRPORT_CODE_CITIES)) {
    if (clean === item.city.toLowerCase() || clean.includes(item.city.toLowerCase())) {
      return code;
    }
    for (const alias of item.aliases) {
      if (clean === alias || clean.includes(alias)) {
        return code;
      }
    }
  }

  // If 3 letters, assume IATA
  if (/^[a-z]{3}$/i.test(clean)) {
    return clean.toUpperCase();
  }

  return "";
}

/**
 * Resolves complete normalized airport metadata (IATA code, City, Airport Name)
 * from an IATA code, city name, airport name, or alias.
 */
export function resolveAirportMetadata(input: string): {
  code: string;
  city: string;
  airport: string;
} {
  const clean = (input || "").trim();
  if (!clean) {
    return { code: "", city: "", airport: "" };
  }

  const code = resolveAirportCode(clean);
  if (code && AIRPORT_CODE_CITIES[code]) {
    const meta = AIRPORT_CODE_CITIES[code];
    return {
      code: meta.code,
      city: meta.city,
      airport: meta.airport,
    };
  }

  // Check dynamic resolution cache
  const normalized = clean.toLowerCase();
  if (DYNAMIC_RESOLVED_CACHE.has(normalized)) {
    const cached = DYNAMIC_RESOLVED_CACHE.get(normalized)!;
    return {
      code: cached.code,
      city: cached.city,
      airport: cached.airport,
    };
  }

  // If 3 letters, format as standard IATA code
  if (/^[a-z]{3}$/i.test(clean)) {
    const upper = clean.toUpperCase();
    return {
      code: upper,
      city: upper,
      airport: `${upper} International Airport`,
    };
  }

  // Fallback: extract 3 letters or return formatted city
  const fallbackCode = (code || clean.slice(0, 3)).toUpperCase();
  return {
    code: fallbackCode,
    city: clean,
    airport: `${clean} Airport`,
  };
}

/**
 * Asynchronous airport resolver: searches local dictionary first, then calls AeroDataBox
 * to resolve ANY city/location on earth (e.g. "Phu Quoc", "Koh Samui", "Interlaken").
 */
export async function resolveAirportCodeAsync(
  input: string,
  apiKey?: string
): Promise<{ code: string; city: string; airport: string } | null> {
  const localCode = resolveAirportCode(input);
  if (localCode && AIRPORT_CODE_CITIES[localCode]) {
    return AIRPORT_CODE_CITIES[localCode];
  }

  const normalized = input.replace(/\s+/g, " ").trim().toLowerCase();
  if (DYNAMIC_RESOLVED_CACHE.has(normalized)) {
    return DYNAMIC_RESOLVED_CACHE.get(normalized)!;
  }

  // If apiKey provided, search worldwide via AeroDataBox
  const key = apiKey || process.env.AERODATABOX_API_KEY;
  if (!key) return null;

  try {
    const url = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(normalized)}`;
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      const valid = items.find((i: any) => i.iata && i.iata.length === 3);
      if (valid) {
        const resolved = {
          code: valid.iata.toUpperCase(),
          city: valid.shortName || valid.municipalityName || valid.name,
          airport: valid.name || `${valid.shortName || valid.iata} Airport`,
        };
        DYNAMIC_RESOLVED_CACHE.set(normalized, resolved);
        return resolved;
      }
    }
  } catch (err) {
    console.warn("Dynamic airport resolution failed for:", input, err);
  }

  return null;
}

export function extractTime(timeObj?: AeroTime): string {
  if (!timeObj?.local && !timeObj?.utc) return "";
  const raw = timeObj.local || timeObj.utc || "";
  const match = raw.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

export function cleanCity(airport?: AeroAirport): string {
  const iata = (airport?.iata || "").toUpperCase();
  if (iata && AIRPORT_CODE_CITIES[iata]) {
    return AIRPORT_CODE_CITIES[iata].city;
  }
  if (airport?.municipalityName) return airport.municipalityName;
  if (airport?.shortName) return airport.shortName;
  if (airport?.name) {
    const clean = airport.name
      .replace(/\b(International|Airport|Intl|Regional)\b/gi, "")
      .trim();
    if (clean) return clean;
  }
  return iata || "";
}

export function cleanAirportName(airport?: AeroAirport, fallbackCity?: string): string {
  const iata = (airport?.iata || "").toUpperCase();
  if (iata && AIRPORT_CODE_CITIES[iata]) {
    return AIRPORT_CODE_CITIES[iata].airport;
  }
  if (airport?.name && airport.name.trim().length > 0) {
    return airport.name;
  }
  return fallbackCity ? `${fallbackCity} Airport` : "Airport";
}
