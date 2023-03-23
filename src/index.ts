import "./css/index.css";
import {getWebGLContext, reRender} from "./lib/util";
import {TriangularPrism, ZeroHollow} from "./model";
import {CameraMode, Shape} from "./lib/baseClass";

async function init() {
    let isAnimating = false;
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let camselection = document.getElementById("cam-selection") as HTMLSelectElement;
    let shapeselection = document.getElementById("shape-selection") as HTMLSelectElement;
    let camxrot = document.getElementById("cam-xrot") as HTMLInputElement;
    let camyrot = document.getElementById("cam-yrot") as HTMLInputElement;
    let camzrot = document.getElementById("cam-zrot") as HTMLInputElement;
    let camzoom = document.getElementById("cam-zoom") as HTMLInputElement;
    let animateswitch = document.getElementById("toggle-anim") as HTMLInputElement;
    let objxrot = document.getElementById("obj-xrot") as HTMLInputElement;
    let objyrot = document.getElementById("obj-yrot") as HTMLInputElement;
    let objzrot = document.getElementById("obj-zrot") as HTMLInputElement;
    let objxtrans = document.getElementById("obj-xtrans") as HTMLInputElement;
    let objytrans = document.getElementById("obj-ytrans") as HTMLInputElement;
    let objztrans = document.getElementById("obj-ztrans") as HTMLInputElement;
    let objxscale = document.getElementById("obj-xscale") as HTMLInputElement;
    let objyscale = document.getElementById("obj-yscale") as HTMLInputElement;
    let objzscale = document.getElementById("obj-zscale") as HTMLInputElement;
    let resetValues = () => {
        camxrot.valueAsNumber = 0;
        camyrot.valueAsNumber = 0;
        camzrot.valueAsNumber = 0;
        camzoom.valueAsNumber = 1;
        objxrot.valueAsNumber = 0;
        objyrot.valueAsNumber = 0;
        objzrot.valueAsNumber = 0;
        objxtrans.valueAsNumber = 0;
        objytrans.valueAsNumber = 0;
        objztrans.valueAsNumber = 0;
        objxscale.valueAsNumber = 1;
        objyscale.valueAsNumber = 1;
        objzscale.valueAsNumber = 1;
        if (shapeselection.value === "zero-hollow") {
            zh.resetparams()
        } else if (shapeselection.value === "triangular-prism") {
            tp.resetparams()
        }
    }

    animateswitch.checked = isAnimating;
    let gl = getWebGLContext(canvas);
    let zh =  new ZeroHollow(gl!)
    await zh.loadfile();
    let tp =  new TriangularPrism(gl!)
    await tp.loadfile();
    let whatToRender = (): Shape => {
        if (shapeselection.value === "zero-hollow") {
            return zh;
        } else if (shapeselection.value === "triangular-prism") {
            return tp;
        } else {
            return zh;
        }
    }
    let renderedShape = whatToRender();
    shapeselection.addEventListener("change", () => {
        resetValues();
        renderedShape = whatToRender();
        reRender(gl!, [
            renderedShape
        ])
    })
    reRender(gl!, [
        renderedShape
    ])
    // animate

    let animstep = 0.01;
    setInterval(() => {
        if (!isAnimating) {
            return;
        }
        let radxanim = objxrot.valueAsNumber * Math.PI / 180;
        let radyanim = objyrot.valueAsNumber * Math.PI / 180;
        let radzanim = objzrot.valueAsNumber * Math.PI / 180;
        renderedShape.rotxrad = radxanim;
        renderedShape.rotyrad = radyanim;
        renderedShape.rotzrad = radzanim;
        radxanim += animstep;
        radyanim += animstep;
        radzanim += animstep;
        radxanim %= 2 * Math.PI;
        radyanim %= 2 * Math.PI;
        radzanim %= 2 * Math.PI;
        reRender(gl!, [
            renderedShape
        ])
        objxrot.valueAsNumber = radxanim * 180 / Math.PI;
        objyrot.valueAsNumber = radyanim * 180 / Math.PI;
        objzrot.valueAsNumber = radzanim * 180 / Math.PI;
    }, 15)
    animateswitch.addEventListener("change", () => {
        isAnimating = !isAnimating;
        animateswitch.checked = isAnimating;
    })
    // control
    camselection.addEventListener("change", () => {
        resetValues();
        if (camselection.value == "pers-cam-mode") {
            renderedShape.camMode = CameraMode.Perspective;
        } else if (camselection.value == "oblique-cam-mode") {
            renderedShape.camMode = CameraMode.Oblique;
        } else {
            renderedShape.camMode = CameraMode.Ortho;
        }
        reRender(gl!, [
            renderedShape
        ])
    })
    camxrot.addEventListener("input", () => {
        if (renderedShape.camMode == CameraMode.Ortho) {
            renderedShape.orthoInstance.rotxrad = camxrot.valueAsNumber * Math.PI / 180;
        } else if (renderedShape.camMode == CameraMode.Perspective) {
            renderedShape.perspectiveInstance.rotxrad = camxrot.valueAsNumber * Math.PI / 180;
        } else if (renderedShape.camMode == CameraMode.Oblique) {
            renderedShape.obliqueInstance.rotxrad = camxrot.valueAsNumber * Math.PI / 180;
        }
        reRender(gl!, [
            renderedShape
        ])
    })
    camyrot.addEventListener("input", () => {
        if (renderedShape.camMode == CameraMode.Ortho) {
            renderedShape.orthoInstance.rotyrad = camyrot.valueAsNumber * Math.PI / 180;
        } else if (renderedShape.camMode == CameraMode.Perspective) {
            renderedShape.perspectiveInstance.rotyrad = camyrot.valueAsNumber * Math.PI / 180;
        } else if (renderedShape.camMode == CameraMode.Oblique) {
            renderedShape.obliqueInstance.rotyrad = camyrot.valueAsNumber * Math.PI / 180;
        }
        reRender(gl!, [
            renderedShape
        ])
    })
    camzrot.addEventListener("input", () => {
        if (renderedShape.camMode == CameraMode.Ortho) {
            renderedShape.orthoInstance.rotzrad = camzrot.valueAsNumber * Math.PI / 180;
        } else if (renderedShape.camMode == CameraMode.Perspective) {
            renderedShape.perspectiveInstance.rotzrad = camzrot.valueAsNumber * Math.PI / 180;
        } else if (renderedShape.camMode == CameraMode.Oblique) {
            renderedShape.obliqueInstance.rotzrad = camzrot.valueAsNumber * Math.PI / 180;
        }
        reRender(gl!, [
            renderedShape
        ])
    })
    camzoom.addEventListener("input", () => {
        if (renderedShape.camMode == CameraMode.Ortho) {
            renderedShape.orthoInstance.zoom = camzoom.valueAsNumber;
        } else if (renderedShape.camMode == CameraMode.Perspective) {
            renderedShape.perspectiveInstance.zoom = camzoom.valueAsNumber;
        } else if (renderedShape.camMode == CameraMode.Oblique) {
            renderedShape.obliqueInstance.zoom = camzoom.valueAsNumber;
        }
        reRender(gl!, [
            renderedShape
        ])
    })
    objxrot.addEventListener("input", () => {
        renderedShape.rotxrad = objxrot.valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            renderedShape
        ])
    })
    objyrot.addEventListener("input", () => {
        renderedShape.rotyrad = objyrot.valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            renderedShape
        ])
    })
    objzrot.addEventListener("input", () => {
        renderedShape.rotzrad = objzrot.valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            renderedShape
        ])
    })
    objxtrans.addEventListener("input", () => {
        renderedShape.translatex = objxtrans.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objytrans.addEventListener("input", () => {
        renderedShape.translatey = objytrans.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objztrans.addEventListener("input", () => {
        renderedShape.translatez = objztrans.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objxscale.addEventListener("input", () => {
        renderedShape.scalex = objxscale.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objyscale.addEventListener("input", () => {
        renderedShape.scaley = objyscale.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objzscale.addEventListener("input", () => {
        renderedShape.scalez = objzscale.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
}
init();
// let gen = new ZeroHollowGenerator()
// gen.generate(
//     -25, -25, -25,
//     50, 50, 50,
//     10)