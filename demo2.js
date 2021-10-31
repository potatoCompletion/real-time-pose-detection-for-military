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

// Variables (김완수 추가)
let j; //seperatePoseDetection에서 seperatePoseTest로 해당 연속모델의 위치 정보를 넘기기 위한 용도
let seperatePoseNum = 3; //연속동작의 구분동작 개수
let scoreCount = 0; //연속 동작이 테스트 몇번 통과했는지 카운트 용도
let buf; //mousepressed 시 해당 동작 문자열 읽어오는 용도

// Pose Setting (김완수 추가)
let poseInfo = {
   '차렷': 0,
   '열중쉬어': 0,
   '경례': 0,
   '서서쏴': 0
};                   //일반동작 0, 연속동작 1
let setSeperatePose = {
   '심폐소생술': ['환자눕히기', '인공호흡', '흉부압박']
};                           //모델학습 시 환자눕히기, 인공호흡, 흉부압박 총 세가지 필요
// result
let resultLabel;

//error
let a;
let b;
let errors;
let flag;

/********************************************************************************************
* Mode Select
* Training Model            -> press t
* save collected data       -> press s
* select capture mode       -> 1 = Attention
*                           -> 2 = At ease
********************************************************************************************/
function makeLabel(string, timeout,) {
   targetLabel = string;
   console.log(targetLabel);
   setTimeout(function () {
      console.log('collecting');
      state = 'collecting';
      setTimeout(function () {
         console.log('not collecting');
         state = 'waiting';
      }, timeout);
   }, 3000);
}
function keyPressed() {
   if (key == 't') {
      brain.normalizeData();
      brain.train({ epochs: 50 }, finished);
   }
   if (key == 's') {
      brain.saveData();
   }
   if (key == '1') {
      makeLabel('차렷', 15000);
   }
   if (key == '2') {
      makeLabel('열중쉬어', 15000);
   }
   if (key == '3') {
      makeLabel('경례', 15000);
   }
   if (key == '4') {
      makeLabel('서서쏴', 15000);
   }
}
/********************************************************************************************
* Data Training Section
********************************************************************************************/
function dataReady() {
   brain.normalizeData();
   brain.train({ epochs: 100 }, finished);
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
// function gotResult(error, results) {
//    if (results[0].confidence > 0.50) {
//       poseLabel = results[0].label.toUpperCase();
//       indicateConfidence = results[0].confidence;
//    }
//    classifyPose();
// }

// FIXME 
function gotResult(error, results) {
   //poseInfo 값이 0일 시, 일반동작
   if (poseInfo[buf] == 0) {
      normalPoseModelDetection(results);
   }
   // //poseInfo 값이 1일 시, 연속동작
   //   if (poseInfo[buf] == 1)
   //    {
   //       seperatePoseTest(results);
   //    }
   scoreCount = 0;
   classifyPose();
}


function normalPoseModelDetection(results) {
   for (let i = 0; i < results.length; i++) {
      if (buf == results[i].label) {
         poseLabel = results[i].label.toUpperCase();
         indicateConfidence = results[i].confidence;
         if (results[i].confidence < 0.60){
            indicateConfidence = 0;
         }
         break;
      }
   }
}
function seperatePoseModelDetection(results, numOfSeperatePose) {
   for (j = 0; j < results.length; j++) {
      if (setSeperatePose[buf][numOfSeperatePose] == results[j].label) {
         poseLabel = results[j].label.toUpperCase();
         indicateConfidence = results[j].confidence;
         break;
      }
   }
}
function seperatePoseTest(results) {
   for (let i = 0; i < seperatePoseNum; i++) {
      seperatePoseModelDetection(results, i);
      if (results[j].confidence > 90) {
         scoreCount++;
      }
      else {
         break;
      }
   }
   //총 3단계에 걸쳐 90점 이상 합격 시 scoreCount = 3으로 최고점. (수정 필요)
}
function getString(string) {
   buf = string;
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
function poseComparator() {
   pose = poses[0].pose;
   //////////// attention
   // Lwrist, Lhip kp[9, 11] -> json 18, 22
   // json length
   let savedModelLength;
   let realTimeModelLength;
   let x1_json = 367.7117860433418;
   let x2_json = 338.5100327876576;
   let y1_json = 218.68076138561463;
   let y2_json = 220.13381824158785;

   savedModelLength = EuclideanDistance(x1_json, x2_json, y1_json, y2_json);
   realTimeModelLength = EuclideanDistance(pose.keypoints[9].position.x, pose.keypoints[11].position.x, pose.keypoints[9].position.y, pose.keypoints[11].position.y);

   if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.15)) {
      let tempt1 = ['leftElbow'];

      gotError(tempt1);
   }
}
/********************************************************************************************
* Drawing Error
********************************************************************************************/
function drawErrorPart(a, b) {
   stroke(255, 0, 0);
   line(a.position.x, a.position.y, b.position.x, b.position.y);
}
function gotError(errors) {
   for (let i = 0; i < errors.length; i++) {
      if (a.part == errors[i] || b.part == errors[i]) {
         drawErrorPart(a, b);
      }
   }
}
/*function drawError() {
   gotError('Elbow');
}*/
/********************************************************************************************
* Screen indicating
********************************************************************************************/
function setup() {
   createCanvas(1600, 800);
   leftBuffer = createGraphics(400, 800);
   centerBuffer = createGraphics(800, 800)
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
   //brain.loadData('1206data_4.json', dataReady);
   //LOAD PRETRAINED MODEL
   const modelInfo =
   {
      model: 'model (13).json',
      metadata: 'model_meta (13).json',
      weights: 'model.weights (13).bin',
   };
   brain.load(modelInfo, brainLoaded);
}
function modelChange_1() {     //차렷, 열중쉬어
   const modelInfo =
   {
      model: 'model (8).json',
      metadata: 'model_meta (8).json',
      weights: 'model.weights (8).bin',
   };
   brain.load(modelInfo, brainLoaded);
   console.log('model 1');
}
function modelChange_2() {     //경례, 서서쏴
   const modelInfo =
   {
      model: 'model (9).json',
      metadata: 'model_meta (9).json',
      weights: 'model.weights (9).bin',
   };
   brain.load(modelInfo, brainLoaded);
   console.log('model 2');
}
function draw() {
   createBox(800, 0, 800, 800, [0, 75, 0]);
   push();
   translate(video.width, 0);
   scale(-1, 1);
   image(video, 0, 0, video.width, video.height);
   if (pose) {
      drawSkeleton();
   }
   // pop message with result
   pop();
   let makePercentage = indicateConfidence * 100;
   let tempt = makePercentage.toFixed(1);
   //TODO : initialize confidence percentage of Pick Label
   let value_Indicate = tempt.toString() + "%";
   //createText(1100, 100, 50, resultLabel, [0, 0, 0]);
   createText(1100, 100, 70, poseLabel, [255, 255, 255]);
   // createText(1100, 260, 70, resultLabel, [255, 255, 255]);
   createText(1100, 180, 70, value_Indicate, [255, 255, 255]);
   if(flag){
      createText(1100, 250, 30, '자세를 교정하십시오', [255, 0, 0]);
   }
}

