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
} from "@tedengine/ted";
import { vec3, quat } from "gl-matrix";
import config from "./config";
import waterTexture from "../assets/water2.png";
import seabedTexture from "../assets/seabed.png";
import plantTexture from "../assets/plant.png";

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
  ],
};

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
