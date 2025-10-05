import {
  createBoxMesh,
  createPlaneMesh,
  TMaterialComponent,
  TMeshComponent,
  TRigidBodyComponent,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
  createBoxCollider,
  TResourcePackConfig,
  TTextureFilter,
  TEngine,
  TSpriteComponent,
  TTextureComponent,
  TOriginPoint,
  TTexture,
  TAnimatedSpriteComponent,
  TComponent,
  TSystem,
  TEntityQuery,
  TSpriteLayer,
} from "@tedengine/ted";
import { vec3, quat, vec2, vec4 } from "gl-matrix";
import config from "./config";
import waterTexture from "../assets/water2.png";
import seabedTexture from "../assets/seabed.png";
import plantTexture from "../assets/plant.png";
import backgroundTexture from "../assets/background.png";
import sprayTexture from "../assets/spray.png";

import { MagnetComponent } from "./magnet";

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: waterTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: seabedTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: plantTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: backgroundTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
    {
      url: sprayTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
};

// Component to tag the water entity
export class WaterComponent extends TComponent {
  constructor() {
    super();
  }
}

// System to update water color based on magnet depth
export class WaterColorSystem extends TSystem {
  private waterQuery: TEntityQuery;
  private magnetQuery: TEntityQuery;
  private readonly topColor = [0.5, 0.624, 0.72, 0.8] as [
    number,
    number,
    number,
    number
  ];
  private readonly darkColor = [0.2, 0.3, 0.4, 0.8] as [
    number,
    number,
    number,
    number
  ];

  constructor(world: TWorld) {
    super();
    this.waterQuery = world.createQuery([WaterComponent, TMaterialComponent]);
    this.magnetQuery = world.createQuery([
      MagnetComponent,
      TTransformComponent,
    ]);
  }

  public async update(_: TEngine, world: TWorld): Promise<void> {
    const waterEntities = this.waterQuery.execute();
    const magnetEntities = this.magnetQuery.execute();

    if (waterEntities.length === 0 || magnetEntities.length === 0) return;

    const waterEntity = waterEntities[0];
    const magnetEntity = magnetEntities[0];

    const magnetTransform = world.getComponent(
      magnetEntity,
      TTransformComponent
    );
    if (!magnetTransform) return;

    // Calculate magnet's depth below water surface
    const waterSurfaceY = config.topLeftCorner.y - config.waterLevel;
    const magnetY = magnetTransform.transform.translation[1];
    const depth = waterSurfaceY - magnetY;

    // Determine color based on depth relative to total water depth
    let color: [number, number, number, number];

    const startDarkeningDepth = 200; // Start darkening at this depth
    const maxDepth = config.waterDepth; // Full dark at the bottom

    if (depth < startDarkeningDepth) {
      // Shallow water: use top color
      color = [...this.topColor];
    } else if (depth < maxDepth) {
      // Gradually darken from start depth to bottom
      const t =
        (depth - startDarkeningDepth) / (maxDepth - startDarkeningDepth);
      color = [
        this.topColor[0] + (this.darkColor[0] - this.topColor[0]) * t,
        this.topColor[1] + (this.darkColor[1] - this.topColor[1]) * t,
        this.topColor[2] + (this.darkColor[2] - this.topColor[2]) * t,
        this.topColor[3] + (this.darkColor[3] - this.topColor[3]) * t,
      ];
    } else {
      // At the bottom: use dark color
      color = [...this.darkColor];
    }

    // Update the water material palette (the engine now detects and applies changes)
    const materialComponent = world.getComponent(
      waterEntity,
      TMaterialComponent
    );
    if (materialComponent) {
      materialComponent.material.palette = { primary: color };
    }
  }
}

export function spawnPlant(
  engine: TEngine,
  world: TWorld,
  x: number,
  yOffset: number
) {
  const seabedY =
    config.topLeftCorner.y - config.waterLevel - config.waterDepth;

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(x, seabedY + yOffset, -90))
      )
    ),
    new TSpriteComponent({
      width: 64,
      height: 256, // Adjust based on your texture's aspect ratio
      origin: TOriginPoint.BottomCenter,
    }),
    new TAnimatedSpriteComponent(7, 16),
    new TTextureComponent(engine.resources.get<TTexture>(plantTexture)!),
    new TVisibilityComponent(),
  ]);
}

