const demo = document.getElementById("dropZone")!;
// Make the demo a drop zone for loading json
demo.ondrop = (evt) => {
  // Prevent file from being opened
  evt.preventDefault();

  if (evt.dataTransfer?.items) {
    const items = [...evt.dataTransfer.items];
    processFiles(items);
  }
}

async function processFiles(items: DataTransferItem[]) {
  console.log(items);
  const files = [];
  for (const item of items) {
    files.push(item.getAsFile())
  }
  for (const file of files) {
    if (file) {
      console.log(`File ${file.name}`);
      console.log(file.type);
      try {
        const img = await loadImage(file);
        document.body.appendChild(img);
        console.log(`image size: ${img.width} x ${img.height}`);
      }
      catch (e) {
        console.error(`Cannot load image ${file.name}`);
        if (file.type === "image/svg+xml") {
          console.log("For SVG file, make sure the xml namspace is included: xmlns=\"http://www.w3.org/2000/svg\"");
        }
        console.log(e);
      }
    }
  }
}

demo.ondragover = (evt) => {
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