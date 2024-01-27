// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: phone-volume;

const version = 3;
const version2 = "1.0.0";

const checkTimeSecond = 600 // 5분 마다 갱신
// fm = FileManager.local()
fm = FileManager.iCloud();

// 스크립트 자동업데이트 
const serverVersionCheckUrl = "https://raw.githubusercontent.com/hansu35/scriptable_liivm/main/version";
const serverContentUrl = "https://raw.githubusercontent.com/hansu35/scriptable_liivm/main/liivm.js";
var minVer = parseInt(await new Request(serverVersionCheckUrl).loadString());
console.log(minVer);
if(version < minVer){
	var code = await new Request(serverContentUrl).loadString();
	fm.writeString(fm.joinPath(fm.documentsDirectory(), Script.name() + ".js"), code);
	return 0;
}


var colors = {
	background:"#333333",
	background_status:"#ffffff33",
	text:{		
		primary:"#ffffffaa",
		disabled:"#ffffff33"
	},
	gage:{
		background:"#333355",
		useage:"#2BD82E",
		border:"#cccccc55",
	}
}

// 설정 파일 위치 확인.
const accountFilePath = fm.joinPath(fm.documentsDirectory(), "liivmAccount.txt");

if(!fm.fileExists(accountFilePath)){
	if(config.runsInApp){
		let alert = new Alert();
		alert.message = "설정 파일을 만들어 주세요"
		alert.addAction("확인");
		await alert.present();
	} else {
		let w = new ListWidget();
	
		w.setPadding(5,5,5,5);
		w.backgroundColor = new Color(colors.background);
		let stack = w.addStack();
		stack.setPadding(5,5,5,5);

		let lText = stack.addText("설정 파일을 만들어 주세요");
		lText.textColor = new Color(colors.text.primary);
		lText.textOpacity = 0.9
		lText.font = Font.systemFont(16)
		lText.centerAlignText();

		Script.setWidget(w);
		w.presentSmall();
		Script.complete();
	}
	return 0
}
//설정 파일 다운로드
fm.downloadFileFromiCloud(accountFilePath);
//설정파일 읽어오기
var accountInfo = JSON.parse(fm.readString(accountFilePath));
let liivmDataString = await getDataUsage();
var liivmAccountDataInfo = {
	call:"", sms:"", data:{}, addedData:{}, addedCall:"", latestTimecheck:""
}

let widgetSize = computeWidgetSize();

dataProccess(liivmDataString, liivmAccountDataInfo);

let widget = new ListWidget();
widget.setPadding(5,5,5,5);
widget.backgroundColor = new Color(colors.background);
widget.refreshAfterDate = new Date(Date.now() + 1000 * checkTimeSecond) // 지정한 시간마다 한번씩 갱신.

draw(widget, liivmAccountDataInfo);

Script.setWidget(widget);
widget.presentSmall();
Script.complete();	







/////////////////
// 함수들 
/////////////////


// 초를 분으로 변경 75초 -> 1분 15초
function timeToString(timeString){
	var result = "";
	var timeNumber = Number(timeString);
	var min = 0;
	var second = timeNumber;
	if ( timeNumber > 60){
		min = (timeNumber / 60).toFixed(0);
		second = timeNumber - (min * 60);
		result = ""+ min + "분 ";
	}
	if( second > 0 || result == ""){ result = result + second +"초";}
	return result;
}
function dataProccess(dataString, dataObject){
	let liivmDataJson = JSON.parse(dataString);
	liivmDataJson.data.dsGetEntrSvcSmry.forEach((oneData)=>{
		if(oneData.svcTypCd == 'VM'){
			console.log('부가통화');
			console.log(oneData.alloValue+'////'+oneData.useValue);
			dataObject.addedCall = "부가통화 : " + timeToString(oneData.useValue);
			if(oneData.alloValue != 'Z'){ dataObject.addedCall = dataObject.addedCall + " / " +  timeToString(oneData.alloValue); }
		}
		if(oneData.svcTypCd == 'VC'){
			console.log('통화');
			console.log(oneData.alloValue+'////'+oneData.useValue);
			dataObject.call = "통화 : " + timeToString(oneData.useValue)
		}
		if(oneData.svcTypCd == 'SS'){
			console.log('문자');
			console.log(oneData.alloValue+'////'+oneData.useValue);
			dataObject.sms = "문자 : " + oneData.useValue + "건";
		}
		if(oneData.svcTypCd == 'PT'){
			if(oneData.prodTypeCd == 'A2'){
				console.log('기본데이터');
				console.log(oneData.alloValue+'////'+oneData.useValue);
				dataObject.data = oneData;
			} else {
				console.log('추가데이터');
				console.log(oneData.alloValue+'////'+oneData.useValue);
				dataObject.addedData = oneData;
			}
		}
		if(oneData.lastUseDttm != ""){
			if(dataObject.latestTimecheck == "" || dataObject.latestTimecheck < oneData.lastUseDttm) dataObject.latestTimecheck = oneData.lastUseDttm;
		}
	});
	if(dataObject.latestTimecheck == "" || dataObject.latestTimecheck == undefined){
		dataObject.latestTimecheck = "없음"
	} else {
		let now = new Date()
		let last = new Date(
			dataObject.latestTimecheck.substring(0, 4),
			Number(dataObject.latestTimecheck.substring(4, 6))-1,
			dataObject.latestTimecheck.substring(6, 8),
			dataObject.latestTimecheck.substring(8, 10),
			dataObject.latestTimecheck.substring(10, 12),
			dataObject.latestTimecheck.substring(12, 14)
		)
		timeDiff = Math.round((Math.abs(now - last))/(1000 * 60));
		
		if (timeDiff < 60 ) dataObject.latestTimecheck = timeDiff + "분 전";
		else if (timeDiff < 1440 ) dataObject.latestTimecheck = Math.floor(timeDiff/60) + "시간 전";
		else dataObject.latestTimecheck = Math.floor(timeDiff/1440) + "일 전";

	}
	

}

