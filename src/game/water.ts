import {
  createPlaneMesh,
  TMaterialComponent,
  TMeshComponent,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
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
          vec3.fromValues(0, y, 0),
          rotation,
          vec3.fromValues(1, 1, 1)
        )
      )
    ),
    new TMeshComponent({ source: "inline", geometry: waterMesh.geometry }),
    new TMaterialComponent(waterMesh.material),
    new TVisibilityComponent(),
  ]);
}
