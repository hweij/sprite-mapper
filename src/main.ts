const iconView = document.getElementById("iconView")!;
const mapCanvas = document.getElementById("mapCanvas")!;
const divMessage = document.getElementById("divMessage")!;

// Make the demo a drop zone for loading json
mapCanvas.ondrop = (evt) => {
  // Prevent file from being opened
  evt.preventDefault();

  if (evt.dataTransfer?.items) {
    const items = Array.from(evt.dataTransfer.items);
    processDataTransfer(items);
  }
}

var numErrors = 0;
var icons: HTMLImageElement[] = [];
var padding = 2;

async function processDataTransfer(items: DataTransferItem[]) {
  icons = [];
  iconView.innerHTML = "";
  console.log(items);
  const files = [];
  for (const item of items) {
    if (item.kind === "file") {
      files.push(item.getAsFile())
    }
  }
  for (const file of files) {
    if (file) {
      console.log(`File ${file.name}`);
      console.log(file.type);
      try {
        const img = await loadImage(file);
        iconView.appendChild(img);
        console.log(`image size: ${img.width} x ${img.height}`);
        icons.push(img);
      }
      catch (e) {
        numErrors++;
        console.error(`Cannot load image ${file.name}`);
        if (file.type === "image/svg+xml") {
          console.log("For SVG file, make sure the xml namespace is included: xmlns=\"http://www.w3.org/2000/svg\"");
        }
        console.log(e);
      }
    }
  }
  const errorText = numErrors ? ` <span style="color: red;">Errors: ${numErrors}.</span>` : '';
  divMessage.innerHTML = `Added ${icons.length} icons.${errorText}`;

}

mapCanvas.ondragover = (evt) => {
  // Prevent file from being opened
  evt.preventDefault();
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    }
    img.onerror = reject;
    img.src = url;
  });
}