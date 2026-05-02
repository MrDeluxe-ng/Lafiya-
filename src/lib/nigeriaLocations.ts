export const PREDIFINED_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Kano": {
    "Nasarawa": [
      "Nasarawa Gingyu",
      "Bama",
      "Dakata",
      "Gama",
      "Gawuna",
      "Gwagwarwa",
      "Hotoro North",
      "Hotoro South",
      "Kauran Goje",
      "Kawai",
      "Tudun Murtala"
    ],
    "Dala": ["Adakawa", "Bakin Ruwa", "Dala", "Dogon Nama", "Gobirawa"],
    "Gwale": ["Diso", "Dorayi", "Galadanci", "Gwale", "Kabuga", "Mandawari"],
    "Kano Municipal": ["Chesan", "Fagge", "Jakara", "Kankarofi", "Shahuchi", "Tudun Wazirchi"],
    "Tarauni": ["Babban Giji", "Darma", "Hotoro NNPC", "Tarauni", "Unguwa Uku"]
  },
  "Lagos": {
    "Ikeja": ["Alausa", "Anifowoshe", "Gra", "Ikeja", "Oregun", "Opebi"],
    "Surulere": ["Aguda", "Coker", "Itire", "Yaba"],
    "Lagos Island": ["Olowogbowo", "Isale Eko", "Lafiaji"]
  },
  "FCT - Abuja": {
    "Abuja Municipal": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
    "Bwari": ["Bwari", "Kubwa", "Ushafa", "Dutse"],
    "Gwagwalada": ["Gwagwalada Centre", "Kwali", "Zuba"]
  },
  "Kaduna": {
    "Kaduna North": ["Badarawa", "Doka", "Kawo", "Unguwan Rimi"],
    "Kaduna South": ["Makera", "Tudun Wada", "Unguwan Sanusi"]
  },
  "Rivers": { 
    "Port Harcourt": ["Orogbum", "Oromerezimgbu", "Rumuobiekwe"], 
    "Obio-Akpor": ["Rumuigbo", "Rumuokwuta", "Rumuola"] 
  },
  "Nasarawa": { 
    "Karu": ["Ado", "Mararaba", "Masaka"], 
    "Keffi": ["Angwan Rimi", "Jigwada", "Tudun Kofar"] 
  }
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", 
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", 
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", 
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export const getLgasForState = (state: string): string[] => {
  if (!state) return [];
  if (PREDIFINED_LOCATIONS[state]) {
    return Object.keys(PREDIFINED_LOCATIONS[state]);
  }
  // Generic fallback for MVP for states not explicitly mapped above
  return ["Central LGA", "North LGA", "South LGA", "East LGA", "West LGA"];
};

export const getWardsForLga = (state: string, lga: string): string[] => {
  if (!state || !lga) return [];
  if (PREDIFINED_LOCATIONS[state] && PREDIFINED_LOCATIONS[state][lga]) {
    return PREDIFINED_LOCATIONS[state][lga];
  }
  // Generic fallback for MVP
  return ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];
};
