const fs = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
let fileNumber = 0;

class SaveWindow{
    constructor(){
        this.pathHistory = [];
    }
    load(files, name, divs){
        this.currentlySaving = {files: files, name: name};
        this.savingDivs = divs;
        console.log(this.currentlySaving);
        this.open(undefined, name);
    }
    open(path, name){
        if (!path) path = moduleData.startDirPath;
        this.currentPath = path;
        const saveFileDiv = document.getElementById('saveWindowContainer');
        const filePathDivText = document.getElementById('currentDir_text');
        if (name) this.updateFileName(name);
        filePathDivText.innerText = path;
        saveFileDiv.style.display = 'flex';
        this.loadFiles(path);
    }
    close(){
        const saveFileDiv = document.getElementById('saveWindowContainer');
        saveFileDiv.style.display = 'none';
    }
    loadFiles(path){
        const filesDiv = document.getElementById('currentDir_files');

        moduleData.getListOfFiles(path, (files)=> {
            let content = '';
            files = showOnlyFiles(files, 'pdf');
            files = sortFiles(files);
            for (let file of files){
                let icon = file.isDir ? '<span><div class="folder"></div></span> ' : 
                '<div class="currentDir_pdf_icon"><img src="assets/pdf-svgrepo-com.svg" width="100%" height="100%"/></div>';
                content += `<div class='currentDir_files_file' data-isDir='${file.isDir}'>${icon} ${file.name}</div>`
            }
            filesDiv.innerHTML = content;
        })
    }
    updateFileName(name){
        // only .pdf files
        const fileName = document.querySelector('#saveLocationWindow_fileName > input')
        fileName.value = name.replace(/\.pdf/gi, '');
    }
    goIn(folderName){
        let path = this.currentPath + folderName + '\\'
        this.pathHistory = [];
        this.open(path);
    }
    goBack(){
        let canGo = charCount('\\', this.currentPath) > 1;
        if (!canGo) return;
        this.pathHistory.push(this.currentPath);
        let path = this.currentPath.substring(0, this.currentPath.length-1); // ignore last char
        path = path.substring(0, path.lastIndexOf('\\')+1)
        this.open(path);
    }     
    goForward(){
        if (!this.pathHistory.length) return;
        let path = this.pathHistory[this.pathHistory.length-1];
        this.pathHistory.splice(this.pathHistory.length-1, 1);
        this.open(path);
    }
    save(name){
        if (!this.currentlySaving || !name || !this.currentlySaving.files){
            this.close();
            return;
        }
        let path = this.currentPath + name;
        isFileAlready(path+ '.pdf', (bool)=> {
            console.log(bool);
            if (!bool){ // if file doesnt already exit
                this.saveFiles(this.currentlySaving.files, path);
                this.currentlySaving = {};
                this.close();
            }else{ // file exists
                this.askForFileReplace(name);
            }
        })
    }
    askForFileReplace(name){
        const popUp = document.getElementById('saveWindow_popupContainer');
        const text = document.getElementById('saveWindow_popup_text');
        popUp.style.display = 'flex';
        popUp.dataset.name = name;
        let filename = name.length > 23 ? 'YOUR PDF FILE' : `File "${name}.pdf"`;         
        text.innerHTML = `
            <div id="saveWindow_popup_fileName">${filename}</div> 
            <div id="saveWindow_popup_text_content">Already exists do you want to replace it?</div>
        ` 
    }
    closeReplaceAsk(){
        const popUp = document.getElementById('saveWindow_popupContainer');
        popUp.style.display = 'none';
    }
    fileReplaceRes(bool){
        if (!this.currentlySaving || !this.currentlySaving.files || !this.currentPath || !bool){
            this.closeReplaceAsk();
            return;
        }
        const name = document.getElementById('saveWindow_popupContainer').dataset.name;
        let path = this.currentPath + name;
        this.saveFiles(this.currentlySaving.files, path);
        
    }
    markDivsAsSaved(divs){
        for (let div of divs){
            div.children[0].style.display = 'flex';
        }
        showRemoveAllSavedBtn();
    }
    saveFiles(files, path){
        this.markDivsAsSaved(this.savingDivs)
        downloadPDFfromImages(files, path);
        this.currentlySaving = {};
        this.savingDivs = [];
        this.close();
        this.closeReplaceAsk();
    }
}
document.addEventListener('focus', (e)=> {
    if (e.target.id == 'saveLocationWindow_fileName_input'){
        e.target.select();
    }
})
document.addEventListener('mousedown', (e)=> {
    if (e.target.className == 'image'){
        let img = e.target.children[2];
        let src = img.src;
        let name = img.dataset.name;
        let obj = [{src: src, name: name}];
        // downloadPDFfromImages(obj);
        saveWindow.load(obj, name, [e.target]);
    }
    if (e.target.classList.contains('saveWindow_popupBtn')){
        let makeAction = e.target.dataset.action == "true";
        saveWindow.fileReplaceRes(makeAction);
    }
    if (e.target.id == 'pdfAllBtn'){
        let srcList = [];

        const imgs = document.querySelectorAll('.image');
        for (let img of imgs){
            let elem = img.children[2];
            console.log(elem)
            let obj = {
                src: elem.src,
                name: elem.dataset.name
            }
            srcList.push(obj);
        }
        // console.log(srcList)
        let name = 'multiplePDFS'
        saveWindow.load(srcList, name, imgs);
        // downloadPDFfromImages(srcList);
    }
    if (e.target.id == 'clearAllBtn'){
        clearAllImages();
    }
    if (e.target.id == 'currentDir_back'){
        saveWindow.goBack();
    }
    if (e.target.id == 'currentDir_forward'){
        saveWindow.goForward();
    }
    if (e.target.className == 'currentDir_files_file'){
        let isDir = e.target.dataset.isdir;
        console.log(isDir)
        let name = e.target.innerText;
        if (isDir == 'true'){
            saveWindow.goIn(name);
        }else{
            // select as new path
            saveWindow.updateFileName(name);
        }
    }
    if (e.target.id == 'saveWindowContainer'){
        saveWindow.close();
    }
    if (e.target.id == 'saveLocationWindow_saveBtn'){
        let name = document.querySelector('#saveLocationWindow_fileName > input').value;
        saveWindow.save(name);
    }
    if (e.target.id == 'clearAllSavedBtn'){
        removeAllSavedImgs();
    }
        
})
async function saveFile(pdfBytes, path){
    try {
        console.log(path);
        const uint8Array = new Uint8Array(pdfBytes); // Convert pdfBytes to Uint8Array
        const response = await invoke('save_pdf', {
            pdf: Array.from(uint8Array), // Convert Uint8Array to an array of numbers
            path: path,
        });
        console.log('PDF file saved successfully!', response);
    } catch (error) {
        console.error('Error saving PDF file:', error);
    }
    
}
async function downloadPDFfromImages(array, path){ // {src, name}
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (let img of array){
        const image = await pdfDoc.embedPng(img.src);
        const imagePage = pdfDoc.addPage([image.width, image.height]);
        const { height } = imagePage.getSize();
        const dims = image.scale(1);
    
        imagePage.drawImage(image, {
          x: 0,
          y: height - dims.height,
          width: dims.width,
          height: dims.height,
          opacity: 1,
        });
    }
    const pdfBytes = await pdfDoc.save();
    saveFile(pdfBytes, path);
}
let moduleData;
async function getModuleData(next){
    let data = await import('./main.js');
    moduleData = data;
    if (next) next();
}
function updateMergeButton(){
    const imgs = document.querySelectorAll('.image');
    let display = imgs.length > 0 ? 'flex' : 'none';
    document.getElementById('pdfAllBtn').style.display = display;
}
function showNoImageScreen(){
    document.getElementById('noImagesScreen_container').style.display = 'block';
    document.getElementById('noImagesScreen').style.setProperty('height', 'calc(100vh - 16px)');
}
function clearAllImages(){
    const imgs = document.querySelectorAll('.image');
    document.getElementById('clearAllBtn').style.display = 'none';
    for (let img of imgs){
        img.remove();
    }
    updateMergeButton();
    showNoImageScreen();
}
document.addEventListener('keydown', (e)=>{
    const key = e.key.toLocaleLowerCase();
    if (key == 'f5') e.preventDefault();
    if (key == 'delete') {
        e.preventDefault();
        if (document.getElementById('clearAllBtn').style.display != 'none') clearAllImages();
    }
});
function showOnlyFiles(arr, filetype){
    let newarr = [];
    for (let i = 0; i < arr.length; ++i){
        let file = arr[i];
        // console.log(!Boolean(file.isDir) && !file.name.toLowerCase().endsWith('.'+filetype) && file.name.includes('.'))
        if (!file.isDir && !file.name.toLowerCase().endsWith('.'+filetype) && file.name.includes('.')) continue;
        newarr.push(arr[i]);
    }
    return newarr;
}
let saveWindow = new SaveWindow();

