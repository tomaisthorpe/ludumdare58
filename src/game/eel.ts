import {
  TRigidBodyComponent,
  TTransform,
  TTransformBundle,
  TTransformComponent,
  TVisibilityComponent,
  TWorld,
  TComponent,
  TSystem,
  TEntityQuery,
  TEngine,
  TResourcePackConfig,
  TOriginPoint,
  TSpriteComponent,
  TTexture,
  TTextureComponent,
  TTextureFilter,
  TAnimatedSpriteComponent,
  TSpriteLayer,
} from "@tedengine/ted";
import { vec3, quat, vec2 } from "gl-matrix";
import config from "./config";
import eelTexture from "../assets/eel.png";

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: eelTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
};

export class EelComponent extends TComponent {
  constructor(public speed: number) {
    super();
  }
}

export class EelSystem extends TSystem {
  private query: TEntityQuery;
  private spawnTimer: number = 0;

  constructor(private engine: TEngine, private world: TWorld) {
    super();
    this.query = this.world.createQuery([EelComponent, TTransformComponent]);
  }

  public async update(engine: TEngine, world: TWorld, delta: number) {
    // Update spawn timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= config.eel.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnEel();
    }

    // Update existing eels
    const entities = this.query.execute();
    for (const entity of entities) {
      const eel = world.getComponents(entity)?.get(EelComponent);
      const transform = world.getComponents(entity)?.get(TTransformComponent);

      if (!eel || !transform) continue;

      // Move the eel horizontally (left to right)
      const movement = vec3.fromValues(eel.speed * delta, 0, 0);
      vec3.add(
        transform.transform.translation,
        transform.transform.translation,
        movement
      );

      // Remove eel if it goes out of bounds (right edge)
      const x = transform.transform.translation[0];
      const rightBound = config.topLeftCorner.x + config.waterWidth + 100;

      if (x > rightBound) {
        world.removeEntity(entity);
      }
    }
  }

  private spawnEel() {
    const texture = this.engine.resources.get<TTexture>(eelTexture);
    if (!texture) return;

    // Spawn from left edge
    const x = config.topLeftCorner.x - 50;

    // Random depth below the configured minimum depth
    const depthRange = config.waterDepth - config.eel.minDepth;
    const depthBelowWater = config.eel.minDepth + Math.random() * depthRange;
    const y = config.topLeftCorner.y - config.waterLevel - depthBelowWater;

    const eel = this.world.createEntity();
    this.world.addComponents(eel, [
      TTransformBundle.with(
        new TTransformComponent(new TTransform(vec3.fromValues(x, y, -70)))
      ),
      new TSpriteComponent({
        width: config.eel.width,
        height: config.eel.height,
        origin: TOriginPoint.Center,
        layer: TSpriteLayer.Background_3,
      }),
      new TAnimatedSpriteComponent(config.eel.fps, config.eel.frameCount),
      new TTextureComponent(texture),
      new TVisibilityComponent(),
      new EelComponent(config.eel.speed),
    ]);
  }
}

export function createEelSystem(engine: TEngine, world: TWorld): EelSystem {
  const eelSystem = new EelSystem(engine, world);
  world.addSystem(eelSystem);
  return eelSystem;
}