export function createWater(engine: TEngine, world: TWorld) {
  // Add the water color system
  world.addSystem(new WaterColorSystem(world));

  const backgroundTexture2 = engine.resources.get<TTexture>(backgroundTexture);
  if (backgroundTexture2) {
    world.createEntity([
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(0, 0, -101)))
      ),
      new TSpriteComponent({
        width: 800,
        height: 600, // Adjust based on your texture's aspect ratio
        origin: TOriginPoint.Center,
        layer: TSpriteLayer.Background_0,
      }),
      new TTextureComponent(backgroundTexture2),
      new TVisibilityComponent(),
    ]);
  }

  const sprayTexture2 = engine.resources.get<TTexture>(sprayTexture);
  if (sprayTexture2) {
    world.createEntity([
      TTransformBundle.with(
        new TTransformComponent(
          new TTransform(
            vec3.fromValues(0, config.topLeftCorner.y - config.waterLevel, -50)
          )
        )
      ),
      new TTextureComponent(sprayTexture2),
      new TSpriteComponent({
        width: 800,
        height: 16,
        origin: TOriginPoint.TopCenter,
        layer: TSpriteLayer.Foreground_1,
        instanceUVScales: vec2.fromValues(800 / 64, 1),
        colorFilter: vec4.fromValues(1, 1, 1, 0.3),
      }),
      new TVisibilityComponent(),
    ]);
  }

  const waterMesh = createPlaneMesh(config.waterWidth, config.waterDepth);

  // Replace water material with water color
  waterMesh.material.palette = {
    primary: config.waterColor as [number, number, number, number],
  };

  // Position so the top edge is waterLevel down from the top of the screen
  const y = config.topLeftCorner.y - config.waterLevel - config.waterDepth / 2;

  // Plane is created on the xz plane, so we need to rotate it to the xy plane
  const rotation = quat.fromEuler(quat.create(), 90, 0, 0);
  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(
          vec3.fromValues(0, y, -100),
          rotation,
          vec3.fromValues(1, 1, 1)
        )
      )
    ),
    new TMeshComponent({ source: "inline", geometry: waterMesh.geometry }),
    new TMaterialComponent(waterMesh.material),
    new TVisibilityComponent(),
    new WaterComponent(),
  ]);

  // Add seabed at the bottom (moved up slightly to be visible)
  const seabedY =
    config.topLeftCorner.y - config.waterLevel - config.waterDepth;
  const seabedTexture2 = engine.resources.get<TTexture>(seabedTexture);
  if (seabedTexture2) {
    world.createEntity([
      TTransformBundle.with(
        new TTransformComponent(
          new TTransform(vec3.fromValues(0, seabedY, -98))
        )
      ),
      new TSpriteComponent({
        width: config.waterWidth,
        height: 100, // Adjust based on your texture's aspect ratio
        origin: TOriginPoint.BottomCenter,
      }),
      new TTextureComponent(seabedTexture2),
      new TVisibilityComponent(),
    ]);
  }

  // Plants
  spawnPlant(engine, world, 200, 20);
  spawnPlant(engine, world, 300, -30);
  spawnPlant(engine, world, 0, -10);

  // Add boundary box colliders to stop magnet going out of bounds
  // Top
  createWall(
    world,
    config.topLeftCorner.x + config.waterWidth / 2,
    config.topLeftCorner.y - config.waterLevel,
    config.waterWidth,
    20,
    100
  );

  // Bottom
  createWall(
    world,
    config.topLeftCorner.x + config.waterWidth / 2,
    config.topLeftCorner.y - config.waterLevel - config.waterDepth,
    config.waterWidth,
    20,
    100
  );

  // Left
  createWall(
    world,
    config.topLeftCorner.x,
    config.topLeftCorner.y - config.waterLevel - config.waterDepth / 2,
    20,
    config.waterDepth,
    100
  );

  // Right
  createWall(
    world,
    config.topLeftCorner.x + config.waterWidth,
    config.topLeftCorner.y - config.waterLevel - config.waterDepth / 2,
    20,
    config.waterDepth,
    100
  );
}

function createWall(
  world: TWorld,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number
) {
  const wall = createBoxMesh(width, height, depth);
  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(new TTransform(vec3.fromValues(x, y, -50)))
    ),
    new TMeshComponent({ source: "inline", geometry: wall.geometry }),
    // new TMaterialComponent(wall.material),
    new TVisibilityComponent(),
    new TRigidBodyComponent(
      { mass: 0 },
      createBoxCollider(width, height, depth, "Solid")
    ),
  ]);
}
