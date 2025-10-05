import {
  TEngine,
  TOriginPoint,
  TResourcePackConfig,
  TSpriteComponent,
  TSpriteLayer,
  TTexture,
  TTextureComponent,
  TTextureFilter,
  TTextureWrap,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import config from "./config";
import boatTexture from "../assets/boat.png";
import pulleyTexture from "../assets/pulley.png";
import winchTexture from "../assets/wheel.png";

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: boatTexture,
      config: {
        filter: TTextureFilter.Nearest,
        wrapS: TTextureWrap.ClampToEdge,
        wrapT: TTextureWrap.ClampToEdge,
      },
    },
    {
      url: pulleyTexture,
      config: {
        filter: TTextureFilter.Nearest,
        wrapS: TTextureWrap.ClampToEdge,
        wrapT: TTextureWrap.ClampToEdge,
      },
    },
    {
      url: winchTexture,
      config: {
        filter: TTextureFilter.Nearest,
        wrapS: TTextureWrap.ClampToEdge,
        wrapT: TTextureWrap.ClampToEdge,
      },
    },
  ],
};

export function createBoat(engine: TEngine, world: TWorld) {
  const y = config.topLeftCorner.y - config.waterLevel + 10;

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-400 + 180, y + 75, -65))
      )
    ),
    new TSpriteComponent({
      width: 360,
      height: 300,
      origin: TOriginPoint.Center,
      layer: TSpriteLayer.Midground_2,
    }),
    new TTextureComponent(engine.resources.get<TTexture>(boatTexture)!),
    new TVisibilityComponent(),
  ]);

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-400 + 180, y + 75, -80))
      )
    ),
    new TSpriteComponent({
      width: 360,
      height: 300,
      origin: TOriginPoint.Center,
      layer: TSpriteLayer.Midground_0,
    }),
    new TTextureComponent(engine.resources.get<TTexture>(pulleyTexture)!),
    new TVisibilityComponent(),
  ]);

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-214, y + 67, -70))
      )
    ),
    new TSpriteComponent({
      width: 100,
      height: 100,
      origin: TOriginPoint.Center,
      layer: TSpriteLayer.Midground_1,
    }),
    new TTextureComponent(engine.resources.get<TTexture>(winchTexture)!),
    new TVisibilityComponent(),
  ]);
}
