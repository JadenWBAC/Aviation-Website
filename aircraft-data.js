/**
 * Aircraft data for aircraft.html
 *
 * ONE entry per plane. scripts.js reads this list and builds a card for each entry,
 * so adding a plane = adding one block here. No HTML to copy and paste.
 *
 * Want another spec on the card (Seats? First flight?)?
 * Add it to the "specs" of each plane. The card shows whatever is in "specs".
 */
const AIRCRAFT = [
  {
    name: "Airbus A350-900",
    image: "images/a350-900.png",
    alt: "Airbus A350",
    link: "https://aircraft.airbus.com/en/aircraft/a350/a350-900",
    specs: {
      "Range": "8,000nm",
      "Engines": "Rolls-Royce Trent XWB"
    }
  },
  {
    name: "Boeing 787 Dreamliner",
    image: "images/b787.jpg",
    alt: "Boeing 787 Dreamliner",
    link: "https://www.boeing.com/commercial/787/",
    specs: {
      "Range": "7,635nm",
      "Engines": "GEnx / Trent 1000"
    }
  },
  {
    name: "Boeing 777X",
    image: "images/b777x.jpg",
    alt: "Boeing 777X",
    link: "https://www.boeing.com/commercial/777x/",
    specs: {
      // As far as I know 8,730nm is the 777-8 figure and the 777-9 is shorter.
      // Worth checking against boeing.com and naming the variant.
      "Range": "8,730nm",
      "Engines": "GE9X"
    }
  },
  {
    name: "Airbus A380",
    image: "images/a380.jpg",
    alt: "Airbus A380",
    link: "https://aircraft.airbus.com/en/aircraft/a380",
    specs: {
      "Range": "8,000nm",
      "Engines": "GP7200 / Trent 900"
    }
  }
];
