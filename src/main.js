const { appWindow } = window.__TAURI__.window;
const { desktopDir } = window.__TAURI__.path;
const { invoke } = window.__TAURI__.tauri;
const fs = window.__TAURI__.fs;

const desktopPath = await desktopDir();
const startDirPath = desktopPath;

await appWindow.onFileDropEvent((event) => {
  if (event.payload.type === 'drop') {
    const files = event.payload.paths;
    document.getElementById('clearAllBtn').style.display = 'flex';
    // Ensure that the dropped file is a PNG file (optional, if you want to filter by file type)
    files.forEach(async (file)=> {
      console.log(file)
      if (file.endsWith('.png')) {
        try {
          // Read the dropped file as a data URL
          const imageDataURL = await fs.readBinaryFile(file, {dir: fs.BaseDirectory.Resouce})
          function uint8ArrayToDataURL(uint8Array, mimeType) {
            const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
            return `data:${mimeType};base64,${btoa(binary)}`;
          }
          // console.log('Image Data URL:', uint8ArrayToDataURL(imageDataURL, 'image/*'));
          let imageData = uint8ArrayToDataURL(imageDataURL, 'image/*');
          
  
          // Now you can use the imageDataURL as the source for displaying the image
          // For example, you can create an <img> element and set its src attribute:
          let name = file.substring(file.lastIndexOf('\\')+1);
          name = name.substring(0, name.lastIndexOf('.'));


          const nameDiv = document.createElement('div');
          nameDiv.className = 'name';
          nameDiv.innerText = name;
          const button = document.createElement('div');
          button.className = 'button';
          button.innerText = 'Download as PDF'
          const div = document.createElement('div');
          div.className = 'image';
          const img = document.createElement('img');
          img.src = imageData;
          img.dataset.name = name;
          img.setAttribute('height', '100%');
          div.append(nameDiv, img, button);
          document.getElementById("imagePreview").appendChild(div);
          document.getElementById("imagePreview").style.display = 'flex';
          document.getElementById('noImagesScreen_container').style.display = 'none';
          document.getElementById('noImagesScreen').style.height = '150px';
        } catch (error) {
          console.error('Error reading the file:', error);
        }
      } else {
        console.log('File is not a PNG.');
      }
    })
    updateMergeButton();
  }
 });
 await appWindow.setTitle('PNGtoPDF Converter!');

async function getListOfFiles(dirPath, next) {
  try {
    const fileList = await window.__TAURI__.tauri.invoke('list_files_in_dir', { dirPath });
    if (next) next(fileList);
  } catch (error) {
    console.error('Error fetching file list:', error);
    if (next) next([]);
  }
}

// Call the function whenever you need to get the list of files
getListOfFiles(startDirPath, (arr)=> {
  let array = showOnlyFiles(arr, 'pdf');
  console.log(array)
});

export {startDirPath, getListOfFiles}