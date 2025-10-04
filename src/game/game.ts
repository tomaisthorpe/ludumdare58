import { TGameState, TEngine } from "@tedengine/ted";

export default class GameState extends TGameState {
  public async onCreate() {
    this.onReady();
  }

  public beforeWorldCreate() {
    this.world!.config.mode = "2d";
  }

  public onReady() {}
}

const gameConfig = {
  states: {
    game: GameState,
  },
  defaultState: "game",
};

new TEngine(gameConfig, self);
