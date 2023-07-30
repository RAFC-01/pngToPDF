const fs = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.tauri;
let fileNumber = 0;
document.addEventListener('mousedown', (e)=> {
    if (e.target.className == 'image'){
        let img = e.target.children[1];
        let src = img.src;
        let name = img.dataset.name;
        let obj = [{src: src, name: name}];
        downloadPDFfromImages(obj);
    }
    if (e.target.id == 'pdfAllBtn'){
        let srcList = [];

        const imgs = document.querySelectorAll('.image');
        for (let img of imgs){
            let elem = img.children[1];
            let obj = {
                src: elem.src,
                name: elem.dataset.name
            }
            srcList.push(obj);
        }
        // console.log(srcList)
        downloadPDFfromImages(srcList);
    }
    if (e.target.id == 'clearAllBtn'){
        clearAllImages();
    }
        
})
async function saveFile(pdfBytes, name){
    try {
        console.log(name);
        const uint8Array = new Uint8Array(pdfBytes); // Convert pdfBytes to Uint8Array
        const response = await invoke('save_pdf', {
            pdf: Array.from(uint8Array), // Convert Uint8Array to an array of numbers
            name: name,
        });
        console.log('PDF file saved successfully!', response);
    } catch (error) {
        console.error('Error saving PDF file:', error);
    }
    
}
async function downloadPDFfromImages(array){ // {src, name}
    let name = array.length > 1 ? 'merged-pdfs' : array[0].name;
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
    saveFile(pdfBytes, name);
}
let moduleData;
async function getModuleData(){
    let data = await import('./main.js');
    moduleData = data;
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
getModuleData();
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
    console.log(key);
    if (key == 'f5') e.preventDefault();
    if (key == 'delete') {
        e.preventDefault();
        if (document.getElementById('clearAllBtn').style.display != 'none') clearAllImages();
    }
})