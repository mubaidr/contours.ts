import polylineSimplification from 'simplify-js'
import { ImageDataLike } from './types/ImageDataLike'
import { Point, Polygon, ShapeCollection } from './types/ShapeType'
import { isCircle, isRectangle, isSquare } from './utilities'

/**
 * Moore neighborhood
 */
const clockwiseOffset: {
  [key: string]: {
    x: number
    y: number
  }
} = {
  '1,0': { x: 1, y: 1 }, // right --> right-down
  '1,1': { x: 0, y: 1 }, // right-down --> down
  '0,1': { x: -1, y: 1 }, // down --> down-left
  '-1,1': { x: -1, y: 0 }, // down-left --> left
  '-1,0': { x: -1, y: -1 }, // left --> left-top
  '-1,-1': { x: 0, y: -1 }, // left-top --> top
  '0,-1': { x: 1, y: -1 }, // top --> top-right
  '1,-1': { x: 1, y: 0 }, // top-right --> right
}

interface ContourFinderOptions {
  blur?: boolean
  threshold?: number
}

/**
 * Contour tracing on a black and white image
 */
export class ContourFinder {
  private data: Uint8ClampedArray | number[]
  private readonly width: number
  private readonly height: number
  private readonly channels: number

  public readonly contours: Polygon[] = []
  public readonly collection: ShapeCollection = {
    points: [],
    lines: [],
    triangles: [],
    squares: [],
    recangles: [],
    circles: [],
    polygons: [],
  }

  private isSimplified = false

  /**
   * Caches information about visited points
   */
  private visited: { [key: number]: boolean } = {}

  constructor(
    imageData: ImageDataLike,
    options: ContourFinderOptions = {
      blur: false,
      threshold: 85,
    }
  ) {
    this.data = imageData.data
    this.width = imageData.width
    this.height = imageData.height
    this.channels = this.data.length / (this.width * this.height)

    const blur = options.blur ?? false
    const threshold = options.threshold ?? 85

    // preprocess image if multi channel
    if (this.channels > 1) {
      // blurs the image for better edge detection
      if (blur) this.blur()

      // threshold image to get bit data
      this.toBitData(threshold)
    }

    // perform contour detection
    this.extract()
  }

  /**
   * Converts x,y to index postion of pixel
   * @param point
   */
  private pointToIndex(point: Point): number {
    return point.y * this.width + point.x
  }