function draw(widget, dataObject){
	// 값을 하나씩 정리해서 넣어 준다. 
	addTextStack(widget, dataObject.call);
	addTextStack(widget, dataObject.addedCall);
	addTextStack(widget, dataObject.sms);
	addGage(widget, dataObject.data);
	addGage(widget, dataObject.addedData);


	let stack = widget.addStack();
	stack.setPadding(5,5,5,5);

	// 가장 마지막에 요금제 체크된 시간 작성.
	let lText = stack.addText(dataObject.latestTimecheck)
	lText.textColor = new Color(colors.text.primary);
	lText.textOpacity = 0.9
	lText.font = Font.systemFont(9)
	lText.leftAlignText()
	stack.addSpacer(null)

	// 위젯에서 데이터를 확인한 시작 작성.
	let now = new Date()
	const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit'});
	const formattedTime = formatter.format(now);
	console.log(formattedTime);

	let NText = stack.addText(formattedTime)
	NText.textColor = new Color(colors.text.primary);
	NText.textOpacity = 0.9
	NText.font = Font.systemFont(9)
	NText.leftAlignText()
}

function addTextStack (widget, data){
	let stack = widget.addStack();
	stack.size = new Size(widgetSize.width,widgetSize.height*0.15);
	stack.centerAlignContent();

	stack.setPadding(5,5,0,0);
	let text = stack.addText(data)
	text.textColor = new Color(colors.text.primary);
	text.textOpacity = 0.9
	text.font = Font.systemFont(12)
	text.leftAlignText()
	stack.addSpacer(null)
}
function addGage (widget, data){
	let stack = widget.addStack();

	//게이지는 적당히 나눠 줘야 한다. 
	let totalAllowValue = getDataLargeUnit(Number(data.alloValue))
	let availableValue = getDataLargeUnit(Number(data.alloValue) - Number(data.useValue))
	// let totalUseValue = getDataLargeUnit(Number(data.useValue))
	let availablePercent = ((Number(data.alloValue) - Number(data.useValue)) / Number(data.alloValue) * 100 ).toFixed(2)


	var showText = availableValue + " / " +  totalAllowValue + " (" +availablePercent +"%)"
	// 무제한이 아니면 총 제한 용량도 뿌려준다. 
	stack.size = new Size(widgetSize.width,widgetSize.height*0.10);
	stack.centerAlignContent();
	stack.setPadding(5,5,5,5);
	let text = stack.addText(showText)
	text.textColor = new Color(colors.text.primary);
	text.textOpacity = 0.6
	text.font = Font.systemFont(9)
	text.leftAlignText()
	stack.addSpacer(null)

	console.log(showText)

	//게이지 그리기 
	let stackGage = widget.addStack();
	var gWidth = widgetSize.width-6;
	var gHeight = widgetSize.height*0.08
	console.log('게이지 사이즈 ')
	console.log(gWidth)
	console.log(gHeight)
	var gPath = new Path();
	gPath.addRoundedRect(new Rect(1,1,gWidth,gHeight),7,7);
	let myDrawContext = new DrawContext();
	myDrawContext.opaque = false;
	myDrawContext.size = new Size(gWidth+2,gHeight+2);
	// draw the background
	myDrawContext.addPath(gPath);
	myDrawContext.setFillColor(new Color(colors.gage.background));
	myDrawContext.fillPath();

	if(availablePercent > 1){
		let available = new DrawContext()  ;
		available.opaque = false;
		available.size = new Size(gWidth*availablePercent/100,gHeight);

		available.setFillColor(new Color(colors.gage.useage));
		available.addPath(gPath);
		available.fillPath();
						
		myDrawContext.drawImageAtPoint(available.getImage(),new Point(0,0));
	}

	// add a final stroke to the whole thing
	myDrawContext.addPath(gPath);// have to add the path again for some reason
	myDrawContext.setStrokeColor(new Color(colors.gage.border));
	myDrawContext.setLineWidth(1);
	myDrawContext.strokePath();

	stackGage.addImage(myDrawContext.getImage());
}

