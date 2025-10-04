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
} from "@tedengine/ted";
import {
  PlayerMovementComponent,
  PlayerMovementSystem,
} from "./player-movement";
import { vec3 } from "gl-matrix";

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
    ]);
    this.world.cameraSystem.setActiveCamera(ortho);

    setPlayerInputMapping(this.engine.inputManager);
    this.world.addSystem(
      new TPlayerInputSystem(this.world, this.engine.inputManager)
    );

    this.world.addSystem(new PlayerMovementSystem(this.world));

    const boxMesh = createBoxMesh(10, 10, 10);
    const box = this.world.createEntity();
    this.world.addComponents(box, [
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(0, 5, 0)))
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
    ]);
  }
}

const gameConfig = {
  states: {
    game: GameState,
  },
  defaultState: "game",
};

new TEngine(gameConfig, self);
