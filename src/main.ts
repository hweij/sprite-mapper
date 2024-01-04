const SHEET_WIDTH = 512;
const SHEET_HEIGHT = 512;

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

/** App version is injected from the vite configuration file */
declare const __APP_VERSION__: string;
document.title = `Sprite Mapper ${__APP_VERSION__}`;

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
  const files = items.filter(item => (item.kind === "file")).map(item => item.getAsFile()!);
  files.sort((a, b) => a.name.localeCompare(b.name));
  for (const file of files) {
    console.log(`File ${file.name}`);
    console.log(file.type);
    try {
      const img = await loadImage(file);
      img.style.backgroundColor = colors[colorIndex];
      iconView.appendChild(img);
      const dim = document.createElement("div");
      dim.innerText = `${img.width} x ${img.height}`;
      iconView.appendChild(dim);
      const desc = document.createElement("div");
      desc.innerText = file.name;
      iconView.appendChild(desc);
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
  // Sort icons, from largest to smallest
  icons.sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
  const errorText = numErrors ? ` <span style="color: red;">Errors: ${numErrors}.</span>` : '';
  divMessage.innerHTML = `${icons.length} icons in sprite sheet.${errorText}`;

  // packLinear(1, 1);
  packTree(1, 1, SHEET_WIDTH, SHEET_HEIGHT);
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


function packLinear(spritePadding: number, padding: number) {
  const spacing = spritePadding * 2;
  const borderMargin = padding * 2;
  // Simple pack, for testing
  let h = borderMargin;
  let w = borderMargin;
  let x = borderMargin;
  let y = borderMargin;
  for (const sprite of icons) {
    sprite.x = x;
    sprite.y = y;
    x += sprite.width + spacing;
    w = Math.max(x + borderMargin, w);
    h = Math.max(y + sprite.height + borderMargin, h);
  }
  console.log(`Packed: w = ${w}, h = ${h}`);

  // Create json pack info
  createPackInfo(w, h);

  console.log(jsoPack);

  drawCanvas(w, h);
}

interface PackTree {
  x: number;
  y: number;
  w: number;
  h: number;
  sprite?: SpriteLayout;
  first?: PackTree;
  second?: PackTree;
}
function packTree(spritePadding: number, padding: number, w: number, h: number) {
  const tree: PackTree = {
    x: padding,
    y: padding,
    w: w - (padding * 2),
    h: h - (padding * 2)
  }

  function add(tree: PackTree, sprite: SpriteLayout) {
    if (!tree.sprite && (tree.w >= (spritePadding * 2 + sprite.width)) && (tree.h >= (spritePadding + sprite.height))) {
      // Empty: add it at the top left
      tree.sprite = sprite;
      sprite.x = tree.x + spritePadding;
      sprite.y = tree.y + spritePadding;
      // Create child rects. Make them as "square" as possible
      const spriteWidth = 2 * spritePadding + sprite.width;
      const spriteHeight = 2 * spritePadding + sprite.height;
      const rightSpace = tree.w - spriteWidth;
      const bottomSpace = tree.h - spriteHeight;
      if (rightSpace >= bottomSpace) {
        tree.first = {
          x: tree.x + spriteWidth,
          y: tree.y,
          w: rightSpace,
          h: spriteHeight
        };
        tree.second = {
          x: tree.x,
          y: tree.y + spriteHeight,
          w: tree.w,
          h: bottomSpace
        };
      }
      else {
        tree.second = {
          x: tree.x + spriteWidth,
          y: tree.y,
          w: rightSpace,
          h: tree.h
        };
        tree.first = {
          x: tree.x,
          y: tree.y + spriteHeight,
          w: spriteWidth,
          h: bottomSpace
        };
      }
      return true;
    }
    else {
      if (tree.first && add(tree.first, sprite)) {
        return true;
      }
      if (tree.second && add(tree.second, sprite)) {
        return true;
      }
    }
    return false;
  }

  for (const sprite of icons) {
    console.log(sprite.name);
    if (!add(tree, sprite)) {
      console.log(JSON.stringify(tree, undefined, 4));
      alert("Error: did not allocate enough space for sprite");
      return;
    }
  }

  console.log(`Packed: w = ${w}, h = ${h}`);

  // Create json pack info
  createPackInfo(w, h);

  console.log(jsoPack);

  drawCanvas(w, h);
}

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

function createPackInfo(w: number, h: number) {
  const frames: { [id: string]: FrameDef; } = {};
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
  };
}

function drawCanvas(w: number, h: number) {
  // Draw into canvas
  mapCanvas.width = w;
  mapCanvas.height = h;
  const ctx = mapCanvas.getContext("2d")!;
  for (const sprite of icons) {
    ctx.drawImage(sprite.image, sprite.x, sprite.y);
  }
}


const colors = ["#cccccc", "#7f7f7f", "#000000"];
const colorSelect = document.getElementById("colorSelect")!;
var colorIndex = -1;
function populateColorSelect() {
  colors.forEach((c, i) => {
    const div = document.createElement("div");
    div.style.backgroundColor = c;
    colorSelect.appendChild(div);
    div.onclick = () => setColorIndex(i);
  });
}
function setColorIndex(i: number) {
  if (i !== colorIndex) {
    if (colorIndex >= 0) {
      const c = colorSelect.children[colorIndex] as HTMLDivElement;
      c.className = "";
    }
    colorIndex = i;
    if (colorIndex >= 0) {
      const c = colorSelect.children[colorIndex] as HTMLDivElement;
      c.className = "selected";
    }
  }
  // Update icons in list
  for (const icon of iconView.querySelectorAll<HTMLImageElement>("img")) {
    icon.style.backgroundColor = colors[colorIndex]
  }
}
populateColorSelect();
setColorIndex(0);
