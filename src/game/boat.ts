import {
  createPlaneMesh,
  TEngine,
  TMaterialComponent,
  TMeshComponent,
  TOriginPoint,
  TResourcePackConfig,
  TSpriteComponent,
  TSpriteLayer,
  TTexture,
  TTextureComponent,
  TTextureFilter,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import config from "./config";
import boatTexture from "../assets/boat.png";

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: boatTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
};

export function createBoat(engine: TEngine, world: TWorld) {
  const y = config.topLeftCorner.y - config.waterLevel + 10;

  // Plane is created on the xz plane, so we need to rotate it to the xy plane
  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-400 + 180, y + 75, -60))
      )
    ),
    new TSpriteComponent({
      width: 360,
      height: 300,
      origin: TOriginPoint.Center,
      layer: TSpriteLayer.Foreground_0,
    }),
    new TTextureComponent(engine.resources.get<TTexture>(boatTexture)!),
    new TVisibilityComponent(),
  ]);
}
