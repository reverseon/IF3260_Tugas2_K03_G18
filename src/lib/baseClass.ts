import {m4util} from "./util";

class Point {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    getArray(): number[] {
        return [this.x, this.y, this.z, this.w];
    }
}

class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Vertex {
    position: Point;
    color: Color;
    constructor(position: Point, color: Color) {
        this.position = position;
        this.color = color;
    }
}

abstract class Shape {
    abstract center: Point;
    translatex: number = 0;
    translatey: number = 0;
    translatez: number = 0;
    rotxrad: number = 0;
    rotyrad: number = 0;
    rotzrad: number = 0;
    scalex: number = 1;
    scaley: number = 1;
    scalez: number = 1;
    program: WebGLProgram;
    camMode: CameraMode = CameraMode.Perspective;
    orthoInstance: OrthoCamera = new OrthoCamera();
    perspectiveInstance: PerspectiveCamera = new PerspectiveCamera();
    obliqueInstance: ObliqueCamera = new ObliqueCamera();
    shading: boolean = true;
    constructor(vertices: Vertex[], program: WebGLProgram) {
        this.program = program;
    }
    abstract draw(gl: WebGLRenderingContext): void;
    abstract loadfile(): void;
    resetparams(): void {
        this.translatex = 0;
        this.translatey = 0;
        this.translatez = 0;
        this.rotxrad = 0;
        this.rotyrad = 0;
        this.rotzrad = 0;
        this.scalex = 1;
        this.scaley = 1;
        this.scalez = 1;
        this.orthoInstance.resetparams();
        this.perspectiveInstance.resetparams();
        this.obliqueInstance.resetparams();
    }
}

enum CameraMode {
    Ortho,
    Perspective,
    Oblique
}

abstract class Camera {
    abstract mode: CameraMode;
    rotxrad: number = 0;
    rotyrad: number = 0;
    rotzrad: number = 0;
    translatex: number = 0;
    translatey: number = 0;
    translatez: number = 0;
    zoom: number = 1;

    focus: Point = new Point(0, 0, 0, 1);

    abstract projectionMatrix: number[];
    abstract viewMatrix: number[];
    resetparams(): void {
        this.rotxrad = 0;
        this.rotyrad = 0;
        this.rotzrad = 0;
        this.translatex = 0;
        this.translatey = 0;
        this.translatez = 0;
        this.zoom = 1;
    }
}

class OrthoCamera extends Camera {
    mode: CameraMode = CameraMode.Ortho;
    projectionMatrix: number[] = [];
    viewMatrix: number[] = [];
    constructor() {
        super();
    }
    updateProjectionMatrix(w: number, h: number, d: number): void {
        this.projectionMatrix = [
            2 / w, 0, 0, 0,
            0, 2 / h, 0, 0,
            0, 0, 2 / d, 0,
            -1, -1, 0, 1
        ];
    }
    updateViewMatrix(): void {
        this.viewMatrix = m4util.xRotation(this.rotxrad);
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.yRotation(this.rotyrad));
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.zRotation(this.rotzrad));
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.scaling(1/this.zoom, 1/this.zoom, 1/this.zoom));
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.translation(this.translatex, this.translatey, this.translatez));
        this.viewMatrix = m4util.inverse(this.viewMatrix);
    }
}

class PerspectiveCamera extends Camera {
    mode: CameraMode = CameraMode.Perspective;
    projectionMatrix: number[] = [];
    viewMatrix: number[] = [];
    constructor() {
        super();
    }
    updateProjectionMatrix(fovRad: number, ratio: number, zneari: number, zfari: number): void {
        let znear = -zfari
        let zfar = -zneari
        let f = Math.tan(Math.PI * 0.5 - 0.5 * fovRad);
        let rangeInv = 1.0 / (znear - zfar);
        //alert(`f: ${f}, rangeInv: ${rangeInv}, ratio: ${ratio}, znear: ${znear}, zfar: ${zfar}`)
        this.projectionMatrix = [
            f/ratio , 0, 0, 0,
            0, f, 0, 0,
            0, 0, (znear + zfar) * rangeInv, 1,
            0, 0, znear * zfar * rangeInv * 2, 0
        ];
    }
    updateViewMatrix(): void {
        let tviewMatrix = m4util.yRotation(this.rotyrad);
        // tviewMatrix = m4util.multiply(tviewMatrix, m4util.zRotation(this.rotzrad));
        tviewMatrix = m4util.multiply(tviewMatrix, m4util.translation(this.translatex, this.translatey, this.translatez + this.zoom * 100));
        this.viewMatrix = tviewMatrix
        this.viewMatrix = m4util.inverse(this.viewMatrix);
    }
}

class ObliqueCamera extends Camera {
    mode: CameraMode = CameraMode.Oblique;
    projectionMatrix: number[] = [];
    viewMatrix: number[] = [];
    constructor() {
        super();
    }
    updateProjectionMatrix(thetaRad: number, phiRad: number, w: number, h: number, d: number): void {
        let epsilon = 0.00001
        let cotT = -1 / Math.tan(thetaRad + epsilon)
        let cotP = -1 / Math.tan(phiRad + epsilon)
        // alert(`thetaRad: ${thetaRad} phiRad: ${phiRad} cotT: ${cotT}, cotP: ${cotP}, w: ${w}, h: ${h}, d: ${d}`)
        let oblique = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            cotT, cotP, 1, 0,
            0, 0, 0, 1
        ]
        let ortho = [
            2 / w, 0, 0, 0,
            0, 2 / h, 0, 0,
            0, 0, 2 / d, 0,
            -1, -1, 0, 1
        ]
        this.projectionMatrix = m4util.multiply(oblique, ortho);
        // console.log(this.projectionMatrix)
    }
    updateViewMatrix(): void {
        this.viewMatrix = m4util.xRotation(this.rotxrad);
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.yRotation(this.rotyrad));
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.zRotation(this.rotzrad));
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.scaling(1/this.zoom, 1/this.zoom, 1/this.zoom));
        this.viewMatrix = m4util.multiply(this.viewMatrix, m4util.translation(this.translatex, this.translatey, this.translatez + this.zoom));
        this.viewMatrix = m4util.inverse(this.viewMatrix);
        // console.log("Vmtrx", this.viewMatrix)
    }
}


export {
    Vertex,
    Shape,
    Point,
    Color,
    CameraMode,
    Camera,
    OrthoCamera,
    PerspectiveCamera,
    ObliqueCamera
}