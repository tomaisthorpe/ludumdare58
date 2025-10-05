import {
  TGameState,
  TEngine,
  setPlayerInputMapping,
  TPlayerInputSystem,
  TWorld,
  TTransformComponent,
  TFixedAxisCameraTargetComponent,
  TKeyDownEvent,
  TResourcePack,
} from "@tedengine/ted";
import { PlayerMovementSystem } from "./player-movement";
import { createWater, resources as waterResources } from "./water";
import { resources as magnetResources } from "./magnet";
import { createBoat, resources as boatResources } from "./boat";
import { createCamera } from "./camera";
import { createMagnet } from "./magnet";
import {
  createLoot,
  LootSystem,
  LootType,
  resources as lootResources,
} from "./loot.ts";
import { RopeLinksSystem, createRopeLinks } from "./rope";
import { vec3, vec4, mat4 } from "gl-matrix";
import config from "./config";
import { Upgrade } from "../UpdateModal.tsx";

export default class GameState extends TGameState {
  public lootSystem!: LootSystem;
  public playerMovementSystem!: PlayerMovementSystem;

  public day = 1;
  public money = 100;

  public timeLeft = config.dayLength;
  public state: "start" | "fishing" | "upgrade" | "win" = "start";

  public equipment = {
    winchSpeed: 1,
    ropeLength: 1,
  };

  public dropMagnet!: () => void;
  public resetMagnet!: () => void;
  public changeRopeLength!: (length: number) => void;

  public async onCreate() {
    const rp = new TResourcePack(
      this.engine,
      lootResources,
      waterResources,
      magnetResources,
      boatResources
    );
    await rp.load();

    this.onReady();
  }

  public beforeWorldCreate() {
    this.world!.config.mode = "2d";
    // this.world!.config.gravity = vec3.fromValues(0, -98.1, 0);
    // this.world!.physicsDebug = true;
  }

  public onReady() {
    if (!this.engine || !this.world) return;

    setPlayerInputMapping(this.engine.inputManager);
    this.world.addSystem(
      new TPlayerInputSystem(this.world, this.engine.inputManager)
    );

    this.playerMovementSystem = new PlayerMovementSystem(this.world, this);
    this.world.addSystem(this.playerMovementSystem);
    this.world.addSystem(new RopeLinksSystem(this.world));

    createCamera(this.world, this.engine.inputManager);
    const { dropMagnet, resetMagnet, changeRopeLength } = createMagnet(
      this.engine,
      this.world
    );
    this.resetMagnet = resetMagnet.bind(this);
    this.dropMagnet = dropMagnet.bind(this);
    this.changeRopeLength = changeRopeLength.bind(this);

    createRopeLinks(this.world);
    createWater(this.engine, this.world);
    createBoat(this.engine, this.world);
    this.lootSystem = createLoot(
      this.engine,
      this.world,
      (type: LootType, value: number) => {
        if (type === "treasure") {
          // yay, win the game
          this.win();
        }

        this.money += value;
      }
    );

    this.lootSystem.spawnLoot();

    this.refreshGameContext();
    this.onSpace = this.onSpace.bind(this);

    this.events.addListener<TKeyDownEvent>("keydown", (event) => {
      if (event.subType === "Space") {
        this.onSpace();
      }
    });

    this.events.addListener("UPGRADE_EQUIPMENT", (event) => {
      // Check cost first
      if (event.payload === undefined) return;
      const upgrade = event.payload as Upgrade;
      if (upgrade.cost > this.money) return;
      this.money -= upgrade.cost;

      switch (upgrade.type) {
        case "winchSpeed":
          this.equipment.winchSpeed = upgrade.level;
          this.playerMovementSystem.winchSpeed =
            config.equipment.winchSpeeds[upgrade.level - 1];
          break;
        case "ropeLength":
          this.equipment.ropeLength = upgrade.level;
          this.changeRopeLength(
            config.equipment.ropeLengths[upgrade.level - 1]
          );
      }
    });

    this.events.addListener("START_NEXT_DAY", () => {
      this.startNextDay();
    });
  }

  private win() {
    this.state = "win";
    this.resetMagnet();
  }

  private startNextDay() {
    this.state = "start";
    this.lootSystem.spawnLoot();
  }

  private onSpace() {
    if (this.state === "start") {
      console.log("dropping magnet");
      this.dropMagnet();
      this.state = "fishing";
    }
  }

  private refreshGameContext() {
    this.engine.updateGameContext({
      money: this.money,
      day: this.day,
      magnetScreenPos: getMagnetScreenPos(this.world!, this.engine),
      magnetValue: this.lootSystem.currentValue,
      state: this.state,
      equipment: this.equipment,
    });
  }

  private onDayEnd() {
    this.timeLeft = config.dayLength;
    this.day++;

    this.state = "upgrade";
    this.resetMagnet();
  }

  public onUpdate(_: TEngine, delta: number) {
    this.refreshGameContext();

    if (this.state !== "fishing") return;

    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.onDayEnd();
    }
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