function getDataLargeUnit(bytes){
	//2097152
	//기가 보다 크다면 기가 단위로 보여준다. 
	if (bytes > 1000000) return "" + (bytes/ 1048576).toFixed(1) + "GB";
	//메가 단위보다 크다면 메가 단위로 보여준다. 
	if (bytes > 1000) return "" + (bytes/ 1024).toFixed(0) + "MB";
	return "" + bytes + "B";
}


async function getDataUsage()
{
	// Post login data
	let req = new Request('https://www.liivm.com/appIf/v1/uplus/esb/APIM0030');
	req.method = 'POST';
	req.body = getRequestBodyString();
	var resp = await req.loadString();
	if(req.response.statusCode == 200){
		return resp;
	} 
	throw new Error("Failed to load data");
}

// 사용자의 요청 내용을 만들어 준다. 
function getRequestBodyString(){
	//현재 달을 구한다 202401 과 같은 식으로 구한다. 
	// javascript의 해는 2000년은 100+ 십자리 년도 1900년은 10의자리 년도 1900년 이전은 음수로 표시한다. 따라서 1900을 더하면 원하는 숫자가 나온다. 
	let thisMonth = new Date();
	let thisMonthString = "" + (thisMonth.getYear()+1900) + ((thisMonth.getMonth() > 8)? "": "0") +(thisMonth.getMonth()+1)

	let requestBodyPrefix = 'kTgxzN108I2Wy0yGt6d8djEboDFj5ptz';
	let requestBodysuffix = 'LplrUcKmM6Lw2iqVbI3qEY0F3qZSesvD';

	var requestObject = {
		"serviceId":"APIM0030",
		"data":{
			"header":{
				"prodNo":btoa(accountInfo.prodNo),
				"entrCntcId":btoa(accountInfo.entrCntcId),
				"entrId":btoa(accountInfo.entrId),
				"billAcntId":btoa(accountInfo.billAcntId)
			},
			"query":{
				"callYyyymm":thisMonthString,
				"wrkTypCd":"1",
				"mrktId":"KBM"
			}
		}
	};

	//요청이 필요한 내용중 월만 빼고 나머지는 그대로 작성해주고 요청월을 변경해서 base64인코딩을 해준다. 
	let raqeustBodyString = requestBodyPrefix + btoa(JSON.stringify(requestObject)) + requestBodysuffix;

	console.log(raqeustBodyString);	
	return raqeustBodyString;
}

function computeWidgetSize(){
	deviceScreen = Device.screenSize()
	console.log('화면크기')
	console.log(deviceScreen.width)
	
	let gutter_size = ((deviceScreen.width - 240) /5) // if we know the size of the screen, and the size of icons, we can estimate the gutter size
	var widgetSize = new Size(gutter_size + 110, gutter_size + 110) // small widget size
	widgetSize.gutter_size = gutter_size;

	// var widgetSizing = debug_size;		
	// if (config.widgetFamily != null){
	// 	widgetSizing = config.widgetFamily;
	// }
	// switch (widgetSizing){
	// 	case "medium":
	// 		widgetSize = new Size(gutter_size*3 + 220, gutter_size + 110) // medium widget size
	// 		break;
	// 	case "large":
	// 		widgetSize = new Size(gutter_size*3 + 220, gutter_size*3 + 220) // large widget size
	// 		break;	
	// }

	return widgetSize
}










