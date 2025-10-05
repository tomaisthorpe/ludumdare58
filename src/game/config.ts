export type LootType = "can" | "coin" | "goblet" | "dagger";
export type LootConfig = {
  type: LootType;
  value: number;
  spawn: {
    start: number; // start y below water level
    end: number; // end y below water level
  };
  density: number;
};

const config = {
  gameHeight: 600,
  waterDepth: 1000,
  waterWidth: 800,
  waterColor: [0.5, 0.624, 0.72, 0.8],
  waterLevel: 400, // How far down the water is when at the surface
  palette: {
    rope: [0.3, 0.3, 0.3, 1],
    loot: [0.5, 0.2, 0.2, 1],
    magnet: [0.337, 0.522, 0.345, 1],
  },

  loot: [
    {
      type: "can",
      value: 5,
      spawn: {
        start: 200,
        end: 400,
      },
      density: 1,
    },
    {
      type: "coin",
      value: 10,
      spawn: {
        start: 100,
        end: 300,
      },
      density: 1,
    },
    {
      type: "goblet",
      value: 20,
      spawn: {
        start: 300,
        end: 700,
      },
      density: 0.5,
    },
    {
      type: "dagger",
      value: 50,
      spawn: {
        start: 80,
        end: 400,
      },
      density: 0.5,
    },
  ] as LootConfig[],

  equipment: {
    winchSpeeds: [150, 250, 450],
    ropeLengths: [10000, 200, 600],
    maxWinchSpeed: 3,
    maxRopeLength: 3,
  },

  dayLength: 10, // in seconds

  // Top left corner of the screen
  topLeftCorner: {
    x: -400,
    y: 300,
  },
  lootValues: {
    low: 10,
    treasure: Infinity,
  },
};

export default config;
