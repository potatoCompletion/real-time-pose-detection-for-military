// Top of Body
document.write("<h1>Military_Basic_Pose_Estimation</h1>")
document.write("------------------------------------------------------------------------------------<br>");


// Variables
let video;
let poseNet;
let pose;
let skeleton;
let brain;
let poseLabel = "";
let state = 'waiting';
let targetLabel;
let indicateConfidence = "";

// result
let resultLabel;

//error
let a;
let b;
let errorPart;
let errors;

/********************************************************************************************
* Mode Select
* Training Model            -> press t
* save collected data       -> press s
* select capture mode       -> 1 = Attention
*                           -> 2 = At ease
********************************************************************************************/

function makeLabel(string, timeout,) {
    targetLabel = '차렷';
    console.log(targetLabel);
    setTimeout(function () {
        console.log('collecting');
        state = 'collecting';
        setTimeout(function () {
            console.log('not collecting');
            state = 'waiting';
        }, timeout);
    }, 1000);
}
function keyPressed() {
    if (key == 't') {
        brain.normalizeData();
        brain.train({ epochs: 50 }, finished);
    }
    if (key == 's') {
        brain.saveData();
    }

    if (key == '1')                                  // Attention Data Collecting
    {
        makeLabel('차렷', 10000);
    }
    if (key == '2')                             // At ease Data Collecting
    {
        makeLabel('열중쉬어', 10000);
    }
    if (key == '3')                             // CPR Data Collecting
    {
        makeLabel('심폐소생술', 10000);
    }
    if (key == '4')                             // Assume the standing Position Data Collecting
    {
        makeLabel('서서쏴', 10000);
    }
}


/********************************************************************************************
* Data Training Section
********************************************************************************************/
function dataReady() {
    brain.normalizeData();
    brain.train({ epochs: 80 }, finished);
}

function finished() {
    console.log('model trained');
    brain.save();
    classifyPose();
}

/********************************************************************************************
* Pose Estimation Section
********************************************************************************************/
function brainLoaded() {
    console.log('pose classification ready!');
    classifyPose();
}

function classifyPose() {
    if (pose) {
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        brain.classify(inputs, gotResult);
    }
    else {
        setTimeout(classifyPose, 100);
    }
}

// Pose Estimation Section - indicate result on monitor
function gotResult(error, results) {
    if (results[0].confidence > 0.75) {
        poseLabel = results[0].label.toUpperCase();
        indicateConfidence = results[0].confidence;
    }
    classifyPose();
}


/********************************************************************************************
* Real-Time Scaning Section
********************************************************************************************/
function modelLoaded() {
    console.log('poseNet ready');
}


function gotPoses(poses) {
    // console.log(poses);
    if (poses.length > 0) {
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;

        if (state == 'collecting') {
            let inputs = [];
            for (let i = 0; i < pose.keypoints.length; i++) {
                let x = pose.keypoints[i].position.x;
                let y = pose.keypoints[i].position.y;
                inputs.push(x);
                inputs.push(y);
            }
            let target = [targetLabel];
            brain.addData(inputs, target);
        }
    }
}
/********************************************************************************************
* Drawing Error 
********************************************************************************************/
function drawErrorPart(a, b) {
    stroke(255, 0, 0);
    line(a.position.x, a.position.y, b.position.x, b.position.y);
}

function gotError(size) {
    for (let i = 0; i < size; i++) {
        if (errorPart == erros[i]) {
            drawErrorPart(a, b);
        }
    }
}
function drawError() {
    gotError('Elbow');
}
/********************************************************************************************
* Screen indicating
********************************************************************************************/
function setup() {
    createCanvas(1600, 800);

    leftBuffer = createGraphics(400, 800);
    centerBuffer = createGraphics(800, 800);
    rightBuffer = createGraphics(400, 800);

    video = createCapture(VIDEO);
    video.hide();
    video.size(800, 800);

    // Draw on your buffers however you like
    drawLeftBuffer();
    //drawCenterBuffer();
    drawRightBuffer();

    createRightSideUIControl();
    createLeftSideUIControl();

    // Paint the off-screen buffers onto the main canvas   
    image(leftBuffer, 800, 0);
    image(rightBuffer, 1200, 0);

    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);

    let options =
    {
        inputs: 34,
        outputs: 4,
        task: 'classification',
        debug: true
    }

    brain = ml5.neuralNetwork(options);
    //brain.loadData('aaa.json', dataReady);
    //LOAD PRETRAINED MODEL
    const modelInfo =
    {
        model: 'model(1).json',
        metadata: 'model_meta(1).json',
        weights: 'model.weights(1).bin',
    };
    brain.load(modelInfo, brainLoaded);
}

