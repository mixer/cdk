/**
 * Dimensions exist on every Interactive control and define its display.
 */
export interface IDimensions {
  /**
   * x position (percent from 0 to 100)
   */
  x: number;

  /**
   * y position (percent from 0 to 100)
   */
  y: number;

  /**
   * control width (percent from 0 to 100)
   */
  width: number;

  /**
   * control height (percent from 0 to 100)
   */
  height: number;
}

/**
 * IControlOptions are passed to the @Control decorator to describe how
 * the control is rendered.
 */
export interface IControlOptions {
  /**
   * The kind of the control that this class should render. The default
   * kinds are "button" and "joystick".
   */
  kind: string;

  /**
   * `dimensions` can be passed into inputs for the control dimensions
   * (IDimensions) to define bounds for how it can be manipulated in the
   * Interactive editor.
   *  - `aspectRatio` locks a control's aspect ratio (width / height)
   *  - `width` locks with width percentage
   *  - `height` locks the height percentage
   */
  dimensions?: (
    | { property: 'aspectRatio'; minimum: number; maximum: number }
    | { property: 'width'; minimum?: number; maximum?: number }
    | { property: 'height'; minimum?: number; maximum?: number })[];

  /**
   * Control inputs. Note: this will be filled in automatically for you
   * if you use the @Input decorator, but this may come in handy if you
   * don't want to or can't use them in your environment.
   */
  inputs?: { [property: string]: IInputOptions };
}

/**
 * ISceneOptions can be passed into the @Scene decorator.
 */
export interface ISceneOptions {
  /**
   * Whether to use this scene as the handler for all scenes.
   *
   * You can override scenes by their `id` to use a different scene for a
   * certain sceneID. In cases where there isn't a specific class for a
   * sceneID, the default will be used.
   *
   * ```
   * @Scene({ default: true })
   * class MyAwesomeScene {
   *   // ...
   * }
   * ```
   */
  default?: true;

  /**
   * When specified, registers this class to handle a specific scene ID.
   * For instance, if you wanted the scene IOD `lobby` and `arena` to be
   * implemented with two different classes, you could do that with
   * something like the following:
   *
   * ```
   * @Scene({ id: 'lobby' })
   * class Lobbby {
   *   // ...
   * }
   *
   * @Scene({ id: 'arena' })
   * class Arena {
   *   // ...
   * }
   * ```
   */
  id?: string;

  /**
   * Scene inputs. Note: this will be filled in automatically for you
   * if you use the @Input decorator, but this may come in handy if you
   * don't want to or can't use them in your environment.
   */
  inputs?: { [property: string]: IInputOptions };
}

/**
 * InputKinds are passed into the @Input() decorator to define what data
 * type the inputs takes. If you're using TypeScript and you define the
 * types of your properties, we can automatically infer some of these
 * except for the ones marked "not inferrable".
 *
 * For example:
 *
 * ```
 * @Control({ name: 'button' })
 * class Button {
 *   @Input()
 *   public dimensions: Mixer.IDimensions;
 *
 *   @Input({ kind: Mixer.InputKind.Color })
 *   public background: string;
 * }
 * ```
 */
export enum InputKind {
  Dimensions, // IDimensions type
  Number, // `number`
  String, // `string`
  Boolean, // `boolean`
  Color, // string, hex code in the format "#123456"           (not inferrable)
  Duration, // number, duration give in milliseconds           (not inferrable)
  Url, // string, fully qualified with the http prefix         (not inferrable)
}

/**
 * IInputOptions are passed into the @Input decorator.
 */
export interface IInputOptions {
  /**
   * Alias of the property as sent to the Interactive game client and sent
   * on the wire. Defaults to the property's name.
   */
  alias?: string;

  /**
   * Human-readable name of the input as displayed on the interactive
   * editor. Defaults to the property's name.
   */
  displayName?: string;

  /**
   * The type of data this input takes. See the InputKind enum for more
   * information and a description. If you are not using TypeScript, this
   * MUST be defined!
   */
  kind?: InputKind;
}

const sceneMetaKey = '__mix_scene';
const controlMetaKey = '__miix_control';
const inputsMetaKey = '__miix_input';

