// Top of Body
document.write("<h1>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Basic_Pose_Estimation</h1>");
document.write("-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------<br>");

let leftBuffer;
let centerBuffer;
let rightBuffer;

let video;

//setup
function setup() {
    createCanvas(1600, 800);

    leftBuffer = createGraphics(400, 800);
    centerBuffer = createGraphics(800, 800)
    rightBuffer = createGraphics(400, 800);

    video = createCapture(VIDEO);
    video.hide();
    video.size(800, 900);

    // Draw on your buffers however you like
    drawLeftBuffer();
    //drawCenterBuffer();
    drawRightBuffer();

    createRightSideUIControl();
    createLeftSideUIControl();

    // Paint the off-screen buffers onto the main canvas   
    image(leftBuffer, 0, 0);
    image(rightBuffer, 1200, 0);
}

//draw
function draw() {
    image(video, 400, 0, video.width, video.height);
    //drawBox();
    drawText();
    createCircle(1000, 600, 30, [255, 0, 0]);
}

/* draw Buffer */
function drawLeftBuffer() {
    leftBuffer.background(0, 75, 0);
}
function drawRightBuffer() {
    rightBuffer.background(0, 75, 0);
}
function createRightSideUIControl() {
}
function createLeftSideUIControl() {
    pb_attention = createPushButton(100, 200, 200, 80, '차렷');
    pb_at_ease = createPushButton(100, 300, 200, 80, '열중 쉬어');
    pb_stand_up_shot = createPushButton(100, 400, 200, 80, '서서쏴');
    pb_cpr = createPushButton(100, 500, 200, 80, '심폐소생술');
    pb_left_turn = createPushButton(100, 600, 200, 80, '음 뭐하지??');
    pb_option = createPushButton(100, 700, 200, 50, 'performance');
}

/* API */
function createPushButton(pos_x, pos_y, size_x, size_y, string) {
    let push_button = createButton(string);
    push_button.size(size_x, size_y);
    push_button.position(pos_x, pos_y);
    return push_button;
}
function createText(pos_x, pos_y, size, string, color) {
    // console.debug(color[0], color[1], color[2]);
    fill(color[0], color[1], color[2]);
    noStroke();
    textSize(size);
    textStyle(BOLD);
    textAlign(LEFT);
    text(string, pos_x, pos_y);
}
function createBox(pos_x, pos_y, w, h, color) {
    fill(color[0], color[1], color[2]);
    noStroke();
    rect(pos_x, pos_y, w, h);
}
function createCircle(pos_x, pos_y, d, color)
{
    fill(color[0], color[1], color[2]);
    noStroke();
    circle(pos_x, pos_y, d);
}

//FIXME
function createTextBox(pos_x, pos_y, w, h, text_size, rect_color, text_color, string) {

//TODO : Text do not locate in exact box
    createBox(pos_x, pos_y, w, h, rect_color);
    createText(pos_x + 20, pos_y + 20, text_size, string, text_color);
}

/*test*/
function drawText() {
    createText(1250, 100, 30, 'Pose Estimation0', [255, 255, 255]);
    createText(1250, 200, 30, 'Pose Estimation1', [255, 255, 255]);
    createText(1250, 300, 30, 'Pose Estimation2', [255, 255, 255]);
    createText(1250, 400, 30, 'Pose Estimation3', [255, 255, 255]);
    createText(1250, 500, 30, 'Pose Estimation4', [255, 255, 255]);
    createText(1250, 600, 30, 'Pose Estimation5', [255, 255, 255]);
    createText(1250, 700, 30, 'Pose Estimation6', [255, 255, 255]);
    createText(1250, 800, 30, 'Pose Estimation7', [255, 255, 255]);
}
function drawBox()
{
    createBox(1300, 200, 200, 100, [150, 150, 150]);
    createBox(1300, 300, 200, 100, [150, 150, 150]);
    createBox(1300, 400, 200, 100, [150, 150, 150]);
    createBox(1300, 500, 200, 100, [150, 150, 150]);
    createBox(1300, 600, 200, 100, [150, 150, 150]);
    createBox(1300, 700, 200, 100, [150, 150, 150]);
    createBox(1300, 800, 200, 100, [150, 150, 150]);
}