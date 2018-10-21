const { dialog } = require('electron').remote;
var fs = require('fs');
var path = require('path');

function convertURI2ImageData(URI) {
  return new Promise(function(resolve, reject) {
    if (URI == null) return reject();
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var image = new Image();

    image.addEventListener('load', function() {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    }, false);

    image.src = URI;
  });
}

function saveURI2Buffer(URI) {
  return new Buffer(URI.replace(/^data:image\/\w+;base64,/, ""), 'base64');
}

var shifted = false;
var flipped = false;

var logo = new Image();
logo.src = 'logo.jpg';

var qrBlock = document.getElementById("qrBlock");
var textBlock = document.getElementById('textBlock');
var imageBlock = document.getElementById('imageBlock');
var imageBlockWrapper = document.getElementById('imageBlockWrapper');
var correctionSelect = document.getElementById('correctionSelect');
var correctionInfoBlock = document.getElementById('correctionInfo');
var versionInfoBlock = document.getElementById('versionInfo');
var logoCheckBox = document.getElementById('logoCheckBox');
var logoBlock = document.getElementById('logoBlock');
var canvas = qrBlock.firstElementChild;

var correctionDict = {
  "L" : "低（L）",
  "M" : "中（M）",
  "Q" : "高（Q）",
  "H" : "极高（H）"
};
var correctionArray = ["M", "L", "H", "Q"];
var correctionLevel = 0;

function makeCode() {
  qrBlock.innerHTML = '';

  correctionLevel = logoCheckBox.checked ? 2 : correctionArray.findIndex(function (c) {
    return c == correctionSelect.value;
  });
  
  var qr = new QRCode(qrBlock, {
    text: textBlock.value,
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: correctionLevel
  });

  if (logoCheckBox.checked) {
    qrBlock.childNodes[0].getContext('2d').drawImage(logo, 92, 92, 70, 70);
    qrBlock.childNodes[1].src = qrBlock.childNodes[0].toDataURL();
  }
  
  correctionInfoBlock.innerText = "容错级别：" + correctionDict[correctionArray[correctionLevel]];
  versionInfoBlock.innerText = "QR 版本：" + qr._oQRCode.typeNumber;  

  return qr;
}

var moreButtonClicked = function() {
  document.querySelectorAll('.optionBlock').forEach(function(i) {
    i.classList.toggle('shown');
  });

  document.querySelector('.card').classList.toggle('shown');
  document.querySelector('#correctionForm').classList.toggle('shown');
}

var leftButtonClicked = function() {
  if (shifted) rightButtonClicked();
  else if (textBlock.value == "") return;
  else {
    flipBack();
    makeCode();
  }
}

var flipBack = function() {
  document.querySelector('.card').classList.toggle('flipped');
  document.querySelector('.circleButton.flippable').classList.toggle('flipped');
  document.querySelector('.circleButton.alterLeft').classList.toggle('shifted');

  flipped = !flipped;
}

var handleDragOver = function(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function handleFileSelect(e) {
  e.stopPropagation();
  e.preventDefault();

  var file = e.dataTransfer.files[0];
  var reader = new FileReader();
  reader.readAsText(file);

  reader.onload = (function(f) {
    return function(e) {
      textBlock.value = e.target.result;
    };
  }) (file);
}

function handleImageSelect(e) {
  e.stopPropagation();
  e.preventDefault();

  var file = e.dataTransfer.files[0];

  if (!file.type.match('image.*')) {
    alert("拖入的文件不是图片，请拖入图片进行识别");
    return false;
  }

  var reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (function(f) {
    return function(e) {
      var imageDataURI = e.target.result;

      convertURI2ImageData(imageDataURI).then(function(imageData) {
        var code = new jsQR(imageData.data, imageData.width, imageData.height);
        if (code) imageBlock.innerText = code.data;
      });            
    };
  }) (file);
}

function handleLogoSelect(e) {
  e.stopPropagation();
  e.preventDefault();

  var file = e.dataTransfer.files[0];

  if (!file.type.match('image.*')) {
    alert("拖入的文件不是图片，请拖入图片进行识别");
    return false;
  }

  var reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (function(f) {
    return function(e) {
      logo.src = e.target.result;
      var img = document.createElement("img");
      img.classList.add("logo");
      img.src = e.target.result;
      logoBlock.innerHTML = img.outerHTML;
    };
  }) (file);
}


function rightButtonClicked() {
  document.querySelectorAll('.card').forEach(function(i) {
    i.classList.toggle('shifted');
  });

  document.querySelectorAll('.circleButton').forEach(function(i) {
    i.classList.toggle('shifted');
  });

  if (!flipped) document.querySelector('.circleButton.alterLeft').classList.toggle('shifted');

  shifted = !shifted;
}

function alterLeftButtonClicked() {
  var targetPath = path.format({
    dir: dialog.showOpenDialog({properties: ['openDirectory']}),
    base: new Date().getTime() + '.png'
  });
  
  fs.writeFileSync(targetPath, saveURI2Buffer(qrBlock.childNodes[1].src));
}

function alterRightButtonClicked() {
  var targetPath = path.format({
    dir: dialog.showOpenDialog({properties: ['openDirectory']}),
    base: new Date().getTime() + '.txt'
  });

  fs.writeFileSync(targetPath, imageBlock.innerText);
}

textBlock.addEventListener('dragover', handleDragOver, false);
textBlock.addEventListener('drop', handleFileSelect, false);
imageBlockWrapper.addEventListener('dragover', handleDragOver, false);
imageBlockWrapper.addEventListener('drop', handleImageSelect, false);
logoBlock.addEventListener('dragover', handleDragOver, false);
logoBlock.addEventListener('drop', handleLogoSelect, false);
