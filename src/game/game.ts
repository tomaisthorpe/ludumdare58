import {
  TGameState,
  TEngine,
  setPlayerInputMapping,
  TPlayerInputSystem,
  TMaterialComponent,
  TMeshComponent,
  createBoxMesh,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  createBoxCollider,
  TRigidBodyComponent,
  TPlayerInputComponent,
  TProjectionType,
  TCameraComponent,
  TActiveCameraComponent,
  TOrbitCameraComponent,
  TMouseInputComponent,
  TMouseInputSystem,
  TOrbitCameraSystem,
  TFixedAxisCameraSystem,
  TFixedAxisCameraTargetComponent,
  TFixedAxisCameraComponent,
} from "@tedengine/ted";
import {
  PlayerMovementComponent,
  PlayerMovementSystem,
} from "./player-movement";
import { vec3 } from "gl-matrix";
import { createWater } from "./water";
import config from "./config";

export default class GameState extends TGameState {
  public async onCreate() {
    this.onReady();
  }

  public beforeWorldCreate() {
    this.world!.config.mode = "2d";
    this.world!.config.gravity = vec3.fromValues(0, 0, 0);
  }

  public onReady() {
    if (!this.engine || !this.world) return;
    this.world.addSystem(
      new TOrbitCameraSystem(this.world, this.engine.inputManager)
    );

    this.world.addSystem(
      new TMouseInputSystem(this.world, this.engine.inputManager)
    );

    this.world.addSystem(new TFixedAxisCameraSystem(this.world));

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
    const ortho = this.world.createEntity();
    const orthoComponent = new TCameraComponent({
      type: TProjectionType.Orthographic,
      zNear: 0.1,
      zFar: 1000,
    });
    this.world.addComponents(ortho, [
      orthoComponent,
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(0, 0, 50)))
      ),
      TActiveCameraComponent,
      fixedComponent,
    ]);
    this.world.cameraSystem.setActiveCamera(ortho);

    // Orbit camera for debug
    const orbit = this.world.createEntity();
    this.world.addComponents(orbit, [
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

    setPlayerInputMapping(this.engine.inputManager);
    this.world.addSystem(
      new TPlayerInputSystem(this.world, this.engine.inputManager)
    );

    this.world.addSystem(new PlayerMovementSystem(this.world));

    const boxMesh = createBoxMesh(10, 10, 10);
    const magnet = this.world.createEntity();
    this.world.addComponents(magnet, [
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
        { mass: 1, linearDamping: 0.9 },
        createBoxCollider(1, 1, 1)
      ),
      new TPlayerInputComponent(),
      new PlayerMovementComponent(),
      new TFixedAxisCameraTargetComponent(),
    ]);

    createWater(this.world);
  }
}

const gameConfig = {
  states: {
    game: GameState,
  },
  defaultState: "game",
};

new TEngine(gameConfig, self);
