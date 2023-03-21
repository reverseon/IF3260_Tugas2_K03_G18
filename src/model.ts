import {Point, Shape, Vertex, Color} from "./lib/baseClass";
import {createProgramFromShaderSources, m4util} from "./lib/util";
class ZeroHollow extends Shape {
    startingPoint: Point = new Point(0, 0, 0, 1);
    dx: number = 0;
    dy: number = 0;
    dz: number = 0;
    thick: number = 0;

    rotxrad: number = 0;
    rotyrad: number = 0;
    rotzrad: number = 0;
    vertices: Vertex[] = [];

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
        this.startingPoint = new Point(json.info.sx, json.info.sy, json.info.sz, 1);
        this.dx = json.info.dx
        this.dy = json.info.dy
        this.dz = json.info.dz
        this.thick = json.info.t
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
            -this.startingPoint.x - 0.5*this.dx,
            -this.startingPoint.y - 0.5*this.dy,
            -this.startingPoint.z - 0.5*this.dz
        );
        let rotxmat = m4util.xRotation(this.rotxrad);
        let rotymat = m4util.yRotation(this.rotyrad);
        let rotzmat = m4util.zRotation(this.rotzrad);
        let toStart = m4util.translation(
            this.startingPoint.x + 0.5*this.dx,
            this.startingPoint.y + 0.5*this.dy,
            this.startingPoint.z + 0.5*this.dz
        );
        matrix = m4util.multiply(matrix, toStart);
        matrix = m4util.multiply(matrix, rotxmat);
        matrix = m4util.multiply(matrix, rotymat);
        matrix = m4util.multiply(matrix, rotzmat);
        matrix = m4util.multiply(matrix, toOrigin);
        gl.uniformMatrix4fv(uMatrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }
}

export {
    ZeroHollow
}