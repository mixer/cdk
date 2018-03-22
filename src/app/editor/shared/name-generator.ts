import { sample } from 'lodash';

const nouns = [
  'chicken',
  'walrus',
  'horse',
  'cat',
  'dog',
  'mouse',
  'hippo',
  'elephant',
  'potato',
  'giraffe',
  'cow',
  'pig',
  'deer',
  'rabbit',
  'dolphin',
  'hamster',
  'bear',
  'antelope',
  'squirrel',
  'frog',
];

const adjectives = [
  'adventurous',
  'quarrelsome',
  'exhausted',
  'excited',
  'fabulous',
  'nimble',
  'jazzy',
  'incredible',
  'heroic',
  'grateful',
  'hungry',
  'handsome',
  'exotic',
  'dramatic',
  'cute',
  'cosmic',
  'astonishing',
  'peaceful',
  'pretty',
  'royal',
  'unusual',
  'thankful',
];

const adverbs = [
  'unbearably',
  'amazingly',
  'elegantly',
  'tremendously',
  'really',
  'occasionally',
  'joyfully',
  'generally',
  'annually',
  'curiously',
  'somewhat',
  'perfectly',
  'wonderfully',
  'consistently',
  'faithfully',
  'very',
  'rarely',
  'mostly',
  'recently',
  'surprisingly',
  'ferociously',
  'optimistically',
];

/**
 * Creates a silly random project name.
 */
export function createRandomProjectName() {
  return `${sample(adverbs)}-${sample(adjectives)}-${sample(nouns)}`;
}
