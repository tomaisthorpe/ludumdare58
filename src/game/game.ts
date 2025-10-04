import {
  TGameState,
  TEngine,
  setPlayerInputMapping,
  TPlayerInputSystem,
  TWorld,
  TTransformComponent,
  TFixedAxisCameraTargetComponent,
} from "@tedengine/ted";
import { PlayerMovementSystem } from "./player-movement";
import { createWater } from "./water";
import { createBoat } from "./boat";
import { createCamera } from "./camera";
import { createMagnet } from "./magnet";
import { createLoot, LootSystem } from "./loot.ts";
import { RopeLinksSystem, createRopeLinks } from "./rope";
import { vec3, vec4, mat4 } from "gl-matrix";

export default class GameState extends TGameState {
  public lootSystem!: LootSystem;
  public day = 1;
  public money = 0;

  public async onCreate() {
    this.onReady();
  }

  public beforeWorldCreate() {
    this.world!.config.mode = "2d";
    // this.world!.config.gravity = vec3.fromValues(0, 0, 0);
    // this.world!.physicsDebug = true;
  }

  public onReady() {
    if (!this.engine || !this.world) return;

    setPlayerInputMapping(this.engine.inputManager);
    this.world.addSystem(
      new TPlayerInputSystem(this.world, this.engine.inputManager)
    );

    this.world.addSystem(new PlayerMovementSystem(this.world));
    this.world.addSystem(new RopeLinksSystem(this.world));

    createCamera(this.world, this.engine.inputManager);
    createMagnet(this.world);
    createRopeLinks(this.world);
    createWater(this.world);
    createBoat(this.world);
    this.lootSystem = createLoot(this.world, (value: number) => {
      this.money += value;
      this.refreshGameContext();
    });

    this.refreshGameContext();
  }

  private refreshGameContext() {
    this.engine.updateGameContext({
      money: this.money,
      day: this.day,
      magnetScreenPos: getMagnetScreenPos(this.world!, this.engine),
      magnetValue: this.lootSystem.currentValue,
    });
  }

  public onUpdate() {
    this.refreshGameContext();
  }
}

function worldToScreen(
  worldPos: vec3,
  vp: mat4,
  width: number,
  height: number
) {
  const clip = vec4.transformMat4(
    vec4.create(),
    vec4.fromValues(worldPos[0], worldPos[1], worldPos[2], 1),
    vp
  );
  const ndcX = clip[0] / clip[3];
  const ndcY = clip[1] / clip[3];
  const x = (ndcX * 0.5 + 0.5) * width;
  const y = (-ndcY * 0.5 + 0.5) * height;
  return { x, y };
}

function getMagnetScreenPos(world: TWorld, engine: TEngine) {
  const vp = world.cameraSystem.getProjectionMatrix(
    engine.renderingSize.width,
    engine.renderingSize.height
  );
  const q = world.createQuery([
    TFixedAxisCameraTargetComponent,
    TTransformComponent,
  ]);
  const [magnet] = q.execute();
  const transform = world.getComponents(magnet)!.get(TTransformComponent)!;
  return worldToScreen(
    transform.transform.translation,
    vp,
    engine.renderingSize.width,
    engine.renderingSize.height
  );
}

const gameConfig = {
  states: {
    game: GameState,
  },
  defaultState: "game",
};

new TEngine(gameConfig, self);
