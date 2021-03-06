import { ContourFinder } from '../../src'
import * as data from '../data'

describe('shapes', () => {
  test('dot', () => {
    const found = new ContourFinder(data.dot).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      {
        x: 1,
        y: 1,
      },
    ])
  })

  test('square', () => {
    const found = new ContourFinder(data.square).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ])
  })

  test('trapezoid', () => {
    const found = new ContourFinder(data.trapezoid).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
    ])
  })

  test('reversedTrapezoid', () => {
    const found = new ContourFinder(data.reversedTrapezoid).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
    ])
  })

  test('onlySquare', () => {
    const found = new ContourFinder(data.onlySquare).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ])
  })

  test('multipleSquares', () => {
    const found = new ContourFinder(data.multipleSquares).contours

    expect(found.length).toBe(2)
    expect(found[0]).toEqual([
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ])
    expect(found[1]).toEqual([
      { x: 5, y: 3 },
      { x: 5, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 3 },
    ])
  })

  test('edgeSquares', () => {
    const found = new ContourFinder(data.edgeSquares).contours

    expect(found.length).toBe(2)
    expect(found[0]).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ])
    expect(found[1]).toEqual([
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
    ])
  })

  test('connected', () => {
    const found = new ContourFinder(data.connected).contours

    expect(found.length).toBe(1)
  })

  test('largeSquare', () => {
    const found = new ContourFinder(data.largeSquare).contours

    expect(found.length).toBe(1)
  })

  test('tri', () => {
    const found = new ContourFinder(data.tri).contours

    expect(found.length).toBe(1)
  })

  test('stuff', () => {
    const found = new ContourFinder(data.stuff).contours

    expect(found.length).toBe(5)
  })
})

describe('Mulitchannel', () => {
  test('pre-process: extract from 3-channel image', () => {
    const found = new ContourFinder(data.dot3Channel).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      {
        x: 1,
        y: 1,
      },
    ])
  })

  test('pre-process: extract from 4-channel image', () => {
    const found = new ContourFinder(data.dot4Channel).contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      {
        x: 1,
        y: 1,
      },
    ])
  })
})

describe('simplify', () => {
  test('extract and simplify dot', () => {
    const found = new ContourFinder(data.dot).simplify().contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      {
        x: 1,
        y: 1,
      },
    ])
  })

  test('extract and simplify line', () => {
    const found = new ContourFinder(data.line).simplify().contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      {
        x: 0,
        y: 0,
      },
      {
        x: 2,
        y: 2,
      },
    ])
  })
})

describe('preprocess: blur', () => {
  test('extract and simplify triangle 4 channel', () => {
    const found = new ContourFinder(data.tri4Channel, {
      blur: true,
    }).simplify().contours

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      { x: 0, y: 3 },
      { x: 1, y: 0 },
      { x: 13, y: 0 },
      { x: 13, y: 2 },
      { x: 5, y: 3 },
      { x: 9, y: 8 },
      { x: 3, y: 8 },
    ])
  })
})

describe('Approximation', () => {
  test.only('should approximate to point', () => {
    const found = new ContourFinder(data.dot).approximate()

    expect(found.points.length).toBe(1)
  })

  test.only('should approximate to line', () => {
    const found = new ContourFinder(data.line).approximate()

    expect(found.lines.length).toBe(1)
  })

  test.only('should approximate to rectangle', () => {
    const found = new ContourFinder(data.largeSquare).approximate()

    expect(found.recangles.length).toBe(1)
  })

  // test('should approximate to triangle', () => {
  //   const found = new ContourFinder(data.tri).approximate()

  //   expect(found.triangles.length).toBe(1)
  // })

  // test('should approximate to circles', () => {
  //   const found = new ContourFinder(data.circle).approximate()

  //   console.log(found)

  //   expect(found.circles.length).toBe(1)
  // })

  test.only('should approximate to polygons', () => {
    const found = new ContourFinder(data.stuff).simplify(0.5).approximate()

    expect(found.squares.length).toBe(1)
    expect(found.polygons.length).toBe(2)
    expect(found.recangles.length).toBe(2)
  })
})
