const execSync = require('child_process').execSync;
const fs = require('fs');
const sassCmd = 'sass';
let debug = false;

//复制文件
const copyFile = function(sourceFile, outFile){
  if(fs.existsSync(sourceFile)){
    fs.copyFileSync(sourceFile,outFile);
    if(debug){
      console.log(`复制文件： ${sourceFile} => ${outFile}`);
    }
  }else{
    if(debug){
      console.log('源文件不存在无需拷贝', sourceFile);
    }
  }
}

//scss转换为css
const scss2Css = function(sourceFile, outFile){
  const cmdList =  [sassCmd];
  cmdList.push('--style compressed');
  cmdList.push('--no-source-map');
  cmdList.push('--no-charset');
  cmdList.push(`${sourceFile} ${outFile}`);
  try {
    execSync(cmdList.join(' '));
    if(debug){
      console.log(`scss转换： ${sourceFile} => ${outFile}`);
    }
  } catch (err) {
    return console.error('sass编译出错：', err.stdout.toString());
  }
}

//导出所有的编译工具
module.exports = {
  scss2Css,
  copyFile
}
