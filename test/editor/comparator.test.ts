import { expect } from 'chai';
import { IScene } from '../../src/stdlib/typings';
import { ControlsSource } from '../../src/webpack/editor/frame/sources/controls';

const emptyFixture: IScene[] = [];
const simpleFixture = [
  {
    sceneID: 'scene1',
    controls: [
      {
        controlID: 'control1',
        kind: 'button',
        disabled: false,
      },
    ],
  },
];
const fixtureWithNoControls = [
  {
    sceneID: 'scene1',
    controls: [],
  },
];
const fixtureWithTopCustomProp = [
  {
    ...simpleFixture[0],
    foo: 'bar',
  },
];
const fixtureWithModifiedTopCustomProp = [
  {
    ...simpleFixture[0],
    foo: 'baz',
  },
];
const fixtureWithNestedCustomProp = [
  {
    ...simpleFixture[0],
    controls: [
      {
        ...simpleFixture[0].controls[0],
        foo: 'bar',
      },
    ],
  },
];

describe('ResourceComparator', () => {
  let src: ControlsSource;

  beforeEach(() => {
    src = new ControlsSource();
  });

  it('is a noop without changes', () => {
    expect(src.compare(simpleFixture, simpleFixture)).to.be.empty;
    expect(src.compare(emptyFixture, emptyFixture)).to.be.empty;
  });

  it('adds property to a top level object', () => {
    expect(src.compare(simpleFixture, fixtureWithTopCustomProp)).to.deep.equal([
      {
        method: 'onSceneUpdate',
        params: { scenes: [{ sceneID: 'scene1', foo: 'bar' }] },
      },
    ]);
  });

  it('adds property to a nested object', () => {
    expect(src.compare(simpleFixture, fixtureWithNestedCustomProp)).to.deep.equal([
      {
        method: 'onControlUpdate',
        params: {
          sceneID: 'scene1',
          controls: fixtureWithNestedCustomProp[0].controls,
        },
      },
    ]);
  });

  it('modifies an object property', () => {
    expect(src.compare(fixtureWithModifiedTopCustomProp, fixtureWithTopCustomProp)).to.deep.equal([
      {
        method: 'onSceneUpdate',
        params: { scenes: [{ sceneID: 'scene1', foo: 'bar' }] },
      },
    ]);
  });

  it('destroys deep resources', () => {
    expect(src.compare(simpleFixture, fixtureWithNoControls)).to.deep.equal([
      {
        method: 'onControlDelete',
        params: { sceneID: 'scene1', controls: [{ controlID: 'control1' }] },
      },
    ]);
  });

  it('adds deep resources', () => {
    expect(src.compare(fixtureWithNoControls, simpleFixture)).to.deep.equal([
      {
        method: 'onControlCreate',
        params: { sceneID: 'scene1', controls: simpleFixture[0].controls },
      },
    ]);
  });

  it('destroys top level resources', () => {
    expect(src.compare(simpleFixture, emptyFixture)).to.deep.equal([
      {
        method: 'onSceneDelete',
        params: { sceneID: 'scene1', reassignSceneID: 'default' },
      },
    ]);
  });

  it('adds top level resources', () => {
    expect(src.compare(emptyFixture, simpleFixture)).to.deep.equal([
      {
        method: 'onSceneCreate',
        params: { scenes: [simpleFixture[0]] },
      },
    ]);
  });
});
