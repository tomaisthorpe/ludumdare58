import {
  TWorld,
  TFixedAxisCameraComponent,
  TCameraComponent,
  TProjectionType,
  TTransformBundle,
  TTransformComponent,
  TTransform,
  TActiveCameraComponent,
  TOrbitCameraComponent,
  TMouseInputComponent,
  TMouseInputSystem,
  TOrbitCameraSystem,
  TInputManager,
  TFixedAxisCameraSystem,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import config from "./config";

export function createCamera(world: TWorld, inputManager: TInputManager) {
  world.addSystem(new TOrbitCameraSystem(world, inputManager));
  world.addSystem(new TMouseInputSystem(world, inputManager));
  world.addSystem(new TFixedAxisCameraSystem(world));

  const fixedComponent = new TFixedAxisCameraComponent({
    distance: 10,
    axis: "z",
    leadFactor: 50,
    maxLead: 0.9,
    lerpFactor: 0.9,
    bounds: {
      min: vec3.fromValues(
        0,
        config.gameHeight - config.waterLevel - config.waterDepth,
        0
      ),
      max: vec3.fromValues(0, 0, 100),
    },
  });

  // Setup ortho camera
  const ortho = world.createEntity();
  const orthoComponent = new TCameraComponent({
    type: TProjectionType.Orthographic,
    zNear: 0.1,
    zFar: 1000,
  });
  world.addComponents(ortho, [
    orthoComponent,
    TTransformBundle.with(
      new TTransformComponent(new TTransform(vec3.fromValues(0, 0, 50)))
    ),
    TActiveCameraComponent,
    fixedComponent,
  ]);
  world.cameraSystem.setActiveCamera(ortho);

  // Orbit camera for debug
  const orbit = world.createEntity();
  world.addComponents(orbit, [
    new TCameraComponent({ type: TProjectionType.Perspective, fov: 45 }),
    TTransformBundle.with(
      new TTransformComponent(new TTransform(vec3.fromValues(0, 0, 0)))
    ),
    new TActiveCameraComponent(),
    new TOrbitCameraComponent({
      distance: 20,
      speed: 0.5,
      enableDrag: true,
    }),
    new TMouseInputComponent(),
  ]);

  // this.world.cameraSystem.setActiveCamera(orbit);
}
