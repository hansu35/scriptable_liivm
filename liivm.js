// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: phone-volume;

const version = 2
const version2 = "1.0.0"

// fm = FileManager.local()
fm = FileManager.iCloud()

// 스크립트 자동업데이트 
const serverVersionCheckUrl = "https://raw.githubusercontent.com/hansu35/scriptable_liivm/main/version"
const serverContentUrl = "https://raw.githubusercontent.com/hansu35/scriptable_liivm/main/liivm.js"
var minVer = parseInt(await new Request(serverVersionCheckUrl).loadString())
console.log(minVer)
if(version < minVer){
	var code = await new Request(serverContentUrl).loadString()
	console.log('업데이트')
	console.log(Script.name())
	console.log(fm.documentsDirectory())
	
	fm.writeString(fm.joinPath(fm.documentsDirectory(), Script.name() + ".js"), code)
	return 0
}





