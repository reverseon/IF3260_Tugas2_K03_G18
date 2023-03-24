import {CameraMode, Color, Point, Shape, Vertex} from "./lib/baseClass";
import {createProgramFromShaderSources, m4util} from "./lib/util";

class ZeroHollow extends Shape {
    points: Point[] = [];
    indices: number[] = [];
    colors: Color[] = [];
    renderedVertices: Vertex[] = [];
    center: Point = new Point(0, 0, 0, 1);


    constructor(gl: WebGLRenderingContext) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `
        super([],
            createProgramFromShaderSources(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )!
        );
    }
    private hexToColor(hex: string): Color {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;
        return new Color(r, g, b, 1);
    }
    async loadfile() {
        const response = await fetch(require("./base/zerohollow.json"));
        const jsonraw = await response.json();
        const json = jsonraw.zeroHollow
        this.points = json.vertices.map(
            (v: any) => {
                return new Point(v.x, v.y, v.z, 1);
            }
        )
        this.indices = json.indices;
        this.colors = json.hexColors.map(
            (hex: string) => this.hexToColor(hex)
        )
        let fpoint = this.points[0]
        let lpoint = this.points[10]
        let dx = lpoint.x - fpoint.x
        let dy = lpoint.y - fpoint.y
        let dz = lpoint.z - fpoint.z
        this.center = new Point(
            fpoint.x + dx / 2,
            fpoint.y + dy / 2,
            fpoint.z + dz / 2,
            1
        )
    }
    private createRenderedVertices(): void {
        this.renderedVertices = []
        for (let i = 0; i < this.indices.length/6; i++) {
            for (let j = 0; j < 6; j++) {
                let index = this.indices[i*6 + j]
                let point = this.points[index]
                let color = this.colors[i]
                this.renderedVertices.push(new Vertex(point, color))
            }
        }
    }
    private verticesToF32PointArray(vertex: Vertex[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < vertex.length; i++) {
            array.push(vertex[i].position.x);
            array.push(vertex[i].position.y);
            array.push(vertex[i].position.z);
            array.push(vertex[i].position.w);
        }
        return new Float32Array(array);
    }
    private verticesToF32ColorArray(vertex: Vertex[]): Float32Array {
        let array: number[] = [];
        for (let i = 0; i < vertex.length; i++) {
            array.push(vertex[i].color.r);
            array.push(vertex[i].color.g);
            array.push(vertex[i].color.b);
            array.push(vertex[i].color.a);
        }
        return new Float32Array(array);
    }
    resetparams() {
        super.resetparams();
        this.orthoInstance.resetparams();
        this.perspectiveInstance.resetparams();
    }

    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        this.createRenderedVertices();
        let positionArray = this.verticesToF32PointArray(this.renderedVertices);
        let colorArray = this.verticesToF32ColorArray(this.renderedVertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix: number[] = []
        let depth = 1000;
        if (this.camMode == CameraMode.Ortho) {
            this.orthoInstance.updateProjectionMatrix((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight, depth);
            this.orthoInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.orthoInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            // this.orthoInstance.translatez = -depth / 2;
            this.orthoInstance.updateViewMatrix();
            matrix = m4util.multiply(this.orthoInstance.projectionMatrix, this.orthoInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Perspective) {
            this.perspectiveInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight,
                1,
                depth,
            )
            // this.perspectiveInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            // this.perspectiveInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.perspectiveInstance.translatez = -depth / 2;
            this.perspectiveInstance.updateViewMatrix();
            matrix = m4util.multiply(this.perspectiveInstance.projectionMatrix, this.perspectiveInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Oblique) {
            this.obliqueInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                45 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth,
                (gl.canvas as HTMLCanvasElement).clientHeight,
                depth,
            )
            this.obliqueInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.obliqueInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            // this.obliqueInstance.translatez = -depth / 2;
            this.obliqueInstance.updateViewMatrix();
            matrix = m4util.multiply(this.obliqueInstance.projectionMatrix, this.obliqueInstance.viewMatrix);
            // matrix = this.obliqueInstance.projectionMatrix;
        }
        let toOrigin = m4util.translation(
            -this.center.x,
            -this.center.y,
            -this.center.z
        );
        let rotxmat = m4util.xRotation(this.rotxrad);
        let rotymat = m4util.yRotation(this.rotyrad);
        let rotzmat = m4util.zRotation(this.rotzrad);
        let translatemat = m4util.translation(
            this.translatex,
            this.translatey,
            this.translatez
        );
        let scalemat = m4util.scaling(
            this.scalex,
            this.scaley,
            this.scalez
        );
        let toCenter = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        );
        matrix = m4util.multiply(matrix, toCenter);
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.renderedVertices.length)
        // for (let i = 0; i < posCopy.length; i++) {
        //     let ps = posCopy[i];
        //     let p = m4util.matvec(matrix, [
        //             ps.x,
        //             ps.y,
        //             ps.z,
        //             ps.w
        //     ])
        //     console.log(ps, [
        //         p[0] / p[3],
        //         p[1] / p[3],
        //         p[2] / p[3],
        //         p[3]
        //     ])
        // }
        // console.log(matrix)
    }
}
class TriangularPrism extends Shape {
    vertices: Vertex[] = [];
    center: Point = new Point(150, 150, 195, 1);

    constructor(gl: WebGLRenderingContext) {
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `
        super([],
            createProgramFromShaderSources(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )!
        );
    }
    async loadfile() {
        const response = await fetch(require("./base/triangularprism.json"));
        const json = await response.json();
        this.vertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        })
        this.center = new Point(json.center.x, json.center.y, json.center.z, 1);
    }
    private verticesToF32ArrayPoint(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.position.x;
            f32Array[i * 4 + 1] = vertex.position.y;
            f32Array[i * 4 + 2] = vertex.position.z;
            f32Array[i * 4 + 3] = vertex.position.w;
        }
        return f32Array;
    }
    private verticesToF32ArrayColor(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.color.r;
            f32Array[i * 4 + 1] = vertex.color.g;
            f32Array[i * 4 + 2] = vertex.color.b;
            f32Array[i * 4 + 3] = vertex.color.a;
        }
        return f32Array;
    }

    resetparams() {
        super.resetparams();
        this.orthoInstance.resetparams();
        this.perspectiveInstance.resetparams();
    }

    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let vertices = this.vertices;
        let positionArray = this.verticesToF32ArrayPoint(vertices);
        let colorArray = this.verticesToF32ArrayColor(vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix: number[] = []
        let depth = 1000;
        if (this.camMode == CameraMode.Ortho) {
            this.orthoInstance.updateProjectionMatrix((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight, depth);
            this.orthoInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.orthoInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            // this.orthoInstance.translatez = -depth / 2;
            this.orthoInstance.updateViewMatrix();
            matrix = m4util.multiply(this.orthoInstance.projectionMatrix, this.orthoInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Perspective) {
            this.perspectiveInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight,
                1,
                depth,
            )
            // this.perspectiveInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            // this.perspectiveInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.perspectiveInstance.translatez = -depth / 2;
            this.perspectiveInstance.updateViewMatrix();
            matrix = m4util.multiply(this.perspectiveInstance.projectionMatrix, this.perspectiveInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Oblique) {
            this.obliqueInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                45 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth,
                (gl.canvas as HTMLCanvasElement).clientHeight,
                depth,
            )
            this.obliqueInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.obliqueInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            // this.obliqueInstance.translatez = -depth / 2;
            this.obliqueInstance.updateViewMatrix();
            matrix = m4util.multiply(this.obliqueInstance.projectionMatrix, this.obliqueInstance.viewMatrix);
            // matrix = this.obliqueInstance.projectionMatrix;
        }
        let toOrigin = m4util.translation(
            -this.center.x,
            -this.center.y,
            -this.center.z
        );
        let rotxmat = m4util.xRotation(this.rotxrad);
        let rotymat = m4util.yRotation(this.rotyrad);
        let rotzmat = m4util.zRotation(this.rotzrad);
        let translatemat = m4util.translation(
            this.translatex,
            this.translatey,
            this.translatez
        );
        let scalemat = m4util.scaling(
            this.scalex,
            this.scaley,
            this.scalez
        );
        let toCenter = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        );
        matrix = m4util.multiply(matrix, toCenter);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, toOrigin);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

