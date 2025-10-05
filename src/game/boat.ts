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
  TComponent,
  TSystem,
  TEntityQuery,
  TRigidBodyComponent,
} from "@tedengine/ted";
import { vec3, quat } from "gl-matrix";
import config from "./config";
import boatTexture from "../assets/boat.png";
import pulleyTexture from "../assets/pulley.png";
import winchTexture from "../assets/wheel.png";
import { MagnetComponent } from "./magnet";

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

export class WheelComponent extends TComponent {}

export class BoatComponent extends TComponent {}

export class BoatRockingSystem extends TSystem {
  private boatQuery: TEntityQuery;
  private time: number = 0;

  constructor(world: TWorld) {
    super();
    this.boatQuery = world.createQuery([BoatComponent, TTransformComponent]);
  }

  public async update(_: TEngine, world: TWorld, delta: number): Promise<void> {
    this.time += delta;
    const boatEntities = this.boatQuery.execute();

    // Gentle rocking motion
    const rockingAngle = Math.sin(this.time * 0.8) * 0.03; // ~1.7 degrees max

    for (const entity of boatEntities) {
      const transform = world.getComponent(entity, TTransformComponent);
      if (!transform) continue;

      const rotationQuat = quat.create();
      quat.rotateZ(rotationQuat, rotationQuat, rockingAngle);
      transform.transform.rotation = rotationQuat;
    }
  }
}

export class WheelSystem extends TSystem {
  private wheelQuery: TEntityQuery;
  private magnetQuery: TEntityQuery;

  constructor(world: TWorld) {
    super();
    this.wheelQuery = world.createQuery([WheelComponent, TTransformComponent]);
    this.magnetQuery = world.createQuery([
      MagnetComponent,
      TRigidBodyComponent,
    ]);
  }

  public async update(_: TEngine, world: TWorld, delta: number): Promise<void> {
    const wheelEntities = this.wheelQuery.execute();
    const magnetEntities = this.magnetQuery.execute();

    if (wheelEntities.length === 0 || magnetEntities.length === 0) return;

    const wheelEntity = wheelEntities[0];
    const magnetEntity = magnetEntities[0];

    const wheelTransform = world.getComponent(wheelEntity, TTransformComponent);
    const magnetRigidBody = world.getComponent(
      magnetEntity,
      TRigidBodyComponent
    );

    if (!wheelTransform || !magnetRigidBody) return;

    const yVelocity = magnetRigidBody.physicsOptions.linearVelocity?.[1] || 0;

    const velocityThreshold = 10;
    if (Math.abs(yVelocity) < velocityThreshold) return;

    // Rotate the wheel based on velocity
    // Negative Y velocity (moving down) = clockwise rotation
    // Positive Y velocity (moving up) = counterclockwise rotation (reversed)
    const rotationSpeed = yVelocity * 0.05; // Scale factor to make rotation look good
    const rotationDelta = rotationSpeed * delta;

    const rotationQuat = quat.create();
    quat.rotateZ(
      rotationQuat,
      wheelTransform.transform.rotation,
      rotationDelta
    );
    wheelTransform.transform.rotation = rotationQuat;
  }
}

export function createBoat(engine: TEngine, world: TWorld) {
  const y = config.topLeftCorner.y - config.waterLevel + 10;

  world.addSystem(new BoatRockingSystem(world));
  world.addSystem(new WheelSystem(world));

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-400 + 170, y + 75, -65))
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
    new BoatComponent(),
  ]);

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-400 + 170, y + 75, -80))
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
    new BoatComponent(),
  ]);

  world.createEntity([
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(-224, y + 67, -70))
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
    new WheelComponent(),
  ]);
}
