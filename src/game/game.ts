import {
  TGameState,
  TEngine,
  setPlayerInputMapping,
  TPlayerInputSystem,
} from "@tedengine/ted";
import { PlayerMovementSystem } from "./player-movement";
import { createWater } from "./water";
import { createBoat } from "./boat";
import { createCamera } from "./camera";
import { createMagnet } from "./magnet";
import { createLoot } from "./loot.ts";
import { RopeLinksSystem, createRopeLinks } from "./rope";

export default class GameState extends TGameState {
  public async onCreate() {
    this.onReady();
  }

  public beforeWorldCreate() {
    this.world!.config.mode = "2d";
    // this.world!.config.gravity = vec3.fromValues(0, 0, 0);
    this.world!.physicsDebug = true;
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
    // createRope(this.world);
    createRopeLinks(this.world);
    createWater(this.world);
    createBoat(this.world);
    createLoot(this.world);
  }
}

const gameConfig = {
  states: {
    game: GameState,
  },
  defaultState: "game",
};

new TEngine(gameConfig, self);