/********************************************************************************************
* draw Skeleton
********************************************************************************************/
function drawError(tempt) {
   for (let i = 0; i < skeleton.length; i++) {
      a = skeleton[i][0];
      b = skeleton[i][1];
      strokeWeight(4);
      stroke(0);
      line(a.position.x, a.position.y, b.position.x, b.position.y);
      let tempt1 = tempt;
      gotError(tempt1);
   }
}
function drawSkeletonLine() {
   for (let i = 0; i < skeleton.length; i++) {
      a = skeleton[i][0];
      b = skeleton[i][1];
      strokeWeight(3);
      stroke(0, 0, 0);
      line(a.position.x, a.position.y, b.position.x, b.position.y);
   }
}
function drawSkeletonCircle() {
   for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0);
      stroke(255);
      line()
      ellipse(x, y, 16, 16);
   }
}
function drawSkeleton() {
   drawSkeletonLine();
   drawSkeletonCircle();

   let savedModelLength;
   let realTimeModelLength;

   flag = 0;

   if (resultLabel == '차렷') {
      //  /*********************************************Attention**********************************************/
      ////////// attention
      // Lwrist, Lhip kp[9, 11] -> json 14, 15 / 8, 9
      // json length
      let attentionX1_json = 367.7117860433418;
      let attentionX2_json = 338.5100327876576;
      let attentionY1_json = 218.68076138561463;
      let attentionY2_json = 220.13381824158785;

      // 차렷자세에서 왼팔 오류
      savedModelLength = EuclideanDistance(attentionX1_json, attentionX2_json, attentionY1_json, attentionY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[9].position.x, pose.keypoints[11].position.x, pose.keypoints[9].position.y, pose.keypoints[11].position.y);

      let attention_leftElbow_flag = 0;
      let attention_rightElbow_flag = 0;
      let attention_ankle_flag = 0;

      let attention_list = [];

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         attention_leftElbow_flag = 1;
         flag = 1;
      }

      ////////// attention
      // Rwrist, Rhip kp[10, 12] -> json 20, 21 / 24, 25
      // json length
      attentionX1_json = 236.51546396474856;
      attentionX2_json = 270.0870899103771;
      attentionY1_json = 228.4666005630939;
      attentionY2_json = 219.90847604316576;

      // 차렷자세에서 오른팔 오류
      savedModelLength = EuclideanDistance(attentionX1_json, attentionX2_json, attentionY1_json, attentionY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[10].position.x, pose.keypoints[12].position.x, pose.keypoints[10].position.y, pose.keypoints[12].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         attention_rightElbow_flag = 1;
         flag = 1;
      }

      ////////// attention
      // Rankle, Lankle kp[15, 16] -> json 30, 31 / 32, 33
      // json length

      attentionX1_json = 318.4283559550086;
      attentionX2_json = 277.9046303672865;
      attentionY1_json = 438.923768160636;
      attentionY2_json = 435.6038884391561;


      // 차렷자세에서 양 다리 오류
      savedModelLength = EuclideanDistance(attentionX1_json, attentionX2_json, attentionY1_json, attentionY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[15].position.x, pose.keypoints[16].position.x, pose.keypoints[15].position.y, pose.keypoints[16].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         attention_ankle_flag = 1;
         flag = 1;
      }

      if (attention_leftElbow_flag) {
         indicateConfidence = 0;
         attention_list.push('leftElbow');
      }
      if (attention_rightElbow_flag) {
         indicateConfidence = 0;
         attention_list.push('rightElbow');
      }
      if (attention_ankle_flag) {
         indicateConfidence = 0;
         attention_list.push('rightKnee');
         attention_list.push('leftKnee');
      }
      drawError(attention_list);
   }
   if (resultLabel == '열중쉬어') {
      /*********************************************At ease**********************************************/
      let ateasy_left_wrist_hip_flag = 0;
      let ateasy_right_wrist_hip_flag = 0;
      let ateasy_ankle_flag = 0;

      let atease_list = [];

      ///////////// At ease
      // Lwrist, Lhip kp[9, 5] -> json 18, 19 / 10, 11
      // json length
      let ateaseX1_json = 365.43712593658626;
      let ateaseX2_json = 378.68758556670844;
      let ateaseY1_json = 147.22139235825566;
      let ateaseY2_json = 73.2900876050804;


      // 열중쉬어자세에서 왼쪽 팦 오류
      savedModelLength = EuclideanDistance(ateaseX1_json, ateaseX2_json, ateaseY1_json, ateaseY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[9].position.x, pose.keypoints[5].position.x, pose.keypoints[9].position.y, pose.keypoints[5].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         flag = 1;
         ateasy_left_wrist_hip_flag = 1;
      }

      ///////////// At ease
      // Rwrist, Rhip kp[10, 6] -> json 20, 21 / 12, 13
      // json length
      ateaseX1_json = 273.29481098851727;
      ateaseX2_json = 274.78421781960054;
      ateaseY1_json = 149.01475040071423;
      ateaseY2_json = 63.66389135171099;

      // 열중쉬어자세에서 오른 팦 오류
      savedModelLength = EuclideanDistance(ateaseX1_json, ateaseX2_json, ateaseY1_json, ateaseY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[10].position.x, pose.keypoints[6].position.x, pose.keypoints[10].position.y, pose.keypoints[6].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         flag = 1;
         ateasy_right_wrist_hip_flag = 1;
      }

      ///////////// At ease
      // Rankle, Lankle kp[15, 16] -> json 30, 31 / 32, 33
      // json length
      ateaseX1_json = 345.25362070540933;
      ateaseX2_json = 255.60535958868252;
      ateaseY1_json = 443.6467696816368;
      ateaseY2_json = 438.9020838560881;

      ateaseX1_json = 435.254979273032;
      ateaseX2_json = 655.6503429747464;
      ateaseY1_json = 344.8236234936333;
      ateaseY2_json = 660.9497813918205;

      // 열중쉬어자세에서 양 다리 오류
      savedModelLength = EuclideanDistance(ateaseX1_json, ateaseX2_json, ateaseY1_json, ateaseY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[15].position.x, pose.keypoints[16].position.x, pose.keypoints[15].position.y, pose.keypoints[16].position.y);

      if (realTimeModelLength * 2 >= (savedModelLength + savedModelLength * 0.5)) {
         ateasy_ankle_flag = 1;
         flag = 1;
      }

      if (ateasy_left_wrist_hip_flag) {
         indicateConfidence = 0;
         atease_list.push('rightElbow');
         createText(1100, 200, 70, '자세를 교정하십시오', [255, 0, 0]);
      }
      if (ateasy_right_wrist_hip_flag) {
         indicateConfidence = 0;
         atease_list.push('leftElbow');
         createText(1100, 200, 70, '자세를 교정하십시오', [255, 0, 0]);
      }
      if (ateasy_ankle_flag) {
         indicateConfidence = 0;
         atease_list.push('rightKnee');
         atease_list.push('leftKnee');
         createText(1100, 200, 70, '자세를 교정하십시오', [255, 0, 0]);
      }
      drawError(atease_list);
   }
   if (resultLabel == '서서쏴') {
      /*********************************************salute**********************************************/
      let salute_left_wrist_hip_flag = 0;
      let salute_right_wrist_hip_flag = 0;
      let salute_ankle_flag = 0;

      let salute_list = [];

      ///////////// salute
      // Lwrist, Lhip kp[9, 5] -> json 18, 19 / 10, 11
      // json length
      let saluteX1_json = 358.359612358941;
      let saluteX2_json = 200.23370337532742;
      let saluteY1_json = 406.45061961391514;
      let saluteY2_json = 114.18894197043852;


      // 경례자세에서 왼쪽 팦 오류
      savedModelLength = EuclideanDistance(saluteX1_json, saluteX2_json, saluteY1_json, saluteY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[9].position.x, pose.keypoints[5].position.x, pose.keypoints[9].position.y, pose.keypoints[5].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         salute_left_wrist_hip_flag = 1;
      }

      ///////////// salute
      // Rwrist, Rhip kp[10, 6] -> json 20, 21 / 12, 13
      // json length
      saluteX1_json = 360.9394378364667;
      saluteX2_json = 575.957616913853;
      saluteY1_json = 433.7798380712319;
      saluteY2_json = 567.911725109316;


      // 경례자세에서 왼쪽 팦 오류
      savedModelLength = EuclideanDistance(saluteX1_json, saluteX2_json, saluteY1_json, saluteY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[9].position.x, pose.keypoints[5].position.x, pose.keypoints[9].position.y, pose.keypoints[5].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         salute_right_wrist_hip_flag = 1;
      }
      //console.log(realTimeModelLength,'    ' ,savedModelLength);

      ///////////// salute
      // Rankle, Lankle kp[15, 16] -> json 30, 31 / 32, 33
      // json length

      saluteX1_json = 318.4283559550086;
      saluateX2_json = 277.9046303672865;
      saluateY1_json = 438.923768160636;
      saluateY2_json = 435.6038884391561;


      // 경례자세에서 양 다리 오류
      savedModelLength = EuclideanDistance(saluteX1_json, saluteX2_json, saluteY1_json, saluteY2_json);
      realTimeModelLength = EuclideanDistance(pose.keypoints[15].position.x, pose.keypoints[16].position.x, pose.keypoints[15].position.y, pose.keypoints[16].position.y);

      if (realTimeModelLength >= (savedModelLength + savedModelLength * 0.9)) {
         attention_ankle_flag = 1;
      }

      if (salute_right_wrist_hip_flag) {
         salute_list.push('rightElbow');
      }
      if (salute_left_wrist_hip_flag) {
         salute_list.push('leftElbow');
      }
      if (salute_ankle_flag) {
         salute_list.push('rightKnee');
         salute_list.push('leftKnee');
      }
      drawError(salute_list);
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
   pb_at_ease = createPushButton(850, 300, 200, 80, '열중쉬어');
   // pb_salute = createPushButton(850, 400, 200, 80, '경례');
   pb_stand_up_shot = createPushButton(850, 400, 200, 80, '서서쏴');

   pb_option = createPushButton(850, 700, 200, 50, 'performance');

   pb_attention.mousePressed(pb_attention_callback);
   pb_at_ease.mousePressed(pb_at_ease_callback);
   // pb_salute.mousePressed(pb_salute_callback);
   pb_stand_up_shot.mousePressed(pb_stand_up_shot_callback);

   // pb_option.mousePressed(pb_attention_callback);
}
function pb_attention_callback() {
   resultLabel = '차렷';
   getString(resultLabel);
   // modelChange_1();
}
function pb_at_ease_callback() {
   resultLabel = '열중쉬어';
   getString(resultLabel);
   // modelChange_1();
}
function pb_stand_up_shot_callback() {
   resultLabel = '서서쏴';
   getString(resultLabel);
   // modelChange_2();
}
function pb_salute_callback() {
   resultLabel = '경례';
   getString(resultLabel);
   // modelChange_2();
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
* Math
************************************************************************************/

function EuclideanDistance(x1, x2, y1, y2) {
   return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}
 /********************************************************************************************
* Code End
************************************************************************************/