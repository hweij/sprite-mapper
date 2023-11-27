const iconView = document.getElementById("iconView")!;
const mapCanvas = document.getElementById("mapCanvas") as HTMLCanvasElement;
const divMessage = document.getElementById("divMessage")!;
const bSave = document.getElementById("bSave")!;


interface SpriteLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  name: string;
  image: HTMLImageElement;
}

interface FrameDef {
  frame: {
    x: number,
    y: number,
    w: number,
    h: number
  },
  rotated: false,
  trimmed: false,
  spriteSourceSize: {
    x: number,
    y: number,
    w: number,
    h: number
  },
  sourceSize: {
    w: number,
    h: number
  }
}

// Make the demo a drop zone for loading json
mapCanvas.ondrop = (evt) => {
  // Prevent file from being opened
  evt.preventDefault();

  if (evt.dataTransfer?.items) {
    const items = Array.from(evt.dataTransfer.items);
    processDataTransfer(items);
  }
}

mapCanvas.ondragover = (evt) => {
  // Prevent file from being opened
  evt.preventDefault();
}

bSave.onclick = () => {
  {
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = mapCanvas.toDataURL("image/png");
    link.click();
  }
  {
    const file = new Blob([JSON.stringify(jsoPack)], { type: 'application/json' });
    const link = document.createElement("a");
    link.download = "image.json";
    link.href = window.URL.createObjectURL(file);
    link.click();
  }
}

var numErrors = 0;
var icons: SpriteLayout[] = [];
var padding = 2;
var jsoPack: object;

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
        icons.push({ width: img.width, height: img.height, x: 0, y: 0, name: stripExtension(file.name), image: img });
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
  // Sort icons, from largest to smallest
  icons.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
  const errorText = numErrors ? ` <span style="color: red;">Errors: ${numErrors}.</span>` : '';
  divMessage.innerHTML = `Added ${icons.length} icons.${errorText}`;

  pack(2, 2);
}

function stripExtension(s: string) {
  const idx = s.indexOf(".");
  if (idx >= 0) {
    return s.substring(0, idx);
  }
  else {
    return s;
  }
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


function pack(spacing: number, padding: number) {
  // Simple pack, for testing
  let h = padding;
  let w = padding;
  let x = padding;
  let y = padding;
  for (const sprite of icons) {
    sprite.x = x;
    sprite.y = y;
    x += sprite.width + spacing;
    w = Math.max(x + padding, w);
    h = Math.max(y + sprite.height + padding, h);
  }
  console.log(`Packed: w = ${w}, h = ${h}`);

  function toFrame(sprite: SpriteLayout): FrameDef {
    return {
      frame: {
        x: sprite.x,
        y: sprite.y,
        w: sprite.width,
        h: sprite.height
      },
      rotated: false,
      trimmed: false,
      spriteSourceSize: {
        x: 0,
        y: 0,
        w: sprite.width,
        h: sprite.height
      },
      sourceSize: {
        w: sprite.width, h: sprite.height
      }
    }
  }


  // Create json pack info
  const frames: { [id: string]: FrameDef } = {};
  for (const sprite of icons) {
    frames[sprite.name] = toFrame(sprite);
  }
  jsoPack = {
    frames,
    meta: {
      "app": "Sprite Mapper",
      "version": "0.1",
      "image": "icons.png",
      "format": "RGBA8888",
      "size": {
        "w": w,
        "h": h
      },
      "scale": "1"
    }
  }

  console.log(jsoPack);

  // Pack into canvas
  mapCanvas.width = w;
  mapCanvas.height = h;
  const ctx = mapCanvas.getContext("2d")!;
  for (const sprite of icons) {
    ctx.drawImage(sprite.image, sprite.x, sprite.y);
  }
}