  /**
   * Blurs the image
   */
  private blur(): void {
    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < this.height; y += 1) {
        const i = this.pointToIndex({
          x,
          y,
        })

        // average each channel of the pixel
        for (let c = 0; c < this.channels; c += 1) {
          const avg =
            Object.values(clockwiseOffset).reduce((prev, curr) => {
              prev +=
                this.data[
                  this.pointToIndex({
                    x: x + curr.x,
                    y: y + curr.y,
                  })
                ] + c

              return prev
            }, this.data[i + c]) / 9

          this.data[i + c] = avg
        }
      }
    }
  }

  /**
   * Threshold image data
   */
  private toBitData(threshold: number): void {
    const bitData: number[] = []

    // pixel average
    for (let i = 0; i < this.data.length; i += this.channels) {
      bitData.push(
        0.2126 * this.data[i] +
          0.7152 * this.data[i + 1] +
          0.0722 * this.data[i + 2] >=
          threshold
          ? 255
          : 0
      )
    }

    this.data = bitData
  }

  /**
   * Returns next clockwise pixel based on current position and direction
   * @param previous previous point
   * @param boundary current boundary point
   */
  nextClockwise({
    previous,
    boundary,
    start = previous,
  }: {
    previous: Point
    boundary: Point
    start?: Point
  }): {
    previous: Point
    boundary: Point
  } {
    const offset =
      clockwiseOffset[`${previous.x - boundary.x},${previous.y - boundary.y}`]

    // next point in moore's neighberhood
    const nextPoint = {
      x: boundary.x + offset.x,
      y: boundary.y + offset.y,
    }

    // handle invalid points for edge pixels
    if (
      nextPoint.x < 0 ||
      nextPoint.y < 0 ||
      nextPoint.x >= this.width ||
      nextPoint.y >= this.height
    ) {
      return this.nextClockwise({ previous: nextPoint, boundary, start })
    }

    // return if we have reached the start point of moore's neighberhood
    if (nextPoint.x === start.x && nextPoint.y === start.y) {
      return {
        previous: nextPoint,
        boundary,
      }
    }

    // if found boundary pixel
    if (this.data[this.pointToIndex(nextPoint)] === 0) {
      return {
        previous,
        boundary: nextPoint,
      }
    }

    return this.nextClockwise({ previous: nextPoint, boundary, start })
  }

  /*

    Input: A square tessellation, T, containing a connected component P of black cells.
    Output: A sequence B (b1, b2, ..., bk) of boundary pixels i.e. the contour.
    Define M(a) to be the Moore neighborhood of pixel a.
    Let p denote the current boundary pixel.
    Let c denote the current pixel under consideration i.e. c is in M(p).
    Let b denote the backtrack of c (i.e. neighbor pixel of p that was previously tested)

    Begin
      Set B to be empty.
      From bottom to top and left to right scan the cells of T until a black pixel, s, of P is found.
      Insert s in B.
      Set the current boundary point p to s i.e. p=s
      Let b = the pixel from which s was entered during the image scan.
      Set c to be the next clockwise pixel (from b) in M(p).
      While c not equal to s do
        If c is black
          insert c in B
          Let b = p
          Let p = c
          (backtrack: move the current pixel c to the pixel from which p was entered)
          Let c = next clockwise pixel (from b) in M(p).
        else
          (advance the current pixel c to the next clockwise pixel in M(p) and update backtrack)
          Let b = c
          Let c = next clockwise pixel (from b) in M(p).
        end If
      end While
    End

  */

  /**
   *
   * Moore-Neighbor tracing algorithm: https://en.wikipedia.org/wiki/Moore_neighborhood
   *
   * @param first first black pixel found
   * @param firstPrevious Previous pixel for first
   */
  private traceContour(first: Point): Polygon {
    const contour: Polygon = [{ ...first }]
    // the point we entered first from
    const firstPrevious = {
      x: first.x,
      y: first.y + 1,
    }
    // current known black pixel we're finding neighbours of
    let boundary = { ...first }
    // The point we entered current from
    let previous = {
      ...firstPrevious,
    }

    do {
      // find next boundary pixel in moore's neighberhood and previous pixel
      ;({ previous, boundary } = this.nextClockwise({
        previous,
        boundary,
      }))

      const index = this.pointToIndex(boundary)

      if (!this.visited[index]) {
        // add to list
        contour.push(boundary)
        // keep track of visited contour pixels
        this.visited[index] = true
      }
    } while (
      // Jacob's stopping criterion: current pixel is revisited from same direction
      previous.x !== firstPrevious.x ||
      previous.y !== firstPrevious.y ||
      boundary.x !== first.x ||
      boundary.y !== first.y
    )

    return contour
  }

  /**
   * Returns contour collection
   * @param imageData
   */
  private extract(): void {
    let skipping = false

    // find first black pixel from top-left to bottom-right
    for (let x = 0; x < this.width; x += 1) {
      for (let y = this.height - 1; y >= 0; y -= 1) {
        const index = this.pointToIndex({ x, y })

        // white pixel
        if (this.data[index] !== 0) {
          skipping = false
          continue
        }

        // we have already visited this pixel or we have traced this contour
        if (this.visited[index] || skipping) {
          skipping = true
          continue
        }

        // keep track of visited contour pixel
        this.visited[index] = true

        // we will trace contour starting from this black pixel
        this.contours.push(
          this.traceContour({
            x,
            y,
          })
        )
      }
    }
  }

  /**
   * Simplifies contours using Ramer–Douglas–Peucker algorithm
   */
  public simplify(epsilon = 1): ContourFinder {
    this.contours.forEach((contour, index) => {
      // insert first point to make it circular for proper simplification
      contour.push({
        ...contour[0],
      })

      this.contours[index] = polylineSimplification(contour, epsilon)

      // remove the dummy inserted point
      this.contours[index].pop()
    })

    this.isSimplified = true

    return this
  }

  /**
   * Approximate contours to shapes
   */
  public approximate(): ShapeCollection {
    if (!this.isSimplified) this.simplify()

    this.contours.forEach((contour) => {
      const { length } = contour

      if (length === 1) {
        this.collection.points.push(contour[0])
      } else if (length === 2) {
        this.collection.lines.push(contour)
      } else if (length === 3) {
        this.collection.triangles.push(contour)
      } else if (length === 4 && isRectangle(contour)) {
        if (isSquare(contour)) {
          this.collection.squares.push(contour)
        } else {
          this.collection.recangles.push(contour)
        }
      } else if (isCircle(contour)) {
        this.collection.circles.push(contour)
      } else {
        this.collection.polygons.push(contour)
      }
    })

    return this.collection
  }
}
