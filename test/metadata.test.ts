import { expect } from 'chai';

import { InputKind } from '@mcph/miix-std/dist/internal';
import { MetadataExtractor } from '../src/metadata/extractor';

describe('metadata', () => {
  describe('extractor', () => {
    const expectType = (kind: InputKind, str: string) => {
      expect(new MetadataExtractor().parseString(str)).to.containSubset({
        controls: {
          button: {
            inputs: {
              foo: { kind },
            },
          },
        },
      });
    };

    it('extracts a scene', () => {
      expect(
        new MetadataExtractor().parseString(`
          @Scene({ id: 'foo', default: true })
          class MyScene {}
        `),
      ).to.containSubset({
        scenes: {
          foo: { id: 'foo', default: true },
        },
      });
    });

    it('extracts a control', () => {
      expect(
        new MetadataExtractor().parseString(`
          @Control({ kind: 'button' })
          class MyScene {}
        `),
      ).to.containSubset({
        controls: {
          button: { kind: 'button' },
        },
      });
    });

    it('allows for namespaced decorators', () => {
      expect(
        new MetadataExtractor().parseString(`
          @Mixer.Control({ kind: 'button' })
          class MyScene {}
        `),
      ).to.containSubset({
        controls: {
          button: { kind: 'button' },
        },
      });
    });

    it('parses data kinds', () => {
      expect(
        new MetadataExtractor().parseString(`
          @Mixer.Control({
            kind: 'button',
            'quoted': [{ deeplyNested: true, isLame: false }],
            1: \`some numeric prop\`,
          })
          class MyScene {}
        `),
      ).to.containSubset({
        controls: {
          button: {
            kind: 'button',
            quoted: [{ deeplyNested: true, isLame: false }],
            1: 'some numeric prop',
          },
        },
      });
    });

    it('infers the basic types from inputs', () => {
      expectType(
        InputKind.Number,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: number;
        }
      `,
      );

      expectType(
        InputKind.String,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: string;
        }
      `,
      );

      expectType(
        InputKind.Boolean,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: boolean;
        }
      `,
      );

      expectType(
        InputKind.Dimensions,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: IDimensions;
        }
      `,
      );

      expectType(
        InputKind.Dimensions,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input()
          public foo: Mixer.IDimensions;
        }
      `,
      );
    });

    it('explcitly defines input types', () => {
      expectType(
        InputKind.Color,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: InputKind.Color })
          public foo: number;
        }
      `,
      );

      expectType(
        InputKind.Color,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: Mixer.InputKind.Color })
          public foo: number;
        }
      `,
      );

      expectType(
        InputKind.Color,
        `
        @Control({ kind: 'button' })
        class MyScene {
          @Input({ kind: 'Color' })
          public foo: number;
        }
      `,
      );
    });

    describe('invalid cases', () => {
      it('errors on shorthand props', () => {
        expect(() =>
          new MetadataExtractor().parseString(`
          @Control({ kind })
          class MyScene {}
        `),
        ).to.throw(/Only "key": "value" assignments are allowed in @Control/);
      });

      it('errors on wrong input enum', () => {
        expect(() =>
          new MetadataExtractor().parseString(`
            @Control({ kind: 'button' })
            class MyScene {
              @Input({ kind: InputWut.Color })
              public foo: number;
            }
        `),
        ).to.throw(/Expected to be a lookup on InputKind/);
      });

      it('errors on bad input enum property', () => {
        expect(() =>
          new MetadataExtractor().parseString(`
            @Control({ kind: 'button' })
            class MyScene {
              @Input({ kind: InputKind.Wut })
              public foo: number;
            }
        `),
        ).to.throw(/Invalid InputKind value/);
      });

      it('errors on bad input enum string property', () => {
        expect(() =>
          new MetadataExtractor().parseString(`
            @Control({ kind: 'button' })
            class MyScene {
              @Input({ kind: InputKind.Wut })
              public foo: number;
            }
        `),
        ).to.throw(/Invalid InputKind value/);
      });

      it('errors on complex types', () => {
        expect(() =>
          new MetadataExtractor().parseString(`
          @Control({ kind: someFunc() })
          class MyScene {}
        `),
        ).to.throw(/Only simple, JSON-compatible expressions are allowed here in @Control/);

        expect(() =>
          new MetadataExtractor().parseString(`
          @Control({ kind: class {} })
          class MyScene {}
        `),
        ).to.throw(/Only simple, JSON-compatible expressions are allowed here in @Control/);
      });
    });
  });
});
