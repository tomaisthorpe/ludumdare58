const config = {
  gameHeight: 600,
  waterDepth: 500,
  waterWidth: 800,
  waterColor: [0.5, 0.624, 0.72, 0.8],
  waterLevel: 400, // How far down the water is when at the surface
  palette: {
    rope: [0.3, 0.3, 0.3, 1],
    loot: [0.5, 0.2, 0.2, 1],
    magnet: [0.337, 0.522, 0.345, 1],
  },

  equipment: {
    winchSpeeds: [150, 250, 450],
    ropeLengths: [100, 200, 300],
    maxWinchSpeed: 3,
    maxRopeLength: 3,
  },

  dayLength: 3, // in seconds

  // Top left corner of the screen
  topLeftCorner: {
    x: -400,
    y: 300,
  },
};

export default config;
