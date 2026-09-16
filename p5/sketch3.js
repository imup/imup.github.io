let _bgWidth;
let _minWidth;

function setup(){
  createCanvas(windowWidth, windowHeight, WEBGL);
  setAttributes("alpha", false);
  _bgWidth = min(width, height);
  _minWidth = _bgWidth * 0.95
  colorMode(HSB, 360, 100, 100, 255);
  noStroke();
  background(255);
  let r = random(_minWidth / 3, _minWidth / 0.5);
  let numShape = ((10 * _minWidth / 2 / r))**1.5 / 3;
  for (let i = 0; i < numShape; i++) {
    drawShape(r);
  }
}

function drawShape(r) {
  let numCorner = 64;
  let x = random(-_minWidth/2, _minWidth/2);
  let y = random(-_minWidth/2, _minWidth/2);
  let ang = random(2*PI);
  let h = random(360);
  push();
  translate(x, y);
  rotate(ang);
  beginShape();
  for (let i = 0; i < numCorner; i++) {
  if (i == 0) { 
  fill(h, 100, 100); 
}
  if (i != 0) { 
  fill(h, 0, 100, 0); 
}
  vertex(r*cos(2*PI/numCorner*i), r*sin(2*PI/numCorner*i));
  }
  endShape();
  pop();
 
}

function touchStarted(){
  setup();
}