let size = 40
const numlines = 100
const xoff = 368 / 2
const yoff = 0
const gravity = 0.4
const elasticity = 0.96

let a = 5
document.getElementById('newshape').addEventListener('click', () => {
    let olda = a;
    while (olda == a) {
        a = random([3,4,5,6,7])
    }
    switch(a) {
        case 3: size = 70; break
        case 4: size = 60; break
        case 5: size = 40; break
        case 6: size = 35; break
        case 7: size = 30; break
    }
})

const r = (t) => size * (a + sin(a * t + millis() / 2000))
const drdt = (t) => size * a * cos(a * t + millis() / 2000)
const dx = (v) => drdt(v) * cos(v) - sin(v) * r(v);
const dy = (v) => drdt(v) * sin(v) + cos(v) * r(v);

let ball = { x: 0, y: 0, vx: 0, vy: 0, r: 30 }

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('sketch');
}

function draw() {
    background(backgroundColor.r, backgroundColor.g, backgroundColor.b);
    fill(highlightColor.r, highlightColor.g, highlightColor.b);
    translate(width/2 + xoff, height/2 + yoff);
    // ellipse(0, 0, 5)
        
    let prevx = r(0) * cos(0)
    let prevy = -1 * (r(0) * sin(0))
    let increment = 2 * PI / numlines
        
    stroke(lighterColor)
    strokeWeight(1)
    for (let i=-(width/2)-xoff; i<-(width/2)-xoff+width; i+=30) {
        for (let j=-(height/2)-yoff; j<-(height/2)-yoff+height; j+=30) {
            let ballr = atan2(j, i);
            let mtan = dy(ballr) / dx(ballr);
            if (dx(ballr) == 0) mtan = 0;
    
            let x1 = sqrt(1 / (1 + mtan * mtan));
            let y1 = x1 * mtan;
    
            x1 *= 3;
            y1 *= 3;
    
            line(i - x1, j - y1, i + x1, j + y1);
        }
    }
        
    stroke(outlineColor)
    strokeWeight(2.5)
    for (let i = increment; i <= 2 * PI; i += increment) {
        let x = r(i) * cos(i)
        let y = r(i) * sin(i)
        line(prevx, prevy, x, y)
        prevx = x
        prevy = y
    }
    
    let ballr = atan2(ball.y, ball.x)
    let bound = r(ballr)
    let bdist = dist(0, 0, ball.x, ball.y) + ball.r / 2

    if (mouseIsPressed && dist(0, 0, mouseX - width/2 - xoff, mouseY - height/2 - yoff) < bound) {
        ball.x = mouseX - width/2 - xoff
        ball.y = mouseY - height/2 - yoff
        ball.vx = 0
        ball.vy = 0
    }
        
    if (bdist > bound) {
        let mtan = dy(ballr) / dx(ballr)
        let mnorm = -1 / mtan
        let x1 = mtan / sqrt(pow(mtan, 2) + 1)
        
        let orthAngle = atan2(mnorm * x1, x1)
        let viAngle = atan2(ball.vy, ball.vx)
        let vMag = -elasticity * dist(0, 0, ball.vx, ball.vy)
        let vfAngle = 2 * orthAngle - viAngle
        
        ball.vx = vMag * cos(vfAngle)
        ball.vy = vMag * sin(vfAngle)
        ball.x = (bound - ball.r / 2) * cos(ballr)
        ball.y = (bound - ball.r / 2) * sin(ballr)
    }
        
    noStroke()
    ellipse(ball.x, ball.y, ball.r)
    
    ball.x += ball.vx
    ball.y += ball.vy
    
    ball.vy += gravity
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
}