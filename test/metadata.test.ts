import { expect } from 'chai';

import { IInputDescriptor, InputKind } from '@mcph/miix-std/dist/internal';
import { EvilSniffer } from '../src/server/metadata/evilsniffer';
import { MetadataExtractor } from '../src/server/metadata/extractor';
import { readFile } from '../src/server/util';

describe('metadata', () => {
  describe('extractor', () => {
    const expectType = (expected: Partial<IInputDescriptor>, str: string) => {
      expect(new MetadataExtractor().parseString(str).gatherResult()).to.containSubset({
        controls: {
          button: {
            inputs: [expected],
          },
        },
      });
    };

    it('extracts a scene', () => {
      expect(
        new MetadataExtractor()
          .parseString(
            `
            @Scene({ id: 'foo', default: true })
            class MyScene {}
          `,
          )
          .gatherResult(),
      ).to.containSubset({
        scenes: {
          foo: { id: 'foo', default: true },
        },
      });
    });

    it('extracts a control', () => {
      expect(
        new MetadataExtractor()
          .parseString(
            `
            @Control({ kind: 'button' })
            class MyScene {}
          `,
          )
          .gatherResult(),
      ).to.containSubset({
        controls: {
          button: { kind: 'button' },
        },
      });
    });

    it('allows for namespaced decorators', () => {
      expect(
        new MetadataExtractor()
          .parseString(
            `
            @Mixer.Control({ kind: 'button' })
            class MyScene {}
          `,
          )
          .gatherResult(),
      ).to.containSubset({
        controls: {
          button: { kind: 'button' },
        },
      });
    });

    it('parses data kinds', () => {
      expect(
        new MetadataExtractor()
          .parseString(
            `
            @Mixer.Control({
              kind: 'button',
              level: 42,
              'quoted': [{ deeplyNested: true, isLame: false }],
              1: \`some numeric prop\`,
            })
            class MyScene {}
          `,
          )
          .gatherResult(),
      ).to.containSubset({
        controls: {
          button: {
            kind: 'button',
            level: 42,
            quoted: [{ deeplyNested: true, isLame: false }],
            1: 'some numeric prop',
          },
        },
      });
    });

    it('infers the basic types from inputs', () => {
      expectType(
        { kind: InputKind.Number, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: number;
        }`,
      );

      expectType(
        { kind: InputKind.String, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: string;
        }`,
      );

      expectType(
        { kind: InputKind.Boolean, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: boolean;
        }`,
      );

      expectType(
        { kind: InputKind.Dimensions, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: IDimensions;
        }`,
      );

      expectType(
        { kind: InputKind.Dimensions, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: Mixer.IDimensions;
        }`,
      );
    });

    it('explcitly defines input types', () => {
      expectType(
        { kind: InputKind.Color, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: InputKind.Color })
          public foo: number;
        }`,
      );

      expectType(
        { kind: InputKind.Color, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: Mixer.InputKind.Color })
          public foo: number;
        }`,
      );

      expectType(
        { kind: InputKind.Color, alias: 'foo', propertyName: 'foo' },
        `@Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: 'Color' })
          public foo: number;
        }`,
      );
    });

    it('parses default values', () => {
      const str = `
        @Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: InputKind.Color })
          public foo: string = '#fff';
        }
      `;

      expect(new MetadataExtractor().parseString(str).gatherResult()).to.containSubset({
        controls: {
          button: {
            inputs: [
              {
                alias: 'foo',
                propertyName: 'foo',
                kind: InputKind.Color,
                defaultValue: '#fff',
              },
            ],
          },
        },
      });
    });

    describe('invalid cases', () => {
      it('errors on shorthand props', () => {
        expect(() => {
          new MetadataExtractor().parseString(`
            @Control({ kind })
            class MyScene {}
          `);
        }).to.throw(/Only "key": "value" assignments are allowed in @Control/);
      });

      it('errors on wrong input enum', () => {
        expect(() => {
          new MetadataExtractor().parseString(`
            @Control({ kind: 'button' })
            class MyScene {
              @Input({ kind: InputWut.Color })
              public foo: number;
            }
          `);
        }).to.throw(/Expected to be a lookup on InputKind/);
      });

      it('errors on bad input enum property', () => {
        expect(() => {
          new MetadataExtractor().parseString(`
            @Control({ kind: 'button' })
            class MyScene {
              @Input({ kind: InputKind.Wut })
              public foo: number;
            }
          `);
        }).to.throw(/Invalid InputKind value/);
      });

      it('errors on bad input enum string property', () => {
        expect(() => {
          new MetadataExtractor().parseString(`
            @Control({ kind: 'button' })
            class MyScene {
              @Input({ kind: InputKind.Wut })
              public foo: number;
            }
          `);
        }).to.throw(/Invalid InputKind value/);
      });

      it('errors on complex types', () => {
        expect(() => {
          new MetadataExtractor().parseString(`
            @Control({ kind: someFunc() })
            class MyScene {}
          `);
        }).to.throw(/Only simple, JSON-compatible expressions are allowed here in @Control/);

        expect(() => {
          new MetadataExtractor().parseString(`
            @Control({ kind: class {} })
            class MyScene {}
          `);
        }).to.throw(/Only simple, JSON-compatible expressions are allowed here in @Control/);
      });
    });
  });

  describe('evil sniffer', () => {
    const expectFail = (str: string) => {
      expect(() => new EvilSniffer().parseString(str)).to.throw(
        /Executing arbitrary code is dangerous/,
      );
    };
    const expectOK = (str: string) => {
      expect(() => new EvilSniffer().parseString(str)).not.to.throw;
    };

    it('detects eval', () => {
      expectFail('eval()');
      expectFail('window.eval()');
    });

    it('detects new func', () => {
      expectFail('new Function()');
      expectFail('new window.Function()');
    });

    it('detect setTimeout/setInterval with strings', () => {
      expectFail('setInterval("foo()")');
      expectFail('window.setInterval("foo()")');
      expectFail('setTimeout("foo()")');
      expectFail('window.setTimeout("foo()")');

      expectFail('setTimeout(`foo()`)');
      expectFail('setTimeout(`f${o}o()`)'); // tslint:disable-line
    });

    it('allows good code/setTimeouts', async () => {
      expectOK('setTimeout(() => foo())');
      expectOK('setTimeout(foo)');
      expectOK(await readFile(__filename)); // *universe explodes*
    });
  });
});
