export interface Wonder {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
}

export const Wonders: Wonder[] = [
  {
    name: "Great Wall of China",
    latitude: 40.4319,
    longitude: 116.5704,
    description: "Built across different dynasties starting around 7th century BC, the Great Wall stretches over 13,000 miles and was designed to protect Chinese states from nomadic attacks."
  },
  {
    name: "Petra",
    latitude: 30.3285,
    longitude: 35.4444,
    description: "An ancient city carved into pink sandstone cliffs in southern Jordan, established around 300 BC as the capital of the Nabataean Kingdom."
  },
  {
    name: "Christ the Redeemer",
    latitude: -22.9519,
    longitude: -43.2106,
    description: "This 98-foot Art Deco statue of Jesus Christ in Rio de Janeiro, Brazil was completed in 1931 and stands atop the 2,300-foot Corcovado mountain."
  },
  {
    name: "Machu Picchu",
    latitude: -13.1631,
    longitude: -72.5450,
    description: "Built in the 15th century, this Incan citadel sits on a 7,970-foot mountain ridge in Peru and was unknown to the outside world until 1911."
  },
  {
    name: "Chichen Itza",
    latitude: 20.6843,
    longitude: -88.5677,
    description: "A complex of Mayan ruins on Mexico's Yucatán Peninsula, built by the Maya people between the 9th and 12th centuries. The massive El Castillo pyramid dominates the site."
  },
  {
    name: "Colosseum",
    latitude: 41.8902,
    longitude: 12.4922,
    description: "Completed in 80 AD, this massive amphitheater in Rome could hold up to 80,000 spectators who gathered to watch gladiatorial contests and public spectacles."
  },
  {
    name: "Taj Mahal",
    latitude: 27.1751,
    longitude: 78.0421,
    description: "This white marble mausoleum in Agra, India was built by Emperor Shah Jahan between 1631 and 1648 in memory of his favorite wife. It's considered the finest example of Mughal architecture."
  }
];