getModuleData(()=> {
    // saveWindow.open();
});
function sortFiles(records){ // seperates folders from files and sorts them
    let folders = [];
    let files = [];
    for (let i = 0; i < records.length; i++){
        let record = records[i];

        if (record.isDir) folders.push(record);
        else files.push(record); 
    }
    folders.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return folders.concat(files);
}
function charCount(char, string){
    let count = 0;
    for (let i = 0; i < string.length; i++){
        if (string[i] == char) count++; 
    }
    return count;
}
function showRemoveAllSavedBtn(){
    const div = document.getElementById('clearAllSavedBtn');
    div.style.display = 'flex';
}
function hideRemoveAllSavedBtn(){
    const div = document.getElementById('clearAllSavedBtn');
    div.style.display = 'none';
}
function removeAllSavedImgs(){
    const imgs = document.querySelectorAll('.image');
    for (let img of imgs){
        console.log(img.children[0].style.display)
        if (img.children[0].style.display !== 'none' && img.children[0].style.display !== ''){
            img.remove();
        }
    }
    hideRemoveAllSavedBtn();
}
async function isFileAlready(path, next){
    try {
        console.log(path);
        const fileExist = await window.__TAURI__.tauri.invoke('file_exist', { path });
        if (next) next(fileExist);
      } catch (error) {
        console.error('Error fetching file list:', error);
        if (next) next(false);
      }
}
// indicator that file has been saved
// indicator that filename does not need to include .pdf