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

export function createBoat(world: TWorld) {
  const boatMesh = createPlaneMesh(300, 100);

  // Replace water material with water color
  boatMesh.material.palette = {
    primary: [0.5, 0.5, 0.5, 1],
  };

  const y = config.topLeftCorner.y - config.waterLevel + 10;

  // Plane is created on the xz plane, so we need to rotate it to the xy plane
  const rotation = quat.fromEuler(quat.create(), 90, 0, 0);
  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(
          vec3.fromValues(-300, y, -90),
          rotation,
          vec3.fromValues(1, 1, 1)
        )
      )
    ),
    new TMeshComponent({ source: "inline", geometry: boatMesh.geometry }),
    new TMaterialComponent(boatMesh.material),
    new TVisibilityComponent(),
  ]);

  // Create second boat for 'underwater' effect
  const boatMesh2 = createPlaneMesh(300, 40);
  boatMesh2.material.palette = {
    primary: [0.5, 0.53, 0.56, 1.0],
  };
  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(
          vec3.fromValues(-300, y - 30, -85),
          rotation,
          vec3.fromValues(1, 1, 1)
        )
      )
    ),
    new TMeshComponent({ source: "inline", geometry: boatMesh2.geometry }),
    new TMaterialComponent(boatMesh2.material),
    new TVisibilityComponent(),
  ]);
}
