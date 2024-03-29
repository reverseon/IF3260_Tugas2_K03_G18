import "./css/index.css";
import {getWebGLContext, reRender} from "./lib/util";
import {Tetrahedron, TriangularPrism, ZeroHollow} from "./model";
import {CameraMode, Shape} from "./lib/baseClass";

async function init() {
    let isAnimating = false;
    let isShading = false;
    let isLoaded = false;
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let camselection = document.getElementById("cam-selection") as HTMLSelectElement;
    let shapeselection = document.getElementById("shape-selection") as HTMLSelectElement;
    let camyrot = document.getElementById("cam-yrot") as HTMLInputElement;
    let camzoom = document.getElementById("cam-zoom") as HTMLInputElement;
    let animateswitch = document.getElementById("toggle-anim") as HTMLInputElement;
    let shadingswitch = document.getElementById("toggle-shading") as HTMLInputElement;
    let objxrot = document.getElementById("obj-xrot") as HTMLInputElement;
    let objyrot = document.getElementById("obj-yrot") as HTMLInputElement;
    let objzrot = document.getElementById("obj-zrot") as HTMLInputElement;
    let objxtrans = document.getElementById("obj-xtrans") as HTMLInputElement;
    let objytrans = document.getElementById("obj-ytrans") as HTMLInputElement;
    let objztrans = document.getElementById("obj-ztrans") as HTMLInputElement;
    let objxscale = document.getElementById("obj-xscale") as HTMLInputElement;
    let objyscale = document.getElementById("obj-yscale") as HTMLInputElement;
    let objzscale = document.getElementById("obj-zscale") as HTMLInputElement;
    let resetview = document.getElementById("reset-view") as HTMLInputElement;
    let jsonfile = document.getElementById("json-file") as HTMLInputElement;
    let downloadbtn = document.getElementById("download-btn") as HTMLButtonElement;
    let showhelp = document.getElementById("show-help") as HTMLButtonElement;
    let rowhelper = document.getElementById("row-helper") as HTMLDivElement;
    showhelp.addEventListener("click", () => {
        rowhelper.classList.toggle("d-none");
    })
    jsonfile.addEventListener("change", async () => {
        let file = jsonfile.files![0];
        camselection.value = "pers-cam-mode";
        let reader = new FileReader();
        reader.readAsText(file);
        resetValues()
        isAnimating = false;
        animateswitch.checked = isAnimating;
        isShading = false;
        shadingswitch.checked = isShading;
        renderedShape = null;
        isLoaded = false;
        reader.onload = async () => {
            try {
                let json = JSON.parse(reader.result as string);
                zh = new ZeroHollow(gl!)
                th = new Tetrahedron(gl!)
                tp = new TriangularPrism(gl!)
                zh.loadfile(json);
                th.loadfile(json);
                tp.loadfile(json);
                isLoaded = true;
                renderedShape = whatToRender()
                isAnimating = true;
                animateswitch.checked = isAnimating;
                isShading = true;
                shadingswitch.checked = isShading;
                console.log(renderedShape)
            } catch (e) {
                console.log(e)
                alert("Invalid JSON file");
            }
        }
        reRender(gl!, [renderedShape]);
    })
    downloadbtn.addEventListener("click", () => {
        if (!renderedShape) {
            return;
        } else {
            let zhstr: string = zh.getTransformedVerticesJSON();
            let thstr: string = th.getTransformedVerticesJSON();
            let tpstr: string = tp.getTransformedVerticesJSON();
            let zhobj = JSON.parse(zhstr);
            let thobj = JSON.parse(thstr);
            let tpobj = JSON.parse(tpstr);
            let combined = {
                ...zhobj,
                ...thobj,
                ...tpobj
            }
            let blob = new Blob([
                JSON.stringify(combined)
            ], {type: "text/plain;charset=utf-8"});
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.download = "transformed-vertices.json";
            a.href = url;
            a.click();
        }
    })
    let resetValues = () => {
        camyrot.valueAsNumber = 0;
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
        } else if (shapeselection.value === "tetrahedron") {
            th.resetparams()
        } else if (shapeselection.value === "triangular-prism") {
            tp.resetparams()
        }
    }

    animateswitch.checked = isAnimating;
    shadingswitch.checked = isShading;
    let gl = getWebGLContext(canvas);
    let zh =  new ZeroHollow(gl!)
    let th = new Tetrahedron(gl!)
    let tp = new TriangularPrism(gl!)
    let renderedShape: Shape | null = null;
    let whatToRender = (): Shape | null => {
        if (!isLoaded) {
            return null;
        }
        if (shapeselection.value === "zero-hollow") {
            return zh;
        } else if (shapeselection.value === "tetrahedron") {
            return th;
        } else if (shapeselection.value === "triangular-prism") {
            return tp;
        }
        return zh;
    }
    shapeselection.addEventListener("change", () => {
        resetValues();
        zh.camMode = CameraMode.Perspective;
        th.camMode = CameraMode.Perspective;
        tp.camMode = CameraMode.Perspective;
        zh.shading = isShading;
        th.shading = isShading;
        tp.shading = isShading;
        camselection.value = "pers-cam-mode";
        renderedShape = whatToRender();
        reRender(gl!, [
            renderedShape
        ])
    })
    // animate

    let animstep = 0.01;
    setInterval(() => {
        if (!renderedShape){
            return;
        }
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
        radxanim = radxanim > Math.PI ? radxanim - 2*Math.PI : radxanim;
        radyanim = radyanim > Math.PI ? radyanim - 2*Math.PI : radyanim;
        radzanim = radzanim > Math.PI ? radzanim - 2*Math.PI : radzanim;
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
    shadingswitch.addEventListener("change", () => {
        if (!renderedShape){
            return;
        }
        isShading = !isShading;
        shadingswitch.checked = isShading;
        renderedShape.shading = isShading;
        reRender(gl!, [
            renderedShape
        ])
    })
    resetview.addEventListener("click", () => {
        if (isAnimating) {
            isAnimating = !isAnimating;
        }
        animateswitch.checked = isAnimating;
        resetValues()
        reRender(gl!, [
            renderedShape
        ])
    });
    // control
    camselection.addEventListener("change", () => {
        if (!renderedShape){
            return;
        }
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

    camyrot.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
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

    camzoom.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
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
        if (!renderedShape){
            return;
        }
        renderedShape.rotxrad = objxrot.valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            renderedShape
        ])
    })
    objyrot.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.rotyrad = objyrot.valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            renderedShape
        ])
    })
    objzrot.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.rotzrad = objzrot.valueAsNumber * Math.PI / 180;
        reRender(gl!, [
            renderedShape
        ])
    })
    objxtrans.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.translatex = objxtrans.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objytrans.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.translatey = objytrans.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objztrans.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.translatez = objztrans.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objxscale.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.scalex = objxscale.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objyscale.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
        renderedShape.scaley = objyscale.valueAsNumber;
        reRender(gl!, [
            renderedShape
        ])
    })
    objzscale.addEventListener("input", () => {
        if (!renderedShape){
            return;
        }
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