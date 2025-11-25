export interface Governorate {
  name: string;
  cities: string[];
}

export const bahrainData: { governorates: Governorate[] } = {
  governorates: [
    {
      name: "Capital Governorate",
      cities: [
        "Manama",
        "Adliya",
        "Gudaibiya",
        "Juffair",
        "Hoora",
        "Sanabis",
        "Ras Rumman",
        "Zinj",
        "Seef",
        "Diplomatic Area"
      ]
    },
    {
      name: "Muharraq Governorate",
      cities: ["Muharraq", "Al Hidd", "Arad", "Busaiteen", "Dair", "Galali", "Samaheej", "Al Qalali"]
    },
    {
      name: "Northern Governorate",
      cities: [
        "Hamad Town",
        "A'ali",
        "Budaiya",
        "Bani Jamra",
        "Barbar",
        "Diraz",
        "Dumistan",
        "Jannusan",
        "Sar",
        "Karranah",
        "Maqaba",
        "Shakhoura",
        "Saar"
      ]
    },
    {
      name: "Central Governorate",
      cities: [
        "Sitra",
        "Isa Town",
        "Riffa",
        "East Riffa",
        "West Riffa",
        "Jidhafs",
        "Tubli",
        "Salihiya",
        "Bilad Al Qadeem",
        "Umm Al Hassam"
      ]
    },
    {
      name: "Southern Governorate",
      cities: ["Zallaq", "Askar", "Awali", "Durrat Al Bahrain", "Jaw", "Sakhir", "Al Markh"]
    }
  ]
};

export const getAllGovernorateNames = (): string[] => {
  return bahrainData.governorates.map(g => g.name);
};

export const getCitiesByGovernorate = (governorateName: string): string[] => {
  const governorate = bahrainData.governorates.find(g => g.name === governorateName);
  return governorate ? governorate.cities : [];
};

export const getAllCities = (): string[] => {
  return bahrainData.governorates.flatMap(g => g.cities);
};

export const getShortGovernorateName = (name: string): string => {
  return name.replace(' Governorate', '');
};

export const findGovernorateByCity = (cityName: string): string | null => {
  const governorate = bahrainData.governorates.find(g =>
    g.cities.some(c => c.toLowerCase() === cityName.toLowerCase())
  );
  return governorate ? governorate.name : null;
};
