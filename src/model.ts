import { version } from "eslint-scope";
import {Point, Shape, Vertex, Color} from "./lib/baseClass";
import {createProgramFromShaderSources, m4util} from "./lib/util";
class ZeroHollow extends Shape {
    vertices: Vertex[] = [];
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
    async loadfile() {
        const response = await fetch(require("./base/zerohollow.json"));
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
        let matrix = m4util.projection((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight);
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
        let matrix = m4util.projection((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight);
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
    center: Point = new Point(100,100,100,0);
    vertices : Vertex[] = [];
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
        gl.enable(gl.DEPTH_TEST);
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
        let projectionMatrix = m4util.projection((gl.canvas as HTMLCanvasElement).clientWidth, (gl.canvas as HTMLCanvasElement).clientHeight);
        //let projectionMatrix = m4util.perspective(1.7, ((gl.canvas as HTMLCanvasElement).clientWidth as GLfloat)/((gl.canvas as HTMLCanvasElement).clientHeight as GLfloat), 1, 1000 );
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
        let cam = [100,100,-50];
        let tar = [100, 100, 100];
        let up = [0,1,0];
        let cameraMatrix = m4util.lookat(cam, tar, up);
        let viewMatrix = m4util.inverse(cameraMatrix);
        let projectionViewMatrix = m4util.multiply(projectionMatrix, viewMatrix);
        let matrix = projectionViewMatrix;
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