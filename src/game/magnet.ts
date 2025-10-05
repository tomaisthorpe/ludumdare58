import {
  TWorld,
  TTransformBundle,
  TTransformComponent,
  TTransform,
  TVisibilityComponent,
  TRigidBodyComponent,
  createBoxCollider,
  TPlayerInputComponent,
  TFixedAxisCameraTargetComponent,
  TSystem,
  TEntityQuery,
  TComponent,
  TEngine,
  TResourcePackConfig,
  TTextureFilter,
  TTextureComponent,
  TTexture,
  TOriginPoint,
  TSpriteComponent,
  TSpriteLayer,
} from "@tedengine/ted";
import { vec3 } from "gl-matrix";
import config from "./config";
import { PlayerMovementComponent } from "./player-movement";
import magnetTexture from "../assets/magnet.png";

const startY = config.topLeftCorner.y - config.waterLevel + 30;
const underwaterStartY = config.topLeftCorner.y - config.waterLevel - 20;

export const resources: TResourcePackConfig = {
  textures: [
    {
      url: magnetTexture,
      config: {
        filter: TTextureFilter.Nearest,
      },
    },
  ],
};

export function createMagnet(engine: TEngine, world: TWorld) {
  world.addSystem(new MagnetSystem(world));

  const magnet = world.createEntity();
  const magnetBody = new TRigidBodyComponent(
    {
      mass: 1,
      linearDamping: 0.9,
      angularDamping: 0.3,
    },
    createBoxCollider(10, 10, 10)
  );

  const magnetComponent = new MagnetComponent();

  world.addComponents(magnet, [
    TTransformBundle.with(
      new TTransformComponent(
        new TTransform(vec3.fromValues(config.topLeftCorner.x + 331, startY, 0))
      )
    ),
    new TSpriteComponent({
      width: 10,
      height: 10,
      origin: TOriginPoint.Center,
      layer: TSpriteLayer.Foreground_4,
    }),
    new TTextureComponent(engine.resources.get<TTexture>(magnetTexture)!),
    new TVisibilityComponent(),
    magnetBody,
    new TPlayerInputComponent(),
    new PlayerMovementComponent(),
    new TFixedAxisCameraTargetComponent(),
    magnetComponent,
  ]);

  const dropMagnet = () => {
    const opt = magnetBody.physicsOptions;
    opt.isTrigger = true;
    magnetBody.physicsOptions = opt;
    magnetComponent.ropeLength = magnetComponent.playerRopeLength;
  };

  const resetMagnet = () => {
    magnetComponent.shouldReset = true;
  };

  const changeRopeLength = (length: number) => {
    magnetComponent.playerRopeLength = length;
  };

  return {
    dropMagnet,
    resetMagnet,
    changeRopeLength,
  };
}
export class MagnetComponent extends TComponent {
  public ropeLength = 0;
  public playerRopeLength = config.equipment.ropeLengths[0];
  public shouldReset = false;

  constructor() {
    super();
  }
}

export class MagnetSystem extends TSystem {
  private query: TEntityQuery;

  constructor(world: TWorld) {
    super();
    this.query = world.createQuery([MagnetComponent]);
  }

  public async update(_: TEngine, world: TWorld): Promise<void> {
    const entities = this.query.execute();

    for (const entity of entities) {
      const magnet = world.getComponent(entity, MagnetComponent);
      if (!magnet) continue;

      const transform = world.getComponent(entity, TTransformComponent);
      if (!transform) continue;

      if (magnet.shouldReset) {
        transform.transform.translation[0] = config.topLeftCorner.x + 300;
        transform.transform.translation[1] = startY;
        world.updateTransform(entity, transform.transform);
        magnet.shouldReset = false;
        magnet.ropeLength = 0;

        world.updateBodyOptions(entity, {
          linearVelocity: vec3.fromValues(0, 0, 0),
          angularVelocity: vec3.fromValues(0, 0, 0),
        });
      }

      // Ensure magnet doesn't go further than rope length
      const ropeLength = magnet.ropeLength;
      if (startY - transform.transform.translation[1] > ropeLength) {
        transform.transform.translation[1] = startY - ropeLength;
        world.updateTransform(entity, transform.transform);
      }

      // If magnet is set as a trigger and is underwater, then it should be removed
      if (transform.transform.translation[1] < underwaterStartY) {
        const rb = world.getComponent(entity, TRigidBodyComponent);
        if (!rb || !rb.physicsOptions.isTrigger) continue;

        const opt = rb.physicsOptions;
        opt.isTrigger = false;
        rb.physicsOptions = opt;
      }
    }
  }
}