function draw() {
    createBox(800, 0, 800, 800, [0, 75, 0]);

    push();
    translate(video.width, 0);
    scale(-1, 1);
    image(video, 0, 0, video.width, video.height);

    if (pose) {
        drawSkeleton();
        //drawError();
    }

    // pop message with result
    pop();
    let makePercentage = indicateConfidence * 100;
    let tempt = makePercentage.toFixed(1);

    //TODO : initialize confidence percentage of Pick Label
    let value_Indicate = tempt.toString() + "%";

    //createText(1100, 100, 50, resultLabel, [0, 0, 0]);
    createText(1100, 100, 50, poseLabel, [0, 0, 0]);
    createText(1100, 180, 50, value_Indicate, [0, 0, 0]);
}

function drawSkeleton() {
    for (let i = 0; i < skeleton.length; i++) {
        let a = skeleton[i][0];
        let b = skeleton[i][1];
        strokeWeight(2);
        stroke(0);

        let tempt1 = ['rightElbow', 'leftElbow'];
        gotError(tempt1);

        line(a.position.x, a.position.y, b.position.x, b.position.y);
    }

    for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        fill(0);
        stroke(255);
        ellipse(x, y, 16, 16);
    }
}

/********************************************************************************************
* GUI API
********************************************************************************************/
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
function createCircle(pos_x, pos_y, d, color) {
    fill(color[0], color[1], color[2]);
    noStroke();
    circle(pos_x, pos_y, d);
}

/********************************************************************************************
* Draw GUI
********************************************************************************************/
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
    pb_attention = createPushButton(850, 200, 200, 80, '차렷');
    pb_at_ease = createPushButton(850, 300, 200, 80, '열중 쉬어');
    pb_stand_up_shot = createPushButton(850, 400, 200, 80, '서서쏴');
    pb_cpr = createPushButton(850, 500, 200, 80, '심폐소생술');
    pb_left_turn = createPushButton(850, 600, 200, 80, '음 뭐하지??');
    pb_option = createPushButton(850, 700, 200, 50, 'performance');

    pb_attention.mousePressed(pb_attention_callback);
    pb_at_ease.mousePressed(pb_at_ease_callback);
    pb_stand_up_shot.mousePressed(pb_stand_up_shot_callback);
    pb_cpr.mousePressed(pb_cpr_callback());
    pb_left_turn.mousePressed(pb_attention_callback);
    pb_option.mousePressed(pb_attention_callback);
}
function pb_attention_callback() {
    resultLabel = '차렷';
}
function pb_at_ease_callback() {
    resultLabel = '열중 쉬어'
}
function pb_stand_up_shot_callback() {
    resultLabel = '서서쏴';
}
function pb_cpr_callback() {
    resultLabel = '심폐소생술';
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
function drawBox() {
    createBox(1300, 200, 200, 100, [150, 150, 150]);
    createBox(1300, 300, 200, 100, [150, 150, 150]);
    createBox(1300, 400, 200, 100, [150, 150, 150]);
    createBox(1300, 500, 200, 100, [150, 150, 150]);
    createBox(1300, 600, 200, 100, [150, 150, 150]);
    createBox(1300, 700, 200, 100, [150, 150, 150]);
    createBox(1300, 800, 200, 100, [150, 150, 150]);
}

/********************************************************************************************
* Code End
********************************************************************************************/