import { ContourFinder } from '../src'
import * as data from './data'

describe('ContourFinder', () => {
  test(' index to point converter', () => {
    const cf = new ContourFinder(data.dot)

    expect(cf.indexToPoint(0)).toEqual({
      x: 0,
      y: 0,
    })

    expect(cf.indexToPoint(4)).toEqual({
      x: 1,
      y: 1,
    })

    expect(cf.indexToPoint(8)).toEqual({
      x: 2,
      y: 2,
    })
  })

  test('point to index converter', () => {
    const cf = new ContourFinder(data.dot)

    expect(
      cf.pointToIndex({
        x: 0,
        y: 0,
      })
    ).toBe(0)

    expect(
      cf.pointToIndex({
        x: 1,
        y: 1,
      })
    ).toBe(4)

    expect(
      cf.pointToIndex({
        x: 2,
        y: 2,
      })
    ).toBe(8)
  })

  test('nextClockwise', () => {
    const cf = new ContourFinder(data.dot)

    expect(cf.nextClockwise(0, 1)).toBe(4)
    expect(cf.nextClockwise(1, 4)).toBe(3)
    expect(cf.nextClockwise(3, 4)).toBe(7)
    expect(cf.nextClockwise(5, 4)).toBe(1)
    expect(cf.nextClockwise(5, 8)).toBe(7)
    expect(cf.nextClockwise(6, 4)).toBe(7)
  })

  test('dot', () => {
    const found = new ContourFinder(data.dot).extract()

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      {
        x: 1,
        y: 1,
      },
    ])
  })

  test('square', () => {
    const found = new ContourFinder(data.square).extract()

    console.log(found)

    expect(found.length).toBe(1)
    expect(found[0]).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ])
  })

  test('multiple squares', () => {
    const found = new ContourFinder(data.squares).extract()

    expect(found.length).toBe(2)
    expect(found[0]).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ])
    expect(found[1]).toEqual([
      { x: 5, y: 2 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
      { x: 6, y: 2 },
    ])
  })

  test('edge squares', () => {
    const found = new ContourFinder(data.squares_edge).extract()

    console.log(found)

    expect(found.length).toBe(2)
    expect(found[0]).toEqual([0, 1, 6, 5])
    expect(found[1]).toEqual([8, 9, 14, 13])
  })

  test('connected', () => {
    const found = new ContourFinder(data.connected).extract()

    console.log(found)

    expect(found.length).toBe(1)
  })

  test('lots', () => {
    const found = new ContourFinder(data.stuff).extract()

    console.log(found)

    expect(found.length).toBe(5)
  })

  test('filled', () => {
    const found = new ContourFinder(data.large_square).extract()

    console.log(found)

    expect(found.length).toBe(1)
  })
})
