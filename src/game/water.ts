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
} from "@tedengine/ted";
import { vec3, quat } from "gl-matrix";
import config from "./config";

export function createWater(world: TWorld) {
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
