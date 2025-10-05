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
      density: 2,
    },
    {
      type: "coin",
      value: 10,
      spawn: {
        start: 300,
        end: 600,
      },
      density: 1.2,
    },
    {
      type: "goblet",
      value: 25,
      spawn: {
        start: 550,
        end: 700,
      },
      density: 1.0,
    },
    {
      type: "dagger",
      value: 80,
      spawn: {
        start: 750,
        end: 900,
      },
      density: 0.5,
    },
  ] as LootConfig[],

  equipment: {
    winchSpeeds: [55, 115, 200],
    winchCosts: [30, 60, 0],
    ropeLengths: [450, 650, 825, 1200],
    ropeCosts: [20, 80, 140, 200, 0],
    maxWinchSpeed: 3,
    maxRopeLength: 4,
  },

  dayLength: 30, // in seconds

  // Top left corner of the screen
  topLeftCorner: {
    x: -400,
    y: 300,
  },
  lootValues: {
    low: 10,
    treasure: Infinity,
  },

  eel: {
    spawnInterval: 3,
    minDepth: 400, // Minimum depth below water surface to spawn
    maxDepth: 800, // Maximum depth below water surface to spawn (avoids bottom 200 units)
    speed: 90,
    width: 64,
    height: 16,
    frameCount: 16,
    fps: 10,
    collisionRadius: 30, // Distance at which eel collides with magnet
    electrocutionDuration: 3, // Seconds the magnet is disabled for
    pulseInterval: 2, // Seconds between pulses
    pulseDuration: 0.3, // Duration of each pulse in seconds
  },
};

export default config;
