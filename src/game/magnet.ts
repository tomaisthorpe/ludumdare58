import {
  TWorld,
  createBoxMesh,
  TTransformBundle,
  TTransformComponent,
  TTransform,
  TMeshComponent,
  TMaterialComponent,
  TVisibilityComponent,
  TRigidBodyComponent,
  createBoxCollider,
  TPlayerInputComponent,
  TFixedAxisCameraTargetComponent,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import config from "./config";
import { PlayerMovementComponent } from "./player-movement";

export function createMagnet(world: TWorld) {
  const boxMesh = createBoxMesh(10, 10, 10);
  const magnet = world.createEntity();
  world.addComponents(magnet, [
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(
          vec3.fromValues(
            config.topLeftCorner.x + 300,
            config.topLeftCorner.y - config.waterLevel - 20,
            0
          )
        )
      )
    ),
    new TMeshComponent({ source: "inline", geometry: boxMesh.geometry }),
    new TMaterialComponent(boxMesh.material),
    new TVisibilityComponent(),
    new TRigidBodyComponent(
      {
        mass: 1,
        linearDamping: 0.9,
        angularDamping: 0.3,
      },
      createBoxCollider(10, 10, 10)
    ),
    new TPlayerInputComponent(),
    new PlayerMovementComponent(),
    new TFixedAxisCameraTargetComponent(),
  ]);
}