class Tetrahedron extends Shape{
    vertices: Vertex[] = [];
    center: Point = new Point(100,100,100,1);
    constructor(gl: WebGLRenderingContext){
        const vertexShaderSource = `
            attribute vec4 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            uniform mat4 u_matrix;
            void main() {
                v_color = a_color;
                gl_Position = u_matrix * a_position;
            }
        `
        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `

        super([],
            createProgramFromShaderSources(
                gl,
                vertexShaderSource,
                fragmentShaderSource
            )!
        )
    }
    async loadfile() {
        const response = await fetch(require("./base/tetrahedron.json"));
        const json = await response.json();
        this.vertices = json.vertices.map((v: any) => {
            return new Vertex(
                new Point(v.position.x, v.position.y, v.position.z, v.position.w),
                new Color(v.color.r, v.color.g, v.color.b, v.color.a)
            )
        })
        this.center = new Point(json.center.x, json.center.y, json.center.z, 1);
    }

    private verticesToF32ArrayPoint(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.position.x;
            f32Array[i * 4 + 1] = vertex.position.y;
            f32Array[i * 4 + 2] = vertex.position.z;
            f32Array[i * 4 + 3] = vertex.position.w;
        }
        return f32Array;
    }
    private verticesToF32ArrayColor(vertices: Vertex[]): Float32Array {
        const f32Array = new Float32Array(vertices.length * 4);
        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            f32Array[i * 4] = vertex.color.r;
            f32Array[i * 4 + 1] = vertex.color.g;
            f32Array[i * 4 + 2] = vertex.color.b;
            f32Array[i * 4 + 3] = vertex.color.a;
        }
        return f32Array;
    }

    resetparams(): void {
        super.resetparams();
        this.orthoInstance.resetparams();
        this.perspectiveInstance.resetparams();
    }
    draw(gl: WebGLRenderingContext): void {
        gl.useProgram(this.program);
        let positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        let colorAttributeLocation = gl.getAttribLocation(this.program, "a_color");
        let uMatrixLocation = gl.getUniformLocation(this.program, "u_matrix");
        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();
        let vertices = this.vertices;
        let positionArray = this.verticesToF32ArrayPoint(vertices);
        let colorArray = this.verticesToF32ArrayColor(vertices);
        /*gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CW);*/
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 4, gl.FLOAT, false, 0, 0);
        let matrix : number[] = [];
        let depth = 1000;
        if (this.camMode == CameraMode.Ortho){
            this.orthoInstance.updateProjectionMatrix((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight, depth);
            this.orthoInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.orthoInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.orthoInstance.updateViewMatrix();
            matrix = m4util.multiply(this.orthoInstance.projectionMatrix, this.orthoInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Perspective) {
            this.perspectiveInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight,
                1,
                depth,
            )
            // this.perspectiveInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            // this.perspectiveInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            this.perspectiveInstance.translatez = -depth / 2;
            this.perspectiveInstance.updateViewMatrix();
            matrix = m4util.multiply(this.perspectiveInstance.projectionMatrix, this.perspectiveInstance.viewMatrix);
        } else if (this.camMode == CameraMode.Oblique) {
            this.obliqueInstance.updateProjectionMatrix(
                60 * Math.PI / 180,
                45 * Math.PI / 180,
                (gl.canvas as HTMLCanvasElement).clientWidth,
                (gl.canvas as HTMLCanvasElement).clientHeight,
                depth,
            )
            this.obliqueInstance.translatex = -(gl.canvas as HTMLCanvasElement).clientWidth / 2;
            this.obliqueInstance.translatey = -(gl.canvas as HTMLCanvasElement).clientHeight / 2;
            // this.obliqueInstance.translatez = -depth / 2;
            this.obliqueInstance.updateViewMatrix();
            matrix = m4util.multiply(this.obliqueInstance.projectionMatrix, this.obliqueInstance.viewMatrix);
            // matrix = this.obliqueInstance.projectionMatrix;
        }
        let toOrigin = m4util.translation(
            -this.center.x,
            -this.center.y,
            -this.center.z
        );
        let rotxmat = m4util.xRotation(this.rotxrad);
        let rotymat = m4util.yRotation(this.rotyrad);
        let rotzmat = m4util.zRotation(this.rotzrad);
        let translatemat = m4util.translation(
            this.translatex,
            this.translatey,
            this.translatez
        );
        let scalemat = m4util.scaling(
            this.scalex,
            this.scaley,
            this.scalez
        );
        let toCenter = m4util.translation(
            this.center.x,
            this.center.y,
            this.center.z
        );
        matrix = m4util.multiply(matrix, toCenter);
        matrix = m4util.multiply(matrix, translatemat);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, scalemat);
        matrix = m4util.multiply(matrix, toOrigin);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

export {
    ZeroHollow,
    Tetrahedron, TriangularPrism
}