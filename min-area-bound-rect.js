/**
 * OMABR
 * Oriented Minimum Area Bounding Rectangle
 * Input: A convex polygon with number of vertices > 2.
 * Output:
 *   Area -> Area of the final rectangle
 *   Center -> Center of the final rectangle
 *   WidthDirection -> Vector from center parallel to shorter side
 *                     that reaches the longer side.
 *   HeightDirection -> Vector from center parallel to longer side
 *                      that reaches the shorter side.
 * Polygon -> [Point], does not repeat its first point.
 * Point -> [Number, Number]
 */

/**
 * Get direction change from vector PQ to vector QR.
 * @param {Point} p
 * @param {Point} q
 * @param {Point} r
 * @returns {Number} angle -- Angle in radian from range [0, pi).
 */
function getTurn(p, q, r) {
  var angle = Math.atan2(r[1]-q[1], r[0]-q[0]) -
              Math.atan2(q[1]-p[1], q[0]-p[0]);
  if(angle < 0) angle += 2*Math.PI;
  return angle;
}

/**
 * Given an array of points, it will find all direction changes.
 * @param {[Point]} arr
 * @returns {[Number]} res
 */
function getDirectionChanges(arr) {
  var res = [];
  var n = arr.length;
  arr[n] = arr[0]; arr[n+1] = arr[1];
  for(var i = 0; i < n; ++i) {
    res[i] = getTurn(arr[i], arr[i+1], arr[i+2]);
  }
  return res;
}

/**
 * Get projection of point A to line PQ.
 * Inspired by: https://stackoverflow.com/questions/849211/
 *     shortest-distance-between-a-point-and-a-line-segment
 *     Answer by Joshua
 * Assumption: p and q are different.
 * @param {Point} p
 * @param {Point} q
 * @param {Point} a
 * @returns {Point} res -- the projection point.
 */
function getProjection(p, q, a) {
  var xap = a[0] - p[0];
  var yap = a[1] - p[1];
  var xqp = q[0] - p[0];
  var yqp = q[1] - p[1];
  var dot = xap * xqp + yap * yqp;
  var dist = xqp * xqp + yqp * yqp;
  var res = [];
  res[0] = p[0] + (xqp * dot) / dist;
  res[1] = p[1] + (yqp * dot) / dist;
  return res;
}

/**
 * Get midpoint of two points P and Q.
 * @param {Point} p
 * @param {Point} q
 * @returns {Point}
 */
function getMidpoint(p, q) {
  return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
}

/**
 * Calculate the properties of the bounding rectangle.
 * @param {Point} p1a -- one of the vertex of the base
 * @param {Point} p1b -- one of the vertex of the base
 * @param {Point} p2 -- vertex on the right side.
 * @param {Point} p3 -- vertex on the top side.
 * @param {Point} p4 -- vertex on the left side.
 * @returns {[area, center, widthDirection, heightDirection]}
 */
function getProperties(p1a, p1b, p2, p3, p4) {
  var q2 = getProjection(p1a, p1b, p2);
  var q3 = getProjection(p1a, p1b, p3);
  var q4 = getProjection(p1a, p1b, p4);
  var mid1 = getMidpoint(q2, q4);
  var mid2 = getMidpoint(p3, q3);
  var side1 = Math.hypot(q2[1] - q4[1], q2[0] - q4[0]);
  var side2 = Math.hypot(p3[1] - q3[1], p3[0] - q3[0]);
  var area = side1 * side2;
  var center = []
  center[0] = mid1[0] + mid2[0] - q3[0];
  center[1] = mid1[1] + mid2[1] - q3[1];
  var dir1 = [];
  dir1[0] = mid1[0] - q2[0];
  dir1[1] = mid1[1] - q2[1];
  var dir2 = [];
  dir2[0] = mid2[0] - p3[0];
  dir2[1] = mid2[1] - p3[1];
  var widthD, heightD;
  // ensure height is always not less than width (qua-kit)
  if(side1 < side2) {
    widthD = dir1;
    heightD = dir2;
  } else {
    widthD = dir2;
    heightD = dir1;
  }
  // ensure heightDirection is pi/2 CCW of widthDirection
  if((Math.atan2(heightD[1], heightD[0]) -
      Math.atan2(widthD[1], widthD[0])) < 0) {
    heightD[0] = -heightD[0];
    heightD[1] = -heightD[1];
  }
  return [area, center, widthD, heightD];
}

/**
 * Calculate the minimum area bounding rectangle.
 * @param {Polygon} arr -- convex polygon with vertices > 2
 * @returns {[area, center, widthDirection, heightDirection]}
 */
function getMinAreaBoundRect(arr) {
  var n = arr.length;
  if(n === 0) {
    return [0, [0, 0], [0, 0], [0, 0]];
  }
  if(n == 1) {
    return [0, arr[0], [0, 0], [0, 0]];
  }
  if(n == 2) {
    // line segment
    p1 = arr[0];
    p2 = arr[1];
    var center = getMidpoint(p1, p2);
    var heightD = [p2[0] - center[0], p2[1] - center[1]];
    return [0, center, [0, 0], heightD];
  }
  // duplicate array
  arr = arr.concat(arr);
  var turns = getDirectionChanges(arr);
  // create prefix sum array for turns.
  var cum = [];
  cum[0] = 0;
  for(var i = 1; i < 2*n; ++i) {
    cum[i] = cum[i-1] + turns[i-1];
  }
  // prepare variable for finding the result
  var area = Number.MAX_VALUE;
  var info; // prop of the current result
  var prop;
  var r1, r2, r3, r4;
  // explore all possible bounding rectangle by rotation
  var p1 = 0, p2 = 0, p3 = 0, p4 = 0;
  for(; p1 < n; ++p1) {
    // move the pointers
    while(cum[p2] < cum[p1] + Math.PI/2) p2++;
    while(cum[p3] < cum[p1] + Math.PI) p3++;
    while(cum[p4] < cum[p1] + 3*Math.PI/2) p4++;
    prop = getProperties(arr[p1], arr[p1+1], 
                         arr[p2], arr[p3], arr[p4]);
    if(prop[0] < area) {
      area = prop[0];
      info = prop;
      r1 = p1;
      r2 = p2;
      r3 = p3;
      r4 = p4;
    }
  }
  return info;
}