/**
 * ISceneDescriptor is returned from the Registry's .getScene(). This contains
 * the scene options along with its constructor.
 */
export interface ISceneDescriptor extends ISceneOptions {
  ctor: Function;
}

/**
 * IControlDescriptor is returned from the Registry's .getControl(). This contains
 * the Control options along with its constructor.
 */
export interface IControlDescriptor extends IControlOptions {
  ctor: Function;
}

/**
 * IInputDescriptors are returned from the Registry's .getInputs(). This
 * contains the inputs options along with its constructor.
 */
export interface IInputDescriptor extends IInputOptions {
  propertyName: string;
}

/**
 * The Registry is a simple class that maintains a list of available
 * controls and scenes, and can return them given control kinds or scene IDs.
 */
export class Registry {
  private defaultScene: ISceneDescriptor;
  private scenes: { [id: string]: ISceneDescriptor } = Object.create(null);
  private controls: { [id: string]: IControlDescriptor } = Object.create(null);

  /**
   * Adds a collection of controls and scenes to the registry. This will throw
   * if anything given is not a scene or control.
   */
  public register(...things: any[]): this {
    things.forEach(thing => {
      if (thing[sceneMetaKey]) {
        this.registerScene(thing, thing[sceneMetaKey]);
      } else if (thing[controlMetaKey]) {
        this.registerControl(thing, thing[controlMetaKey]);
      } else {
        throw new Error(
          `Passed ${thing.name} to the miix registry, but it wasn't decorated with ` +
            '@Control or @Scene!',
        );
      }
    });

    return this;
  }

  /**
   * Returns the Control descriptor for a control of the given kind, or
   * undefined if it's not found.
   */
  public getControl(kind: string): Readonly<IControlDescriptor> | undefined {
    return this.controls[kind];
  }

  /**
   * Returns the Scene descriptor for the given scene ID, returning the
   * default scene if a specific handler wasn't found.
   */
  public getScene(id: string): Readonly<ISceneDescriptor> {
    return this.scenes[id] || this.defaultScene;
  }

  /**
   * Returns inputs defined on the given control instance.
   */
  public getInputs(control: any): ReadonlyArray<Readonly<IInputDescriptor>> {
    return control[inputsMetaKey] || [];
  }

  private registerScene(scene: Function, options: ISceneOptions) {
    const existing = options.id && this.scenes[options.id];
    if (existing) {
      throw new Error(
        `Duplicate scene IDs registered! Both ${existing.ctor.name} and ` +
          `${scene.name} registered themselves for scene ID ${options.id}`,
      );
    }

    const descriptor: ISceneDescriptor = { ...options, ctor: scene };
    this.scenes[options.id || 'default'] = descriptor;
    if (options.default) {
      this.defaultScene = descriptor;
    }
  }

  private registerControl(control: Function, options: IControlOptions) {
    const existing = options.kind && this.controls[options.kind];
    if (existing) {
      throw new Error(
        `Duplicate controls registered! Both ${existing.ctor.name} and ` +
          `${control.name} registered themselves for control kind ${options.kind}`,
      );
    }

    this.controls[options.kind] = { ...options, ctor: control };
  }
}

/**
 * Scene is a decorator you can use to designate a class as a Scene. See
 * documentation on {@link ISceneOptions} for more info.
 */
export function Scene(options: ISceneOptions = { default: true }) {
  return (ctor: Function) => {
    Object.defineProperty(ctor, sceneMetaKey, { value: options });
  };
}

/**
 * Scene is a decorator you can use to designate a class as a Scene. See
 * documentation on {@link IControlOptions} for more info.
 */
export function Control(options: IControlOptions) {
  return (ctor: Function) => {
    Object.defineProperty(ctor, controlMetaKey, { value: options });
  };
}
/**
 * @Input decorates a property on a control. It makes it configurable in the
 * Interactive studio and settable for Preact components. See the
 * {@link IInputOptions} for more info.
 */
export function Input(_options: IInputOptions = {}) {
  return (_host: object, _propertyName: string): void => {
    // noop, this is entirely compile-time / statically analyzed
  };
}
