import "./css/index.css";
import { getWebGLContext, reRender} from "./lib/util";
import { ZeroHollow, TriangularPrism } from "./model";
async function init() {
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let xrotinpdeg = document.getElementById("xrot") as HTMLInputElement;
    let yrotinpdeg = document.getElementById("yrot") as HTMLInputElement;
    let zrotinpdeg = document.getElementById("zrot") as HTMLInputElement;
    let gl = getWebGLContext(canvas);
    let zh =  new ZeroHollow(gl!);
    let tp =  new TriangularPrism(gl!);
    zh.rotxrad = xrotinpdeg.valueAsNumber * Math.PI / 180;
    zh.rotyrad = yrotinpdeg.valueAsNumber * Math.PI / 180;
    zh.rotzrad = zrotinpdeg.valueAsNumber * Math.PI / 180;

    tp.rotxrad = xrotinpdeg.valueAsNumber * Math.PI / 180;
    tp.rotyrad = yrotinpdeg.valueAsNumber * Math.PI / 180;
    tp.rotzrad = zrotinpdeg.valueAsNumber * Math.PI / 180;

    await zh.loadfile();
    await tp.loadfile();

    reRender(gl!, [
        tp
    ])
    xrotinpdeg.addEventListener("input", (e) => {
        zh.rotxrad = (e.target as HTMLInputElement).valueAsNumber * Math.PI / 180;
        tp.rotxrad = (e.target as HTMLInputElement).valueAsNumber * Math.PI / 180;
        reRender(gl!, [
          tp 
        ])
    })
    yrotinpdeg.addEventListener("input", (e) => {
        zh.rotyrad = (e.target as HTMLInputElement).valueAsNumber * Math.PI / 180;
        tp.rotyrad = (e.target as HTMLInputElement).valueAsNumber * Math.PI / 180;
        reRender(gl!, [
           tp
        ])
    })
    zrotinpdeg.addEventListener("input", (e) => {
        zh.rotzrad = (e.target as HTMLInputElement).valueAsNumber * Math.PI / 180;
        tp.rotzrad = (e.target as HTMLInputElement).valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            tp
        ])
    })
}
init();