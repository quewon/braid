// different strings are different choices
// a tighter weave results in stronger resolve

const colors = [
  "#c53062",
  "#b4dc3a",
  "#225875",
  "#f28941",
  "#472859",
  "#249e4f"
];
var last_color_used = -1;

var _c = document.getElementById("canvas").getContext("2d");

function init() {
  for (let i=0; i<3; i++) {
    new string(_c.canvas.width/2+i*25, 16, 400, 10);
  }
  
  document.onkeydown = function(e) {
    let k = e.key;
    if (k=="ArrowRight") {
      selected += 1;
    } else if (k=="ArrowLeft") {
      selected -= 1;
    }
    selected = Math.max(0, selected);
    selected = Math.min(strings.length - 2, selected);
    
    let a = strings[selected];
    let b = strings[selected + 1];
    if (k=="c" || k=="z") cross(a, b);
    if (k=="x") cross(b, a);
  }
}

function draw() {
  _c.fillStyle = "#fff1a9";
  _c.fillRect(0, 0, _c.canvas.width, _c.canvas.height);
  
  for (let node of nodes) {
    node.draw();
  }
  
  let a = strings[selected];
  let b = strings[selected + 1];
  let crosspoint = Math.max(a.crosspoint, b.crosspoint);
  a.nodes[crosspoint].drawCrosspoint();
  b.nodes[crosspoint].drawCrosspoint();
  
  requestAnimationFrame(draw);
}

function update() {
  for (let string of strings) {
    string.update();
  }
  nodes.sort((a, b) => a.z - b.z);
}

const cross_interval = 3;
var strings = [];
var nodes = [];
var selected = 0;

class string {
  constructor(x, y, length, r) {
    last_color_used += 1;
    if (last_color_used > colors.length) last_color_used = 0;
    
    this.index = strings.length;
    this.x = x;
    this.y = y;
    this.color = colors[last_color_used];
    this.crosspoint = cross_interval;
    this.nodes = [];
    
    length = length || 100;
    r = r || 10;
    
    for (let ny=y; ny<y+length; ny+=r/2) {
      this.nodes.push(new node(x, ny, r, this.color));
    }
    this.nodes[0].locked = true;
    this.knots = [this.nodes[0]];
    
    this.sticks = [];
    for (let n=0; n<this.nodes.length-1; n++) {
      this.sticks.push(new stick(this.nodes[n], this.nodes[n+1]));
    }
    
    strings.push(this);
  }
  
  update() {
    for (let node of this.nodes) {
      let px = node.x;
      let py = node.y;
      let pz = node.z;
      if (!node.locked) {
        node.x += px - node.px;
        node.y += py - node.py + node.gravity;
        node.z += pz - node.pz;
        node.px = px;
        node.py = py;
        node.pz = pz;
        node.dx = node.x;
        node.dy = node.y;
        node.dz = node.z;
      }
      
      if (node.x != node.dx) {
        node.x += (node.dx - px) / 30;
        if (Math.abs(node.dx - node.x) < .1) {
          node.x = node.dx;
        }
      }
      if (node.y != node.dy) {
        node.y += (node.dy - py) / 30;
        if (Math.abs(node.dy - node.y) < .1) {
          node.y = node.dy;
        }
      }
      if (node.z != node.dz) {
        node.z += (node.dz - pz) / 30;
        if (Math.abs(node.dz - node.z) < .1) {
          node.z = node.dz;
        }
      }
    }
    
    const iterations = 20;
    for (let i=0; i<iterations; i++) {
      for (let stick of this.sticks) {
        let a = stick.a;
        let b = stick.b;
        
        let cx=(a.x+b.x)/2;
        let cy=(a.y+b.y)/2;
        let cz=(a.z+b.z)/2;
        
        let d=normalize(a.x-b.x, a.y-b.y, a.z-b.z);
        let half = stick.halfLength;
        
        if (!a.locked) {
          a.x=cx+d.x*half;
          a.y=cy+d.y*half;
          a.z=cz+d.z*half;
        }
        if (!b.locked) {
          b.x=cx-d.x*half;
          b.y=cy-d.y*half;
          b.z=cz-d.z*half;
        }
      }
    }
  }
}

function normalize(x,y,z) {
  let d = Math.sqrt(x*x + y*y + z*z);
  return {
    x: x/d,
    y: y/d,
    z: z/d
  }
}

function cross(a, b) {
  let ai = a.index;
  let bi = b.index;
  a.index = bi;
  b.index = ai;
  strings.sort((a, b) => a.index - b.index);
  
  let ax = a.x;
  a.x = b.x;
  b.x = ax;
  
  let al = a.knots[a.knots.length - 1];
  let bl = b.knots[b.knots.length - 1];
  if (al && bl) {
    if (al.z==1 && bl.z==-1) {
      al.locked = false;
      bl.locked = false;
      a.knots.pop();
      b.knots.pop();
      a.crosspoint = a.knots.length * cross_interval;
      b.crosspoint = b.knots.length * cross_interval;
      return;
    }
  }
  
  let crosspoint = Math.max(a.crosspoint, b.crosspoint);
  let an = a.nodes[crosspoint];
  let bn = b.nodes[crosspoint];
  a.crosspoint = crosspoint + cross_interval;
  b.crosspoint = crosspoint + cross_interval;
  
  an.dx = a.x;
  bn.dx = b.x;
  an.dy = a.y + crosspoint * an.r;
  bn.dy = b.y + crosspoint * bn.r;
  an.dz = 1;
  bn.dz = -1;
  an.locked = true;
  bn.locked = true;
  
  a.knots.push(an);
  b.knots.push(bn);
}

class node {
  constructor(x, y, r, color) {
    this.locked = false;
    this.x = x;
    this.y = y;
    this.z = 0;
    
    this.px = x;
    this.py = y;
    this.pz = 0;
    
    this.dx = x;
    this.dy = y;
    this.dz = 0;
    
    this.gravity = .2;
    this.r = r;
    this.color = color;
    
    nodes.push(this);
  }
  
  draw() {
    _c.beginPath();
    // _c.fillStyle = "rgba("+this.x+", "+this.y+", 100, "+Math.min((this.z+1.3),1)+")";
    _c.fillStyle = this.color;
    _c.arc(this.x, this.y, this.r, 0, 2*Math.PI);
    _c.fill();
  }
  
  drawCrosspoint() {
    _c.beginPath();
    _c.lineWidth = 2;
    _c.strokeStyle = "#120e23";
    _c.arc(this.x, this.y, this.r + 3, 0, 2*Math.PI);
    _c.stroke();
  }
}

class stick {
  constructor(a, b) {
    let dx = a.x-b.x;
    let dy = a.y-b.y;
    this.length = Math.sqrt(dx*dx + dy*dy);
    this.halfLength = this.length/2;
    this.a = a;
    this.b = b;
  }
}